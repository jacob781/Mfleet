"""Trucks router: managers list, create, edit, and delete fleet vehicles."""

from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session, select

import cascade
import uploads
from database import get_session
from dependencies import get_current_user
from models import ComplianceDocument, Truck, User
from routers.compliance import TRUCK_DOC_TYPES, doc_flags, doc_response, owners_with_file
from schemas import ComplianceDocumentResponse, TruckCreate, TruckResponse, TruckUpdate

router = APIRouter(prefix="/api/trucks", tags=["Trucks"])


@router.post("", response_model=TruckResponse, status_code=status.HTTP_201_CREATED)
def create_truck(
    body: TruckCreate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Truck:
    truck = Truck(**body.model_dump())
    session.add(truck)
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
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(truck, field, value)
    session.add(truck)
    session.commit()
    session.refresh(truck)
    return truck


@router.get("/{truck_id}/documents", response_model=List[ComplianceDocumentResponse])
def list_truck_documents(
    truck_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> List[ComplianceDocumentResponse]:
    docs = session.exec(
        select(ComplianceDocument).where(ComplianceDocument.truck_id == truck_id)
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
) -> ComplianceDocumentResponse:
    """Manager attaches/updates a truck document (annual inspection or registration):
    saves the file and/or sets the expiry, upserting the ComplianceDocument for alerts."""
    truck = session.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Truck not found")
    if doc_type not in TRUCK_DOC_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Unsupported document type")
    exp: Optional[date] = None
    if expiry:
        try:
            exp = date.fromisoformat(expiry[:10])
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid expiry date")
    file_path = None
    if file is not None:
        try:
            file_path = uploads.save_truck(truck_id, doc_type, file.file.read())
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    label = uploads.DOC_TYPES[doc_type]
    row = session.exec(
        select(ComplianceDocument).where(
            ComplianceDocument.truck_id == truck_id,
            ComplianceDocument.document_type == label,
        )
    ).first()
    if row is None:
        if exp is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Expiry date is required")
        row = ComplianceDocument(truck_id=truck_id, document_type=label,
                                 issue_date=date.today(), expiry_date=exp, file_path=file_path)
        session.add(row)
    else:
        if exp is not None:
            row.expiry_date = exp
        if file_path:
            row.file_path = file_path
    session.add(row)
    session.commit()
    session.refresh(row)
    return doc_response(row)


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
