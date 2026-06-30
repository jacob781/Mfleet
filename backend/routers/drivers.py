"""Drivers router: managers list drivers (e.g. to attach to a new application).

Returns DriverSummary which never includes the SSN.
"""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database import get_session
from dependencies import get_current_user
from models import ComplianceDocument, Driver, DriverApplication, User
from routers.compliance import doc_response
from schemas import (
    ComplianceDocumentResponse,
    DriverApplicationBrief,
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
) -> List[Driver]:
    stmt = select(Driver)
    if company_id is not None:
        stmt = stmt.where(Driver.company_id == company_id)
    return list(session.exec(stmt).all())


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
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)
    session.add(driver)
    session.commit()
    session.refresh(driver)
    return DriverDetail.model_validate(driver)


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
