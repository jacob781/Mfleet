"""API request/response DTOs (kept separate from the SQLModel tables)."""

import re
from datetime import date, datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, computed_field, field_validator

from models import SsnStr, TinStr, doc_status


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Only the login/refresh pair carries this; the file-token endpoint does not.
    refresh_token: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


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


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[Literal["admin", "manager"]] = None
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


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
    # Owner / principal + company EIN. SSN/EIN re-checked for digit count here.
    owner_name: Optional[str] = None
    owner_ssn: Optional[SsnStr] = None
    owner_dob: Optional[date] = None
    owner_address: Optional[str] = None
    owner_license_no: Optional[str] = None
    owner_license_state: Optional[str] = None
    ein: Optional[TinStr] = None
    # Owner contact + insurance snapshot, filled by the MOTUS lookup.
    owner_title: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    insurance_status: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_effective_date: Optional[date] = None
    insurance_max_coverage: Optional[float] = None


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
    owner_name: Optional[str] = None
    owner_ssn: Optional[str] = None
    owner_dob: Optional[date] = None
    owner_address: Optional[str] = None
    owner_license_no: Optional[str] = None
    owner_license_state: Optional[str] = None
    owner_license_path: Optional[str] = None
    owner_license_expiry: Optional[date] = None
    ein: Optional[str] = None
    owner_title: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[str] = None
    insurance_status: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_effective_date: Optional[date] = None
    insurance_max_coverage: Optional[float] = None
    insurance_checked_at: Optional[datetime] = None
    fine_schedule: Optional[dict] = None
    fees_schedule: Optional[dict] = None

    @computed_field
    @property
    def owner_license_status(self) -> Optional[str]:
        """Live expiry status for the owner license, same rules as truck/driver docs."""
        if not self.owner_license_path or not self.owner_license_expiry:
            return None
        return doc_status(self.owner_license_expiry)

    model_config = {"from_attributes": True}


class CompanyUpdate(BaseModel):
    """Partial company edit. All fields optional; only provided ones are applied.
    `fine_schedule` lets a manager edit the company's penalty table."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    fax: Optional[str] = None
    owner_name: Optional[str] = None
    owner_ssn: Optional[SsnStr] = None
    owner_dob: Optional[date] = None
    owner_address: Optional[str] = None
    owner_license_no: Optional[str] = None
    owner_license_state: Optional[str] = None
    owner_license_expiry: Optional[date] = None
    ein: Optional[TinStr] = None
    owner_title: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    insurance_status: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_effective_date: Optional[date] = None
    insurance_max_coverage: Optional[float] = None
    fine_schedule: Optional[dict] = None
    fees_schedule: Optional[dict] = None


# --- MOTUS (FMCSA) carrier lookup -------------------------------------------

class MotusAddress(BaseModel):
    street: str = ""
    city: str = ""
    state: str = ""
    zip: str = ""


class MotusOwner(BaseModel):
    first_name: str = ""
    last_name: str = ""
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class MotusInsurance(BaseModel):
    status: str = "none"                 # "active" | "none"
    policy_number: Optional[str] = None
    effective_date: Optional[str] = None  # yyyy-mm-dd
    max_coverage: Optional[float] = None


class MotusLookupResponse(BaseModel):
    legal_name: str
    usdot_number: str
    mc_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    owner: Optional[MotusOwner] = None
    physical_address: Optional[MotusAddress] = None
    insurance: Optional[MotusInsurance] = None


# --- Trucks ------------------------------------------------------------------

class DocFlag(BaseModel):
    """One thing wrong with a required document, for the list badges."""
    doc: str      # doc_type key: cdl, medical_cert, annual_inspection, registration
    state: str    # missing | expired | expiring


class TruckCreate(BaseModel):
    company_id: int
    make: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=1900, le=2100)
    vin: str = Field(min_length=1, max_length=32)
    plate_number: str = Field(min_length=1, max_length=20)
    state_registered: str = Field(min_length=2, max_length=2)
    unit_number: Optional[str] = Field(default=None, max_length=32)
    ownership: Optional[Literal["owned", "leased"]] = None
    owner_driver_id: Optional[int] = None
    checklist_checked: bool = False
    checklist_date: Optional[date] = None


class TruckUpdate(BaseModel):
    """Partial truck edit; only provided fields are applied."""
    company_id: Optional[int] = None
    make: Optional[str] = Field(default=None, min_length=1, max_length=100)
    year: Optional[int] = Field(default=None, ge=1900, le=2100)
    vin: Optional[str] = Field(default=None, min_length=1, max_length=32)
    plate_number: Optional[str] = Field(default=None, min_length=1, max_length=20)
    state_registered: Optional[str] = Field(default=None, min_length=2, max_length=2)
    unit_number: Optional[str] = Field(default=None, max_length=32)
    ownership: Optional[Literal["owned", "leased"]] = None
    owner_driver_id: Optional[int] = None
    checklist_checked: Optional[bool] = None
    checklist_date: Optional[date] = None
    # Retiring a truck / putting it back in service, same shape as the driver edit.
    status: Optional[Literal["Active", "Terminated"]] = None
    termination_date: Optional[date] = None


class TruckResponse(TruckCreate):
    id: int
    status: str = "Active"
    termination_date: Optional[date] = None
    # Problem documents for the list badges; filled by the router (see doc_flags).
    doc_flags: List[DocFlag] = []

    model_config = {"from_attributes": True}


class TruckEventDTO(BaseModel):
    """One entry of a truck's in-service timeline."""
    id: int
    kind: str            # added | terminated | reactivated
    date: date
    note: Optional[str] = None

    model_config = {"from_attributes": True}


