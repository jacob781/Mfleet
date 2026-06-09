import uuid
from typing import List, Optional, Literal, Dict
from datetime import date, datetime, timezone, timedelta
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel, EmailStr, model_validator

from crypto import EncryptedString, EncryptedJSON


# --- Column default helpers ---------------------------------------------------

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _default_expiry() -> datetime:
    """Default driver-link expiry: 30 days from creation (manager may override)."""
    return datetime.now(timezone.utc) + timedelta(days=30)


def _new_token() -> str:
    """Unguessable URL-safe access token for a driver link (UUIDv4 hex)."""
    return uuid.uuid4().hex


# ==============================================================================
# PART 0: MANAGER CONFIG & SIGNATURE SCHEMAS (For PDF Generation)
# ==============================================================================

class ManagerConfig(BaseModel):
    """Full Typst PDF `config` contract. Stored as a snapshot in
    DriverApplication.manager_config and fed to the Typst template.
    Field names/types mirror pdf_generator/test_payload.json exactly."""

    # Carrier identity — snapshot of the Company at application-creation time.
    company_name: str
    company_dot: str = ""
    company_mc: str = ""
    company_address: str
    company_city: str
    company_state: str
    company_zip: str
    company_phone: str = ""
    company_email: Optional[str] = None
    company_fax: Optional[str] = None

    # Eligibility thresholds.
    min_age: int = 21
    min_years_history: int = 1

    # Security deposit & trailer maintenance.
    deposit_amount: int = 0
    deposit_weeks: int = 0
    trailer_maintenance_monthly: int = 0

    # Compensation (Supplement B). The active rate depends on compensation_type.
    compensation_type: Literal["percentage", "weekly_flat", "per_mile", "hourly"] = "percentage"
    percentage_rate: int = 0       # compensation_type == "percentage"
    weekly_amount: float = 0       # compensation_type == "weekly_flat"
    loaded_rate: float = 0         # compensation_type == "per_mile"
    empty_rate: float = 0          # compensation_type == "per_mile"
    hourly_rate: float = 0         # compensation_type == "hourly"

    # Insurance.
    include_auto_liability: bool = False
    include_cargo: bool = False
    insurance_cargo_liability: int = 0

    # Owner-only weekly/monthly fees (Supplement B points 4-7).
    eld_device_weekly: int = 0
    tablet_weekly: int = 0
    prepass_monthly: int = 0
    administration_fee_weekly: int = 0

    @model_validator(mode="after")
    def _require_rate_for_type(self) -> "ManagerConfig":
        if self.compensation_type == "percentage" and self.percentage_rate <= 0:
            raise ValueError("percentage_rate must be > 0 for compensation_type='percentage'")
        if self.compensation_type == "weekly_flat" and self.weekly_amount <= 0:
            raise ValueError("weekly_amount must be > 0 for compensation_type='weekly_flat'")
        if self.compensation_type == "hourly" and self.hourly_rate <= 0:
            raise ValueError("hourly_rate must be > 0 for compensation_type='hourly'")
        if self.compensation_type == "per_mile" and self.loaded_rate <= 0 and self.empty_rate <= 0:
            raise ValueError("loaded_rate/empty_rate must be set for compensation_type='per_mile'")
        return self


class SignatureData(BaseModel):
    """Signature with auto-timestamp for DocuSign-like functionality"""
    image_base64: Optional[str] = None   # Base64 encoded signature image
    signer_first_name: str
    timestamp_et: str                    # Auto-generated timestamp in ET
    date: str                            # Auto-generated date (MM/DD/YYYY)


class LicenseHistory(BaseModel):
    """License denial/suspension history questions"""
    denied: bool = False
    denied_reason: Optional[str] = None
    suspended: bool = False
    suspended_reason: Optional[str] = None


class AccidentRecord(BaseModel):
    """Accident record for driving history"""
    date: str
    nature: str                          # Head-on, rear-end, etc.
    fatalities: int = 0
    injuries: int = 0
    chemical_spill: bool = False


class DrugAlcoholHistory(BaseModel):
    """Drug and alcohol testing history"""
    tested_positive_3yrs: bool = False
    breath_alcohol_04_3yrs: bool = False
    refused_test_3yrs: bool = False
    violated_dot_regulations: bool = False
    sap_evaluation: bool = False
    sap_details: Optional[str] = None

