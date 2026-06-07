"""Companies router: managers list and create carrier companies."""

from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select

from database import get_session
from dependencies import get_current_user
from models import Company, User
from schemas import CompanyCreate, CompanyResponse

router = APIRouter(prefix="/api/companies", tags=["Companies"])


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    body: CompanyCreate,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Company:
    company = Company(**body.model_dump())
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
