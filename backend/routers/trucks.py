"""Trucks router: managers list, create, edit, and delete fleet vehicles."""

from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session, select

import cascade
import uploads
from database import get_session
from dependencies import get_current_user
from models import (
    TEV_ADDED,
    TEV_REACTIVATED,
    TEV_TERMINATED,
    TRUCK_TERMINATED,
    ComplianceDocument,
    Truck,
    TruckEvent,
    User,
)
from routers.compliance import (
    TRUCK_DOC_TYPES,
    current_docs,
    parse_date,
    doc_flags,
    doc_response,
    owners_with_file,
    upsert_version,
)

from schemas import (
    ComplianceDocumentResponse,
    TruckCreate,
    TruckDetail,
    TruckResponse,
    TruckUpdate,
)

router = APIRouter(prefix="/api/trucks", tags=["Trucks"])


@router.post("", response_model=TruckResponse, status_code=status.HTTP_201_CREATED)
def create_truck(
    body: TruckCreate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Truck:
    truck = Truck(**body.model_dump())
    session.add(truck)
    session.flush()          # need the id to open the timeline
    session.add(TruckEvent(truck_id=truck.id, kind=TEV_ADDED, date=date.today()))
    session.commit()
    session.refresh(truck)
    return truck


@router.get("", response_model=List[TruckResponse])
def list_trucks(
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    company_id: Optional[int] = None,
    checklist: Optional[bool] = None,
    doc: Optional[str] = None,
    has_doc: Optional[bool] = None,
    truck_status: Optional[str] = None,
) -> List[TruckResponse]:
    """`doc` + `has_doc` filter by document on file, e.g. doc=registration&has_doc=false
    lists vehicles missing their cab card. doc=any is the catch-all: has_doc=false lists
    every truck with at least one document problem (missing, expired or expiring).
    Each row carries its document health (doc_state/doc_note) for the list indicator."""
    stmt = select(Truck)
    if company_id is not None:
        stmt = stmt.where(Truck.company_id == company_id)
    if checklist is not None:
        stmt = stmt.where(Truck.checklist_checked == checklist)
    if truck_status:
        stmt = stmt.where(Truck.status == truck_status)
    if doc is not None and has_doc is not None and doc != "any":
        if doc not in TRUCK_DOC_TYPES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Unsupported document type")
        sub = owners_with_file(ComplianceDocument.truck_id, uploads.DOC_TYPES[doc])
        stmt = stmt.where(Truck.id.in_(sub)) if has_doc else stmt.where(Truck.id.not_in(sub))

    trucks = list(session.exec(stmt).all())
    flags = doc_flags(
        session, ComplianceDocument.truck_id, [t.id for t in trucks],
        {k: uploads.DOC_TYPES[k] for k in TRUCK_DOC_TYPES},
    )
    out = []
    for truck in trucks:
        row = TruckResponse.model_validate(truck)
        row.doc_flags = flags[truck.id]
        out.append(row)
    # "any" filters on the flags themselves — they are already computed, no extra query.
    if doc == "any" and has_doc is not None:
        out = [r for r in out if bool(r.doc_flags) != has_doc]
    return out


@router.patch("/{truck_id}", response_model=TruckResponse)
def update_truck(
    truck_id: int,
    body: TruckUpdate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Truck:
    truck = session.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Truck not found")
    was_terminated = truck.status == TRUCK_TERMINATED
    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(truck, field, value)
    # Same lifecycle as a driver: taking a truck off the road stamps the date unless
    # the manager sent one (correcting an old record), putting it back keeps it, and
    # the full history lives in TruckEvent.
    logged_termination = False
    if "status" in data:
        now_terminated = data["status"] == TRUCK_TERMINATED
        if now_terminated and not was_terminated:
            if "termination_date" not in data:
                truck.termination_date = date.today()
            session.add(TruckEvent(
                truck_id=truck.id, kind=TEV_TERMINATED,
                date=truck.termination_date or date.today(),
            ))
            logged_termination = True
        elif was_terminated and not now_terminated:
            session.add(TruckEvent(
                truck_id=truck.id, kind=TEV_REACTIVATED, date=date.today(),
            ))
    # Editing the date is a correction, not a second termination: move the entry so
    # the timeline keeps agreeing with the column.
    if data.get("termination_date") and not logged_termination:
        ev = session.exec(
            select(TruckEvent)
            .where(TruckEvent.truck_id == truck.id, TruckEvent.kind == TEV_TERMINATED)
            .order_by(TruckEvent.date.desc(), TruckEvent.id.desc())
        ).first()
        if ev is not None and ev.date != truck.termination_date:
            ev.date = truck.termination_date
            session.add(ev)
    session.add(truck)
    session.commit()
    session.refresh(truck)
    return truck


@router.get("/{truck_id}", response_model=TruckDetail)
def get_truck(
    truck_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> TruckDetail:
    """One truck with its in-service timeline (the list does not carry events)."""
    truck = session.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Truck not found")
    return TruckDetail.model_validate(truck)


@router.get("/{truck_id}/documents", response_model=List[ComplianceDocumentResponse])
def list_truck_documents(
    truck_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> List[ComplianceDocumentResponse]:
    docs = session.exec(
        current_docs().where(ComplianceDocument.truck_id == truck_id)
    ).all()
    return [doc_response(d) for d in docs]


@router.post("/{truck_id}/documents/{doc_type}", response_model=ComplianceDocumentResponse)
def upsert_truck_document(
    truck_id: int,
    doc_type: str,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    file: Annotated[Optional[UploadFile], File()] = None,
    expiry: Annotated[Optional[str], Form()] = None,
    issue: Annotated[Optional[str], Form()] = None,
    number: Annotated[Optional[str], Form()] = None,
) -> ComplianceDocumentResponse:
    """Manager attaches/updates a truck document (annual inspection or registration).
    A new file starts a new version and keeps the old one; without a file this edits
    the current record. See compliance.upsert_version."""
    truck = session.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Truck not found")
    if doc_type not in TRUCK_DOC_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Unsupported document type")
    exp = parse_date(expiry, "expiry")
    iss = parse_date(issue, "issue")
    file_path = None
    if file is not None:
        try:
            file_path = uploads.save_truck(truck_id, doc_type, file.file.read())
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    row = upsert_version(
        session, ComplianceDocument.truck_id == truck_id,
        truck_id=truck_id, label=uploads.DOC_TYPES[doc_type],
        file_path=file_path, expiry=exp, issue=iss, number=(number or None),
    )
    session.commit()
    session.refresh(row)
    return doc_response(row)


@router.get("/{truck_id}/documents/{doc_type}/history",
            response_model=List[ComplianceDocumentResponse])
def truck_document_history(
    truck_id: int,
    doc_type: str,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> List[ComplianceDocumentResponse]:
    """Every version of one truck document, newest first — see the driver equivalent."""
    if doc_type not in TRUCK_DOC_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Unsupported document type")
    rows = session.exec(
        select(ComplianceDocument).where(
            ComplianceDocument.truck_id == truck_id,
            ComplianceDocument.document_type == uploads.DOC_TYPES[doc_type],
        )
    ).all()
    # The version in force always leads — see the driver-side history for why.
    rows = sorted(rows, key=lambda d: (d.superseded_at is None, d.issue_date or date.min, d.id),
                  reverse=True)
    return [doc_response(d) for d in rows]


@router.delete("/{truck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_truck(
    truck_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> None:
    truck = session.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Truck not found")
    cascade.delete_truck(session, truck)
    session.commit()
