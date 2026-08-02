import uuid
from typing import List, Optional, Literal, Dict, Annotated
from datetime import date, datetime, timezone, timedelta
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel, EmailStr, model_validator, AfterValidator

from crypto import EncryptedString, EncryptedJSON


# --- Format validators (server-side mirror of frontend lib/masks.ts) ----------
# The frontend masks SSN/phone/zip/etc., but masks can be bypassed by calling the
# API directly. These re-check digit counts at the trust boundary. Empty passes —
# presence is a separate `required` concern, matching the frontend rule exactly.
def _digits(s: str) -> str:
    return "".join(c for c in str(s) if c.isdigit())

def _exact_digits(n: int, label: str):
    def check(v: str) -> str:
        if v and len(_digits(v)) != n:
            raise ValueError(f"{label} must be {n} digits")
        return v
    return check

def _zip_check(v: str) -> str:
    if v and len(_digits(v)) not in (5, 9):
        raise ValueError("ZIP must be 5 digits (or 9 for ZIP+4)")
    return v

def _account_check(v: str) -> str:
    if v and (not v.isdigit() or not 4 <= len(v) <= 17):
        raise ValueError("Account number must be 4–17 digits")
    return v

SsnStr = Annotated[str, AfterValidator(_exact_digits(9, "SSN"))]
TinStr = Annotated[str, AfterValidator(_exact_digits(9, "TIN (SSN/EIN)"))]
PhoneStr = Annotated[str, AfterValidator(_exact_digits(10, "Phone"))]
RoutingStr = Annotated[str, AfterValidator(_exact_digits(9, "Routing number"))]
ZipStr = Annotated[str, AfterValidator(_zip_check)]
AccountStr = Annotated[str, AfterValidator(_account_check)]


# --- Column default helpers ---------------------------------------------------

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _default_expiry() -> datetime:
    """Default driver-link expiry: 30 days from creation (manager may override)."""
    return datetime.now(timezone.utc) + timedelta(days=30)


def _new_token() -> str:
    """Unguessable URL-safe access token for a driver link (UUIDv4 hex)."""
    return uuid.uuid4().hex


# Days before expiry a document counts as "Expiring Soon" (drives alerts + emails).
EXPIRY_SOON_DAYS = 30

# Driver.status values. A terminated driver is kept for the record but stops
# raising document alerts.
DRIVER_STATUSES = ("Pending", "Active", "Terminated")
DRIVER_TERMINATED = "Terminated"


