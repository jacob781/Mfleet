"""Trucks router: managers list, create, edit, and delete fleet vehicles."""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database import get_session
from dependencies import get_current_user
from models import ComplianceDocument, Truck, User
from routers.compliance import doc_response
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
) -> List[Truck]:
    stmt = select(Truck)
    if company_id is not None:
        stmt = stmt.where(Truck.company_id == company_id)
    return list(session.exec(stmt).all())


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


@router.delete("/{truck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_truck(
    truck_id: int,
    session: Annotated[Session, Depends(get_session)],
    _user: Annotated[User, Depends(get_current_user)],
) -> None:
    truck = session.get(Truck, truck_id)
    if not truck:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Truck not found")
    session.delete(truck)
    session.commit()
