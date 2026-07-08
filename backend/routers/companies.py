"""Companies router: managers list, create, and edit carrier companies."""

from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

import cascade
import uploads
from database import get_session
from dependencies import get_current_user, get_current_user_file
from fine_schedule import default_fine_schedule, default_fees_schedule
from models import Company, Driver, DriverApplication, Truck, User
from schemas import CompanyCreate, CompanyResponse, CompanyUpdate

router = APIRouter(prefix="/api/companies", tags=["Companies"])


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    body: CompanyCreate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Company:
    # Seed the standard penalty + fees schedules so a new company has editable tables.
    company = Company(
        **body.model_dump(),
        fine_schedule=default_fine_schedule(),
        fees_schedule=default_fees_schedule(),
    )
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.get("", response_model=List[CompanyResponse])
def list_companies(
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> List[Company]:
    return list(session.exec(select(Company)).all())


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Company:
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company


@router.patch("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    body: CompanyUpdate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Company:
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.post("/{company_id}/owner-license", response_model=CompanyResponse)
def upload_owner_license(
    company_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    file: Annotated[Optional[UploadFile], File()] = None,
    expiry: Annotated[Optional[str], Form()] = None,
) -> Company:
    """Attach/update the company owner's driver-license file and/or its expiry."""
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found")
    if expiry:
        try:
            company.owner_license_expiry = date.fromisoformat(expiry[:10])
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid expiry date")
    if file is not None:
        # The licence is in hand → its expiry is printed on it; require it.
        if not company.owner_license_expiry:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Expiry date is required")
        try:
            company.owner_license_path = uploads.save_company(company_id, "owner_license", file.file.read())
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.get("/{company_id}/owner-license/file")
def download_owner_license(
    company_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user_file)],
) -> FileResponse:
    company = session.get(Company, company_id)
    if not company or not company.owner_license_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No license on file")
    path = uploads.resolve(company.owner_license_path)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="File missing")
    return uploads.file_response(path)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
    mode: str = "cascade",
    target_company_id: Optional[int] = None,
) -> None:
    """Delete a company. mode='reassign' moves its drivers/trucks/applications to
    target_company_id first; mode='cascade' deletes them all along with the company."""
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found")

    if mode == "reassign":
        if not target_company_id or target_company_id == company_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Pick a different target company")
        if not session.get(Company, target_company_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Target company not found")
        for driver in session.exec(select(Driver).where(Driver.company_id == company_id)).all():
            driver.company_id = target_company_id
            session.add(driver)
        for truck in session.exec(select(Truck).where(Truck.company_id == company_id)).all():
            truck.company_id = target_company_id
            session.add(truck)
        for app in session.exec(select(DriverApplication).where(DriverApplication.company_id == company_id)).all():
            app.company_id = target_company_id
            session.add(app)
    else:  # cascade
        for driver in session.exec(select(Driver).where(Driver.company_id == company_id)).all():
            cascade.delete_driver(session, driver)
        # Company-owned trucks and applications not tied to a deleted driver.
        for truck in session.exec(select(Truck).where(Truck.company_id == company_id)).all():
            cascade.delete_truck(session, truck)
        for app in session.exec(select(DriverApplication).where(DriverApplication.company_id == company_id)).all():
            cascade.delete_application(session, app)

    uploads.remove_dir(f"companies/company_{company_id}")
    session.delete(company)
    session.commit()
