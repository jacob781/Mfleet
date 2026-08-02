"""Compliance documents: serve uploaded files (login-gated) and surface
expiring/expired documents as alerts for the admin bell + email digest."""

from datetime import date, timedelta
from typing import Annotated, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

import uploads
from database import get_session
from dependencies import get_current_user, get_current_user_file
from models import (
    DRIVER_TERMINATED,
    EXPIRY_SOON_DAYS,
    Company,
    ComplianceDocument,
    Driver,
    Truck,
    User,
    doc_status,
)
from schemas import AlertItem, ComplianceDocumentResponse, DocFlag

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


# Which document types each side of the fleet must have. Defined here because both
# the drivers and trucks routers already import from this module.
DRIVER_DOC_TYPES = {"cdl", "medical_cert"}
TRUCK_DOC_TYPES = ("annual_inspection", "registration")


def owners_with_file(column, doc_label: str):
    """Sub-select of driver_id/truck_id values that have a FILE on record for this
    document type — powers the has/hasn't list filters. An expiry row without a
    file does not count as "have the document"."""
    return select(column).where(
        ComplianceDocument.document_type == doc_label,
        ComplianceDocument.file_path.is_not(None),
        column.is_not(None),   # a NULL in the set would make NOT IN match nothing
    )


def doc_flags(session, column, owner_ids: List[int], doc_types: Dict[str, str]) -> Dict[int, List[DocFlag]]:
    """Per-owner document problems for the list badges, in ONE query.
    {owner_id: [DocFlag(doc=<doc_type key>, state=missing|expired|expiring)]} —
    only what's wrong; an empty list means every required document is valid.
    `doc_types` maps the doc_type key to its ComplianceDocument.document_type label."""
    if not owner_ids:
        return {}
    rows = session.exec(select(ComplianceDocument).where(column.in_(owner_ids))).all()
    by_owner: Dict[int, Dict[str, ComplianceDocument]] = {}
    for row in rows:
        by_owner.setdefault(getattr(row, column.key), {})[row.document_type] = row

    out: Dict[int, List[DocFlag]] = {}
    for owner_id in owner_ids:
        docs = by_owner.get(owner_id, {})
        flags: List[DocFlag] = []
        for key, label in doc_types.items():
            row = docs.get(label)
            if row is None or not row.file_path:   # an expiry without a file is not a document
                flags.append(DocFlag(doc=key, state="missing"))
                continue
            status = doc_status(row.expiry_date)
            if status == "Expired":
                flags.append(DocFlag(doc=key, state="expired"))
            elif status == "Expiring Soon":
                flags.append(DocFlag(doc=key, state="expiring"))
        out[owner_id] = flags
    return out


def doc_response(doc: ComplianceDocument) -> ComplianceDocumentResponse:
    """Map a ComplianceDocument to its API DTO with live (recomputed) status."""
    return ComplianceDocumentResponse(
        id=doc.id,
        driver_id=doc.driver_id,
        truck_id=doc.truck_id,
        document_type=doc.document_type,
        issue_date=doc.issue_date,
        expiry_date=doc.expiry_date,
        status=doc_status(doc.expiry_date),
        has_file=bool(doc.file_path),
        is_image=bool(doc.file_path) and doc.file_path.lower().endswith(".jpg"),
    )


@router.get("/documents/{doc_id}/file")
def download_document(
    doc_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user_file)],
) -> FileResponse:
    doc = session.get(ComplianceDocument, doc_id)
    if not doc or not doc.file_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document file not found")
    path = uploads.resolve(doc.file_path)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="File missing")
    return uploads.file_response(path)


@router.post("/documents/{doc_id}/rotate", response_model=ComplianceDocumentResponse)
def rotate_document(
    doc_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    deg: int = 90,
) -> ComplianceDocumentResponse:
    """Rotate a stored photo 90° at a time. The file is replaced on disk, so every
    place that serves it (drawer preview, contract merge) picks the new one up."""
    doc = session.get(ComplianceDocument, doc_id)
    if not doc or not doc.file_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document file not found")
    try:
        uploads.rotate(doc.file_path, deg)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return doc_response(doc)