# ==============================================================================
# PART 1: DATABASE MODELS (For the Admin Panel & CRM)
# These define your tables in PostgreSQL/SQLite
# ==============================================================================

class Company(SQLModel, table=True):
    """The Client Company (e.g., REJEP MURANA INC)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    address_street: str
    address_city: str
    address_state: str
    address_zip: str
    phone: Optional[str] = None
    email: Optional[str] = None
    fax: Optional[str] = None
    
    # Relationships
    drivers: List["Driver"] = Relationship(back_populates="company")
    trucks: List["Truck"] = Relationship(back_populates="company")
    applications: List["DriverApplication"] = Relationship(back_populates="company")

class Driver(SQLModel, table=True):
    """The Applicant / Employee. Personal data is stored independently of any
    single application so a driver can be reused across applications."""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")

    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: str
    phone: str
    # SSN is encrypted at rest (Fernet) via EncryptedString.
    ssn: Optional[str] = Field(default=None, sa_column=Column(EncryptedString, nullable=True))
    dob: Optional[date] = None
    hire_date: date = Field(default_factory=date.today)
    status: str = Field(default="Pending")  # Pending, Active, Terminated

    # Manager-only free-form note about this driver.
    notes: Optional[str] = None

    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_utcnow, nullable=False),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False),
    )

    # Relationships
    company: Company = Relationship(back_populates="drivers")
    documents: List["ComplianceDocument"] = Relationship(back_populates="driver")
    applications: List["DriverApplication"] = Relationship(back_populates="driver")

class Truck(SQLModel, table=True):
    """Assets owned/leased by the company or driver"""
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    
    make: str
    year: int
    vin: str
    plate_number: str
    state_registered: str
    
    # Relationships
    company: Company = Relationship(back_populates="trucks")
    documents: List["ComplianceDocument"] = Relationship(back_populates="truck")

class ComplianceDocument(SQLModel, table=True):
    """
    The Core 'Expiry' Feature. 
    Stores metadata about CDLs, Medical Cards, Annual Inspections.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Who does this belong to? (Can belong to Driver OR Truck)
    driver_id: Optional[int] = Field(default=None, foreign_key="driver.id")
    truck_id: Optional[int] = Field(default=None, foreign_key="truck.id")
    
    document_type: str # e.g., "CDL", "Medical Cert", "Annual Inspection"
    issue_date: date
    expiry_date: date  # <--- The most important field for your alerts
    
    file_path: Optional[str] = None # Path to the stored PDF
    status: str = "Valid" # Valid, Expiring Soon, Expired
    
    driver: Optional[Driver] = Relationship(back_populates="documents")
    truck: Optional[Truck] = Relationship(back_populates="documents")


class User(SQLModel, table=True):
    """Mfleet staff account (admin or manager). No public registration:
    the first admin is seeded from env, and admins create further accounts."""
    __tablename__ = "users"  # avoid the reserved word "user" in Postgres

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(sa_column=Column(String, unique=True, index=True, nullable=False))
    hashed_password: str
    full_name: Optional[str] = None
    role: str = Field(default="manager")  # "admin" | "manager"
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_utcnow, nullable=False),
    )

    applications: List["DriverApplication"] = Relationship(back_populates="created_by")


class DriverApplication(SQLModel, table=True):
    """A document-flow request a manager creates for a driver to complete."""
    id: Optional[int] = Field(default=None, primary_key=True)
    # Public access link token — unguessable, not the PK, expirable.
    access_token: str = Field(
        sa_column=Column(
            String(32), unique=True, index=True, nullable=False, default=_new_token
        ),
    )
    company_id: int = Field(foreign_key="company.id")
    created_by_id: int = Field(foreign_key="users.id")
    # Set when the manager picks an existing driver, or on submit for a new one.
    driver_id: Optional[int] = Field(default=None, foreign_key="driver.id")

    status: str = Field(default="pending_driver")  # draft|pending_driver|pending_review|approved
    driver_is_owner: bool = Field(default=True)

    # Snapshot of ManagerConfig (rates, fees, partner carrier DOT/MC, etc.).
    manager_config: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False))

    pdf_path: Optional[str] = None
    pdf_status: Optional[str] = None  # generating|ready|failed
    pdf_error: Optional[str] = None

    submitted_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    # When the current PDF was last (re)generated successfully.
    pdf_generated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )

    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_utcnow, nullable=False),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False),
    )
    # Manager may set a custom link expiry; defaults to +30 days.
    expires_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_default_expiry, nullable=True),
    )

    company: Company = Relationship(back_populates="applications")
    created_by: User = Relationship(back_populates="applications")
    driver: Optional[Driver] = Relationship(back_populates="applications")
    answers: Optional["DriverAnswers"] = Relationship(
        back_populates="application",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
    )


