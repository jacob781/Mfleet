"""Companies router: managers list, create, and edit carrier companies."""

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database import get_session
from dependencies import get_current_user
from fine_schedule import default_fine_schedule, default_fees_schedule
from models import Company, User
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