def collect_alerts(
    session: Session, days: int = EXPIRY_SOON_DAYS, include_missing: bool = False,
) -> List[AlertItem]:
    """Documents expiring within `days` or already expired, most urgent first.
    With `include_missing`, documents that were never uploaded are listed too — they
    have no row and no dates, so they cannot come out of the expiry query.
    Shared by the alerts endpoint and the email digest script."""
    today = date.today()
    cutoff = today + timedelta(days=days)
    docs = session.exec(
        select(ComplianceDocument)
        .where(ComplianceDocument.expiry_date != None)  # noqa: E711 - null = no date, skip
        .where(ComplianceDocument.expiry_date <= cutoff)
        .order_by(ComplianceDocument.expiry_date)
    ).all()
    alerts: List[AlertItem] = []
    for d in docs:
        if d.driver_id is not None:
            drv = session.get(Driver, d.driver_id)
            if drv is None:
                continue
            if drv.status == DRIVER_TERMINATED:
                continue   # they left; their expiring CDL is nobody's problem now
            subject = f"{drv.first_name} {drv.last_name}".strip()
            kind, company_id = "driver", drv.company_id
        elif d.truck_id is not None:
            trk = session.get(Truck, d.truck_id)
            if trk is None:
                continue
            subject = f"{trk.make} {trk.year} ({trk.plate_number})".strip()
            kind, company_id = "truck", trk.company_id
        else:
            continue
        alerts.append(
            AlertItem(
                document_id=d.id,
                document_type=d.document_type,
                expiry_date=d.expiry_date,
                status=doc_status(d.expiry_date),
                days_left=(d.expiry_date - today).days,
                subject=subject,
                subject_kind=kind,
                driver_id=d.driver_id,
                truck_id=d.truck_id,
                company_id=company_id,
            )
        )
    # Company owner-license expiries (no ComplianceDocument row — synthetic id).
    companies = session.exec(
        select(Company).where(
            Company.owner_license_expiry != None,  # noqa: E711
            Company.owner_license_expiry <= cutoff,
        )
    ).all()
    for c in companies:
        alerts.append(
            AlertItem(
                document_id=-c.id,  # synthetic (negative) — no document row
                document_type="Owner License",
                expiry_date=c.owner_license_expiry,
                status=doc_status(c.owner_license_expiry),
                days_left=(c.owner_license_expiry - today).days,
                subject=c.name,
                subject_kind="company",
                company_id=c.id,
            )
        )
    if include_missing:
        alerts += _missing_alerts(session)
    # Missing documents first (no date at all), then by how soon the rest expire.
    alerts.sort(key=lambda a: (a.expiry_date is not None, a.expiry_date or today))
    return alerts


def _missing_alerts(session: Session) -> List[AlertItem]:
    """One item per required document that has no file on record. Reuses doc_flags,
    the same source the list badges are drawn from, so the two never disagree."""
    out: List[AlertItem] = []

    drivers = list(session.exec(
        select(Driver).where(Driver.status != DRIVER_TERMINATED)
    ).all())
    flags = doc_flags(
        session, ComplianceDocument.driver_id, [d.id for d in drivers],
        {k: uploads.DOC_TYPES[k] for k in sorted(DRIVER_DOC_TYPES)},
    )
    for drv in drivers:
        for flag in flags[drv.id]:
            if flag.state != "missing":
                continue   # expired/expiring already came out of the expiry query
            out.append(AlertItem(
                document_type=uploads.DOC_TYPES[flag.doc],
                status="Missing",
                subject=f"{drv.first_name} {drv.last_name}".strip(),
                subject_kind="driver",
                driver_id=drv.id,
                company_id=drv.company_id,
            ))

    trucks = list(session.exec(select(Truck)).all())
    flags = doc_flags(
        session, ComplianceDocument.truck_id, [t.id for t in trucks],
        {k: uploads.DOC_TYPES[k] for k in TRUCK_DOC_TYPES},
    )
    for trk in trucks:
        for flag in flags[trk.id]:
            if flag.state != "missing":
                continue
            out.append(AlertItem(
                document_type=uploads.DOC_TYPES[flag.doc],
                status="Missing",
                subject=f"{trk.make} {trk.year} ({trk.plate_number})".strip(),
                subject_kind="truck",
                truck_id=trk.id,
                company_id=trk.company_id,
            ))

    for c in session.exec(select(Company).where(Company.owner_license_path.is_(None))).all():
        out.append(AlertItem(
            document_type="Owner License",
            status="Missing",
            subject=c.name,
            subject_kind="company",
            company_id=c.id,
        ))
    return out


@router.get("/alerts", response_model=List[AlertItem])
def list_alerts(
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    days: int = EXPIRY_SOON_DAYS,
) -> List[AlertItem]:
    # The screen is "what needs attention", so a document nobody uploaded belongs on
    # it. The nightly email keeps to expiries (see notify_expiring.py).
    return collect_alerts(session, days, include_missing=True)