class DriverAnswers(SQLModel, table=True):
    """Autosaved draft of the driver's form answers, encrypted at rest
    (contains SSN and banking details). One-to-one with DriverApplication."""
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("driverapplication.id"), unique=True, nullable=False
        ),
    )
    # Partial ApplicationPayload as JSON, Fernet-encrypted.
    answers: dict = Field(default_factory=dict, sa_column=Column(EncryptedJSON, nullable=False))
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False),
    )

    application: DriverApplication = Relationship(back_populates="answers")


# ==============================================================================
# PART 2: PDF GENERATION SCHEMAS (Pydantic)
# These validate the huge JSON coming from your Frontend React Form.
# They match the 'test_payload.json' structure EXACTLY.
# ==============================================================================

# --- Helper Schemas ---
class AddressSchema(BaseModel):
    street: str
    city: str
    state: str
    zip: str
    years: Optional[str] = None # Only used in residency history

class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str

class CDLInfo(BaseModel):
    state: str
    number: str
    type: str
    expiration: date # This maps to ComplianceDocument.expiry_date

class MedicalInfo(BaseModel):
    examiner_name: str
    registry_number: str
    expiration_date: date # This maps to ComplianceDocument.expiry_date
    waiver: bool

class ExperienceItem(BaseModel):
    type: str
    dates: str
    miles: str

class ExperienceGroup(BaseModel):
    straight: ExperienceItem
    tractor: ExperienceItem
    doubles: ExperienceItem

class Violation(BaseModel):
    date: date
    location: str
    charge: str
    penalty: str

class EmploymentItem(BaseModel):
    employer_name: str
    employer_address: str
    employer_city: str
    employer_state: str
    employer_zip: str
    employer_phone: str
    employer_fax: Optional[str] = None
    start_date: str
    end_date: str
    position: str
    salary: str
    reason_for_leaving: str
    subject_to_fmcsr: bool
    safety_sensitive: bool
    was_driver_subject_to_testing: bool = False

class DailyLog(BaseModel):
    date: str
    hours: str
    relieved_time: str

class TruckSchema(BaseModel):
    make: str
    year: int
    type: str
    vin: str
    state: str
    plate: str

class W9Schema(BaseModel):
    name: str
    business_name: Optional[str] = ""
    type: Literal["Individual", "C Corp", "S Corp", "Partnership"]
    address: str
    city_state_zip: str
    tin: str

class BankingSchema(BaseModel):
    bank_name: str
    routing_number: str
    account_number: str
    account_type: Literal["Checking", "Savings"]

class PolicyItem(BaseModel):
    title: str
    body: str

# --- MASTER INPUT SCHEMA ---
class ApplicationPayload(BaseModel):
    """
    This matches the JSON sent from React to generate the PDF.
    Includes manager config + driver data.
    """
    # Manager configuration (filled by admin/manager)
    config: ManagerConfig
    
    # Application date
    application_date: date
    
    # Personal info
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    ssn: str
    dob: date
    phone: str
    email: EmailStr
    
    address: AddressSchema
    residency_history: List[AddressSchema]
    emergency: EmergencyContact
    
    # Professional
    cdl: CDLInfo
    medical: MedicalInfo
    experience: ExperienceGroup
    license_history: LicenseHistory
    accidents: List[AccidentRecord]
    violations: List[Violation]
    drug_alcohol_history: DrugAlcoholHistory
    employment_history: List[EmploymentItem]
    
    # Logs — Typst iterates this as a list (see pages/p09_seven_day_log.typ)
    seven_day_log: List[DailyLog]
    last_relieved_time: str
    last_relieved_date: str
    last_relieved_location: str
    
    # Assets (filled by driver if owner, manager if not)
    equipment: List[TruckSchema]
    
    # Owner-operator specific fields
    ifta_choice: Optional[Literal["own", "carrier"]] = None  # Page 48 option 2
    
    # Financial
    w9: W9Schema
    banking: BankingSchema
    
    # Policies with acknowledgments
    policies: List[PolicyItem]
    
    # Signatures (key = section name, value = signature data)
    signatures: Dict[str, SignatureData] = {}