class TruckDetail(TruckResponse):
    """Single-truck read: adds the timeline the list does not need."""
    events: List[TruckEventDTO] = []


# --- Compliance documents ----------------------------------------------------

class ComplianceDocumentResponse(BaseModel):
    id: int
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    document_type: str
    issue_date: Optional[date] = None    # printed on the document; not always known
    expiry_date: date
    document_number: Optional[str] = None
    address: Optional[str] = None
    issuing_state: Optional[str] = None
    superseded_at: Optional[datetime] = None   # set = an old version, kept for the record
    status: str          # live status (Valid / Expiring Soon / Expired)
    has_file: bool       # whether a file is attached to download
    is_image: bool = False   # a photo (rotatable + previewable), not a PDF

    model_config = {"from_attributes": True}


class AlertItem(BaseModel):
    """A compliance document that needs attention, with context for the alerts list.
    A document that was never uploaded has no row and no dates — hence the nulls."""
    document_id: Optional[int] = None
    document_type: str
    expiry_date: Optional[date] = None
    status: str          # Missing | Expiring Soon | Expired
    days_left: Optional[int] = None   # negative if already expired
    subject: str         # driver name, truck label, or company name
    subject_kind: Literal["driver", "truck", "company"]
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    company_id: Optional[int] = None
    # Stable identity of this alert (see models.AlertRead) and when someone marked it
    # seen. Filled by the router; null read_at means it is still new.
    key: str = ""
    read_at: Optional[datetime] = None


class AlertReadRequest(BaseModel):
    """Keys to mark seen (or to put back). `all` ignores the list and takes every
    alert currently on the board — what the "Mark all read" button sends."""
    keys: List[str] = []
    all: bool = False


# --- Employer verification ---------------------------------------------------

class EmployerVerificationResponse(BaseModel):
    id: int
    employer_index: int
    employer_name: Optional[str] = None
    phone: Optional[str] = None          # context from employment_history (read-only)
    email: Optional[str] = None
    status: str                          # pending | sent | received
    sent_at: Optional[datetime] = None
    attempts: List[dict] = []            # [{date, method, destination, by, message_id}]
    received_at: Optional[datetime] = None
    received_from: Optional[str] = None
    has_file: bool = False

    model_config = {"from_attributes": True}


class EmployerEmailUpdate(BaseModel):
    email: Optional[EmailStr] = None     # null clears it


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
    hire_date: Optional[date] = None
    termination_date: Optional[date] = None
    checklist_checked: bool = False
    checklist_date: Optional[date] = None
    # Problem documents for the list badges; filled by the router (see doc_flags).
    doc_flags: List[DocFlag] = []

    model_config = {"from_attributes": True}


class DriverApplicationBrief(BaseModel):
    id: int
    status: str
    pdf_status: Optional[str] = None
    driver_is_owner: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


def _blank_or_email(value: Optional[str]) -> Optional[str]:
    """Manager-added drivers often have no contacts yet — blank is stored rather
    than a fake address. Anything non-blank still has to look like an email.
    The driver's own application validates its fields separately and keeps
    requiring both (see routers/driver_form.py)."""
    if value is None:
        return None
    value = value.strip()
    if value and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise ValueError("Enter a valid email")
    return value


