"""Compliance documents: serve uploaded files (login-gated) and surface
expiring/expired documents as alerts for the admin bell + email digest."""

from datetime import date, timedelta
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

import uploads
from database import get_session
from dependencies import get_current_user, get_current_user_file
from models import EXPIRY_SOON_DAYS, Company, ComplianceDocument, Driver, Truck, User, doc_status
from schemas import AlertItem, ComplianceDocumentResponse

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


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


def collect_alerts(session: Session, days: int = EXPIRY_SOON_DAYS) -> List[AlertItem]:
    """Documents expiring within `days` or already expired, most urgent first.
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
    alerts.sort(key=lambda a: a.expiry_date)
    return alerts


@router.get("/alerts", response_model=List[AlertItem])
def list_alerts(
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    days: int = EXPIRY_SOON_DAYS,
) -> List[AlertItem]:
    return collect_alerts(session, days)