def doc_status(expiry: date, today: Optional[date] = None) -> str:
    """Live compliance status from the expiry date — the stored column drifts, so
    alerts/UI compute this on read instead of trusting it."""
    today = today or date.today()
    if expiry < today:
        return "Expired"
    if expiry <= today + timedelta(days=EXPIRY_SOON_DAYS):
        return "Expiring Soon"
    return "Valid"


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
    percentage_rate: int = 0       # legacy single percentage rate (fallback for old apps)
    percentage_rate_non_amazon: int = 0  # compensation_type == "percentage" (primary)
    percentage_rate_amazon: int = 0      # optional second rate, only if Amazon loads differ
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

    # Penalties page (Schedule A): manager toggle + the fine table snapshot used
    # for this contract. fine_schedule is filled from the company at creation; if
    # absent the Typst page falls back to the standard schedule.
    include_penalties: bool = True
    fine_schedule: Optional[Dict] = None
    # Compact FINES AND FEES SCHEDULE — separate toggle + table snapshot.
    include_fees: bool = True
    fees_schedule: Optional[Dict] = None

    @model_validator(mode="after")
    def _require_rate_for_type(self) -> "ManagerConfig":
        if self.compensation_type == "percentage" and (self.percentage_rate_non_amazon or self.percentage_rate) <= 0:
            raise ValueError("percentage rate (non-Amazon) must be > 0 for compensation_type='percentage'")
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
    tested_positive_preemployment: bool = False
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

    # Owner / principal of the carrier. SSN and EIN are sensitive, encrypted at rest.
    owner_name: Optional[str] = None
    owner_ssn: Optional[str] = Field(default=None, sa_column=Column(EncryptedString, nullable=True))
    owner_dob: Optional[date] = None
    owner_address: Optional[str] = None
    owner_license_no: Optional[str] = None
    owner_license_state: Optional[str] = None
    owner_license_path: Optional[str] = None      # uploaded license image/PDF (rel path)
    owner_license_expiry: Optional[date] = None   # drives an expiry alert
    ein: Optional[str] = Field(default=None, sa_column=Column(EncryptedString, nullable=True))

    # Per-company penalty schedule (Schedule A). Seeded with the standard table on
    # creation; managers may edit it. A snapshot is copied into manager_config at
    # application-creation time so each contract freezes the schedule it was made with.
    fine_schedule: Optional[dict] = Field(default=None, sa_column=Column(JSONB, nullable=True))

    # Per-company compact "FINES AND FEES SCHEDULE" (flat violation -> fee). Separate
    # from fine_schedule; same snapshot-on-create behaviour.
    fees_schedule: Optional[dict] = Field(default=None, sa_column=Column(JSONB, nullable=True))

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
    # Stamped when the status goes to Terminated, cleared when the driver comes back.
    termination_date: Optional[date] = None

    # Onboarding checklist (docs/tools the driver must have). Set manually by a manager.
    checklist_checked: bool = Field(default=False)
    checklist_date: Optional[date] = None

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
    unit_number: Optional[str] = None          # fleet unit # assigned by the company
    ownership: Optional[str] = None             # "owned" | "leased" (manager-set)
    owner_driver_id: Optional[int] = Field(default=None, foreign_key="driver.id")  # owner-operator who owns it

    # Checklist (equipment/docs the truck must have). Set manually by a manager.
    checklist_checked: bool = Field(default=False)
    checklist_date: Optional[date] = None

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
    expiry_date: date  # <--- The most important field for your alerts (always set)
    
    file_path: Optional[str] = None # Path to the stored PDF
    # Live status (Valid/Expiring Soon/Expired) is always recomputed from expiry_date
    # via doc_status() on read — never stored, so it can't drift.

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


class RevokedToken(SQLModel, table=True):
    """Blacklisted refresh-token ids. A refresh token is single-use: exchanging it
    lands its `jti` here, so replaying it (or a stolen copy) is rejected; logging
    out blacklists it early. Rows are purged once the token would have expired."""
    id: Optional[int] = Field(default=None, primary_key=True)
    jti: str = Field(sa_column=Column(String, unique=True, index=True, nullable=False))
    user_id: int = Field(foreign_key="users.id")
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    revoked_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), default=_utcnow, nullable=False),
    )


