"""Drivers router: managers list drivers (e.g. to attach to a new application).

Returns DriverSummary which never includes the SSN.
"""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from database import get_session
from dependencies import get_current_user
from models import Driver, User
from schemas import DriverSummary

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
