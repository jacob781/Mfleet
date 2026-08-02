"""Drivers router: managers list drivers (e.g. to attach to a new application).

Returns DriverSummary which never includes the SSN.
"""

from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session, select

import cascade
import uploads
from database import get_session
from dependencies import get_current_user
from models import (
    DRIVER_TERMINATED,
    Company,
    ComplianceDocument,
    Driver,
    DriverApplication,
    User,
)
from routers.compliance import doc_flags, doc_response, owners_with_file
from schemas import (
    ComplianceDocumentResponse,
    DriverApplicationBrief,
    DriverCreate,
    DriverDetail,
    DriverSummary,
    DriverUpdate,
)

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


@router.get("", response_model=List[DriverSummary])
def list_drivers(
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    company_id: Optional[int] = None,
    checklist: Optional[bool] = None,
    doc: Optional[str] = None,
    has_doc: Optional[bool] = None,
    driver_status: Optional[str] = None,
) -> List[DriverSummary]:
    """`doc` + `has_doc` filter by document on file, e.g. doc=cdl&has_doc=false lists
    drivers with no licence copy on record. doc=any is the catch-all: has_doc=false
    lists everyone with at least one document problem (missing, expired or expiring).
    `driver_status` narrows to one Driver.status value (Pending/Active/Terminated).
    Each row carries its document health (doc_state/doc_note) for the list indicator."""
    stmt = select(Driver)
    if company_id is not None:
        stmt = stmt.where(Driver.company_id == company_id)
    if driver_status:
        stmt = stmt.where(Driver.status == driver_status)
    if checklist is not None:
        stmt = stmt.where(Driver.checklist_checked == checklist)
    if doc is not None and has_doc is not None and doc != "any":
        if doc not in DRIVER_DOC_TYPES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Unsupported document type")
        sub = owners_with_file(ComplianceDocument.driver_id, uploads.DOC_TYPES[doc])
        stmt = stmt.where(Driver.id.in_(sub)) if has_doc else stmt.where(Driver.id.not_in(sub))

    drivers = list(session.exec(stmt).all())
    flags = doc_flags(
        session, ComplianceDocument.driver_id, [d.id for d in drivers],
        {k: uploads.DOC_TYPES[k] for k in sorted(DRIVER_DOC_TYPES)},
    )
    out = []
    for driver in drivers:
        row = DriverSummary.model_validate(driver)
        row.doc_flags = flags[driver.id]
        out.append(row)
    # "any" filters on the flags themselves — they are already computed, no extra query.
    if doc == "any" and has_doc is not None:
        out = [r for r in out if bool(r.doc_flags) != has_doc]
    return out


@router.post("", response_model=DriverDetail, status_code=status.HTTP_201_CREATED)
def create_driver(
    body: DriverCreate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> DriverDetail:
    """Add a driver by hand, without going through an application."""
    if not session.get(Company, body.company_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found")
    # exclude_none keeps hire_date on the model default (today) when it wasn't given —
    # passing None explicitly would hit the NOT NULL column.
    driver = Driver(**body.model_dump(exclude_none=True))
    session.add(driver)
    session.commit()
    session.refresh(driver)
    return DriverDetail.model_validate(driver)


@router.get("/{driver_id}", response_model=DriverDetail)
def get_driver(
    driver_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> DriverDetail:
    driver = session.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Driver not found")
    apps = session.exec(
        select(DriverApplication).where(DriverApplication.driver_id == driver_id)
    ).all()
    detail = DriverDetail.model_validate(driver)
    detail.applications = [DriverApplicationBrief.model_validate(a) for a in apps]
    return detail


@router.patch("/{driver_id}", response_model=DriverDetail)
def update_driver(
    driver_id: int,
    body: DriverUpdate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> DriverDetail:
    driver = session.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Driver not found")
    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(driver, field, value)
    # Terminating stamps the leaving date, coming back clears it — unless the manager
    # sent a date of their own in the same request (correcting an old record).
    if "status" in data and "termination_date" not in data:
        if data["status"] == DRIVER_TERMINATED:
            driver.termination_date = driver.termination_date or date.today()
        else:
            driver.termination_date = None
    session.add(driver)
    session.commit()
    session.refresh(driver)
    return DriverDetail.model_validate(driver)


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(
    driver_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> None:
    """Delete a driver and all their applications, documents, and owned trucks."""
    driver = session.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Driver not found")
    cascade.delete_driver(session, driver)
    session.commit()


@router.get("/{driver_id}/documents", response_model=List[ComplianceDocumentResponse])
def list_driver_documents(
    driver_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> List[ComplianceDocumentResponse]:
    docs = session.exec(
        select(ComplianceDocument).where(ComplianceDocument.driver_id == driver_id)
    ).all()
    return [doc_response(d) for d in docs]


DRIVER_DOC_TYPES = {"cdl", "medical_cert"}


@router.post("/{driver_id}/documents/{doc_type}", response_model=ComplianceDocumentResponse)
def upsert_driver_document(
    driver_id: int,
    doc_type: str,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    file: Annotated[Optional[UploadFile], File()] = None,
    expiry: Annotated[Optional[str], Form()] = None,
) -> ComplianceDocumentResponse:
    """Manager attaches/updates a driver document (CDL or medical cert): saves the file
    and/or sets the expiry, upserting the ComplianceDocument for alerts."""
    driver = session.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Driver not found")
    if doc_type not in DRIVER_DOC_TYPES:
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
            file_path = uploads.save_driver(driver_id, doc_type, file.file.read())
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    label = uploads.DOC_TYPES[doc_type]
    row = session.exec(
        select(ComplianceDocument).where(
            ComplianceDocument.driver_id == driver_id,
            ComplianceDocument.document_type == label,
        )
    ).first()
    if row is None:
        if exp is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Expiry date is required")
        row = ComplianceDocument(driver_id=driver_id, document_type=label,
                                 issue_date=date.today(), expiry_date=exp, file_path=file_path)
    else:
        if exp is not None:
            row.expiry_date = exp
        if file_path:
            row.file_path = file_path
    session.add(row)
    session.commit()
    session.refresh(row)
    return doc_response(row)