class EmployerVerification(SQLModel, table=True):
    """One prior-employer verification packet per application × employer. The driver's
    employment_history supplies name/phone but no email — the manager adds/edits the
    email here, then generates the 2-page packet and emails it to the employer."""
    __table_args__ = (UniqueConstraint("application_id", "employer_index"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(foreign_key="driverapplication.id", index=True)
    employer_index: int  # position in the driver's employment_history list
    employer_name: Optional[str] = None  # snapshot for the manager's list
    email: Optional[str] = None          # manager-entered recipient
    status: str = Field(default="pending")  # pending | sent | received
    sent_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    # Each send (manual or auto) appends {date, method, destination, by}. Up to 3 are
    # rendered on the packet's records-request page (FMCSA 3-attempt form).
    attempts: list = Field(
        default_factory=list,
        sa_column=Column(JSONB, nullable=False, server_default="[]"),
    )
    received_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    received_from: Optional[str] = None  # email address the reply came from (Gmail detect)
    file_path: Optional[str] = None      # generated packet PDF (absolute path)


class GoogleAccount(SQLModel, table=True):
    """Singleton (id=1) holding the app-wide Google Drive OAuth connection.
    Only the long-lived refresh token is stored (encrypted); access tokens are
    short-lived and fetched on demand. `pending_state` guards the OAuth callback."""
    id: Optional[int] = Field(default=None, primary_key=True)
    account_email: Optional[str] = None
    refresh_token: Optional[str] = Field(default=None, sa_column=Column(EncryptedString, nullable=True))
    drive_folder_id: Optional[str] = None  # parent folder for uploads (optional)
    pending_state: Optional[str] = None     # CSRF state for the in-flight connect
    connected_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )


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

    # Manager counter-signature (company/carrier side), applied on approval.
    manager_signature: Optional[dict] = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
    manager_signed_at: Optional[datetime] = Field(
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
    zip: ZipStr
    years: Optional[str] = None # Only used in residency history

class EmergencyContact(BaseModel):
    name: str
    phone: PhoneStr
    relation: str

class CDLInfo(BaseModel):
    state: str
    number: str
    type: str
    expiration: date # This maps to ComplianceDocument.expiry_date

class MedicalInfo(BaseModel):
    expiration_date: date # This maps to ComplianceDocument.expiry_date

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
    vehicle_type: Optional[str] = ""   # "Type of Vehicle Operated" (Certification of Violations page)

class EmploymentDeclaration(BaseModel):
    """Driver's declaration about employment gaps (DECLARATION OF EMPLOYMENT STATUS page).
    The gap LIST is recomputed server-side from employment_history (the trust anchor, so a
    direct API call can't hide a gap). These are the parts only the driver supplies:
    a per-gap explanation keyed by "<from>_<to>" (ISO), and the two attestations."""
    gap_explanations: Dict[str, str] = {}  # { "2019-06-30_2020-02-01": "Attended CDL school" }
    not_employed_affirm: bool = False       # "I was not employed by any company or individual"
    not_convicted_affirm: bool = False      # "...not convicted of a criminal act involving a CMV"


class EmploymentItem(BaseModel):
    employer_name: str
    employer_address: str
    employer_city: str
    employer_state: str
    employer_zip: ZipStr
    employer_phone: PhoneStr
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
    type: Literal["Individual", "C Corp", "S Corp", "Partnership", "LLC", "Trust/estate", "Other"]
    llc_classification: Optional[str] = ""       # C/S/P, only when type = LLC
    other_classification: Optional[str] = ""     # free text, only when type = Other
    exempt_payee_code: Optional[str] = ""        # W-9 line 4, entities only
    fatca_exemption_code: Optional[str] = ""     # W-9 line 4, entities only
    address: str
    city_state_zip: str
    tin: TinStr

class BankingSchema(BaseModel):
    bank_name: str
    routing_number: RoutingStr
    account_number: AccountStr
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
    ssn: SsnStr
    dob: date
    phone: PhoneStr
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
    employment_declaration: EmploymentDeclaration = EmploymentDeclaration()

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

    # Uploaded documents (key = doc_type, value = path relative to UPLOADS_DIR).
    # pdf_service resolves these to absolute paths before generation.
    documents: Dict[str, str] = {}

    # Expiry dates for uploaded truck documents (key = doc_type, ISO date). CDL and
    # medical expiries come from the cdl/medical sections; these cover the docs that
    # have no dedicated field — annual_inspection and registration.
    document_expiries: Dict[str, date] = {}

    # Per-truck uploaded documents & expiries for owner-operators with multiple trucks.
    # Keyed by the equipment index (as a string): {"0": {"annual_inspection": path, ...}}.
    truck_documents: Dict[str, Dict[str, str]] = {}
    truck_document_expiries: Dict[str, Dict[str, date]] = {}

    @model_validator(mode="before")
    @classmethod
    def _drop_blank_expiries(cls, data):
        # Untouched date inputs arrive as "" — drop them so the dict parses (and so a
        # missing truck-doc expiry doesn't 422 the whole submit; uploads are soft-required).
        if isinstance(data, dict) and isinstance(data.get("document_expiries"), dict):
            data["document_expiries"] = {
                k: v for k, v in data["document_expiries"].items() if v
            }
        if isinstance(data, dict) and isinstance(data.get("truck_document_expiries"), dict):
            data["truck_document_expiries"] = {
                idx: {k: v for k, v in (per or {}).items() if v}
                for idx, per in data["truck_document_expiries"].items()
            }
        return data