class DriverCreate(BaseModel):
    """Manager adds a driver directly, outside the application flow."""
    company_id: int
    first_name: str = Field(min_length=1)
    middle_name: Optional[str] = None
    last_name: str = Field(min_length=1)
    email: str = ""
    phone: str = ""
    dob: Optional[date] = None
    ssn: Optional[SsnStr] = None
    hire_date: Optional[date] = None     # defaults to today in the model
    status: str = "Pending"
    notes: Optional[str] = None
    checklist_checked: bool = False
    checklist_date: Optional[date] = None

    _check_email = field_validator("email")(_blank_or_email)


class DriverUpdate(BaseModel):
    """Partial driver edit from the admin drawer; only provided fields are applied."""
    first_name: Optional[str] = Field(default=None, min_length=1)
    middle_name: Optional[str] = None
    last_name: Optional[str] = Field(default=None, min_length=1)
    email: Optional[str] = None       # "" clears it; contacts stay optional here
    phone: Optional[str] = None
    status: Optional[str] = None
    dob: Optional[date] = None
    ssn: Optional[SsnStr] = None
    hire_date: Optional[date] = None
    # Sent explicitly only to correct it; otherwise the router stamps it from status.
    termination_date: Optional[date] = None
    notes: Optional[str] = None
    checklist_checked: Optional[bool] = None
    checklist_date: Optional[date] = None

    _check_email = field_validator("email")(_blank_or_email)


class EmploymentEvent(BaseModel):
    """One entry of a driver's employment timeline."""
    id: int
    kind: str            # hired | terminated | reactivated
    date: date
    note: Optional[str] = None

    model_config = {"from_attributes": True}


class DriverDetail(DriverSummary):
    dob: Optional[date] = None
    # Single-driver reads only: the list DTO must never carry an SSN.
    ssn: Optional[str] = None
    notes: Optional[str] = None
    applications: List[DriverApplicationBrief] = []
    employment_events: List[EmploymentEvent] = []


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
    percentage_rate: int = 0              # legacy single rate (fallback)
    percentage_rate_non_amazon: int = 0   # percentage: primary (non-Amazon) rate
    percentage_rate_amazon: int = 0       # percentage: optional Amazon-loads rate
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
    include_penalties: bool = True   # show the Schedule A penalties page
    # Per-application override of the company's fine table. None = inherit the company
    # snapshot taken at creation (the common case); a dict overrides it for this contract.
    fine_schedule: Optional[Dict] = None
    include_fees: bool = True        # show the compact FINES AND FEES SCHEDULE page
    fees_schedule: Optional[Dict] = None  # None = inherit company snapshot; dict overrides


class ApplicationCreate(BaseModel):
    company_id: int
    driver_id: Optional[int] = None          # existing driver, or None for "new driver"
    driver_is_owner: bool = True
    expires_at: Optional[datetime] = None     # manager may override; else default +30 days
    settings: ApplicationSettings = Field(default_factory=ApplicationSettings)


class ApplicationUpdate(BaseModel):
    """Editable fields for an existing application. Company + the frozen contract
    snapshot are immutable; settings re-merge over the existing snapshot."""
    driver_id: Optional[int] = None          # existing driver, or None for "new driver"
    driver_is_owner: Optional[bool] = None
    expires_at: Optional[datetime] = None
    settings: Optional[ApplicationSettings] = None


class ApplicationListItem(BaseModel):
    id: int
    access_token: str
    apply_url: str
    status: str
    company_id: int
    driver_id: Optional[int] = None
    driver_is_owner: bool
    pdf_status: Optional[str] = None
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class ApplicationResponse(ApplicationListItem):
    manager_config: dict
    pdf_error: Optional[str] = None
    submitted_at: Optional[datetime] = None
    pdf_generated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    driver: Optional[DriverSummary] = None


class ApplicationStatusUpdate(BaseModel):
    status: Literal["pending_driver", "pending_review", "approved", "rejected"]


class ApplicationLinkExpiry(BaseModel):
    """Manager sets/extends the driver link's expiry so a reopened application stays
    reachable."""
    expires_at: datetime


class CounterSignRequest(BaseModel):
    """Manager's counter-signature captured on the application detail page."""
    image_base64: str
    signer_first_name: str = ""
    timestamp_et: str = ""
    date: str = ""
