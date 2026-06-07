"""API request/response DTOs (kept separate from the SQLModel tables)."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = None
    role: Literal["admin", "manager"] = "manager"


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


# --- Companies ---------------------------------------------------------------

class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    address_street: str
    address_city: str
    address_state: str
    address_zip: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    fax: Optional[str] = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    address_street: str
    address_city: str
    address_state: str
    address_zip: str
    phone: Optional[str] = None
    email: Optional[str] = None
    fax: Optional[str] = None

    model_config = {"from_attributes": True}


# --- Drivers -----------------------------------------------------------------

class DriverSummary(BaseModel):
    """Driver listing for manager selection — never exposes SSN."""
    id: int
    company_id: int
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: str
    phone: str
    status: str

    model_config = {"from_attributes": True}


# --- Applications ------------------------------------------------------------

class ApplicationSettings(BaseModel):
    """Non-company part of the Typst config the manager fills in.
    The merged result (company snapshot + these) is validated by ManagerConfig."""
    min_age: int = 21
    min_years_history: int = 1
    deposit_amount: int = 0
    deposit_weeks: int = 0
    trailer_maintenance_monthly: int = 0
    compensation_type: Literal["percentage", "weekly_flat", "per_mile", "hourly"] = "percentage"
    percentage_rate: int = 0
    weekly_amount: float = 0
    loaded_rate: float = 0
    empty_rate: float = 0
    hourly_rate: float = 0
    include_auto_liability: bool = False
    include_cargo: bool = False
    insurance_cargo_liability: int = 0
    eld_device_weekly: int = 0
    tablet_weekly: int = 0
    prepass_monthly: int = 0
    administration_fee_weekly: int = 0


class ApplicationCreate(BaseModel):
    company_id: int
    driver_id: Optional[int] = None          # existing driver, or None for "new driver"
    driver_is_owner: bool = True
    expires_at: Optional[datetime] = None     # manager may override; else default +30 days
    settings: ApplicationSettings = Field(default_factory=ApplicationSettings)


class ApplicationListItem(BaseModel):
    id: int
    access_token: str
    apply_url: str
    status: str
    company_id: int
    driver_id: Optional[int] = None
    driver_is_owner: bool
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class ApplicationResponse(ApplicationListItem):
    manager_config: dict
    updated_at: Optional[datetime] = None
    driver: Optional[DriverSummary] = None
