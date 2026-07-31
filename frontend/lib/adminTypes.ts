// TS DTOs mirroring backend/schemas.py — kept in sync by hand.

export interface Token {
  access_token: string;
  token_type: string;
  /** Present on login/refresh; absent on the short-lived file token. */
  refresh_token?: string | null;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string | null;
  role: 'admin' | 'manager';
}

export interface UserUpdate {
  full_name?: string | null;
  role?: 'admin' | 'manager';
  is_active?: boolean;
}

export type ApplicationStatus = 'pending_driver' | 'pending_review' | 'approved' | 'rejected';

export interface GoogleStatus {
  configured: boolean;   // client id/secret/redirect present in backend env
  connected: boolean;
  email: string | null;
  connected_at: string | null;
  drive_folder_id: string | null;
}

// --- Companies -------------------------------------------------------------

export interface CompanyCreate {
  name: string;
  dot_number?: string | null;
  mc_number?: string | null;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  phone?: string | null;
  email?: string | null;
  fax?: string | null;
  owner_name?: string | null;
  owner_ssn?: string | null;
  owner_dob?: string | null;
  owner_address?: string | null;
  owner_license_no?: string | null;
  owner_license_state?: string | null;
  ein?: string | null;
}

// Fine/penalty schedule (Schedule A). All amounts/points/text are free-form strings.
export interface FineRow { violation: string; points: string; first: string; second: string }
export interface FineSection { title: string; rows: FineRow[] }
export interface RewardRow { label: string; amount: string }
export interface FineSchedule {
  rate_per_point: number;
  rewards: { title: string; intro: string; rows: RewardRow[] };
  sections: FineSection[];
}

// Compact FINES AND FEES SCHEDULE (flat violation -> fee).
export interface FeesRow { violation: string; fee: string }
export interface FeesSchedule { title: string; rows: FeesRow[] }

export interface CompanyResponse extends CompanyCreate {
  id: number;
  owner_license_path?: string | null;
  owner_license_expiry?: string | null;
  owner_license_status?: string | null;   // Valid | Expiring Soon | Expired (null if no file)
  fine_schedule: FineSchedule | null;
  fees_schedule: FeesSchedule | null;
}

/** One thing wrong with a required document, for the list badges. */
export interface DocFlag {
  doc: string;    // doc_type key: cdl, medical_cert, annual_inspection, registration
  state: string;  // missing | expired | expiring
}

// --- Compliance documents & alerts -----------------------------------------

export interface ComplianceDocument {
  id: number;
  driver_id: number | null;
  truck_id: number | null;
  document_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;      // Valid | Expiring Soon | Expired
  has_file: boolean;
  is_image: boolean;   // photo (preview + rotate available), not a PDF
}

export interface AlertItem {
  document_id: number;
  document_type: string;
  expiry_date: string;
  status: string;      // Expiring Soon | Expired
  days_left: number;
  subject: string;
  subject_kind: 'driver' | 'truck' | 'company';
  driver_id: number | null;
  truck_id: number | null;
  company_id: number | null;
}

export interface EmployerAttempt {
  date: string;
  method: string;
  destination: string;
  by: string;
}

export interface EmployerVerification {
  id: number;
  employer_index: number;
  employer_name: string | null;
  phone: string | null;
  email: string | null;
  status: string; // pending | sent | received
  sent_at: string | null;
  attempts: EmployerAttempt[];
  received_at: string | null;
  received_from: string | null;
  has_file: boolean;
}

// --- Drivers ---------------------------------------------------------------

export interface DriverSummary {
  id: number;
  company_id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  checklist_checked: boolean;
  checklist_date?: string | null;
  /** Problem documents for the list badges; empty means everything is valid. */
  doc_flags?: DocFlag[];
}

// --- Trucks ----------------------------------------------------------------

export type TruckOwnership = 'owned' | 'leased';

export interface TruckCreate {
  company_id: number;
  make: string;
  year: number;
  vin: string;
  plate_number: string;
  state_registered: string;
  unit_number?: string | null;
  ownership?: TruckOwnership | null;
  owner_driver_id?: number | null;
  checklist_checked?: boolean;
  checklist_date?: string | null;
}

export interface TruckResponse extends TruckCreate {
  id: number;
  /** Problem documents for the list badges; empty means everything is valid. */
  doc_flags?: DocFlag[];
}

export function emptyTruck(companyId: number): TruckCreate {
  return {
    company_id: companyId,
    make: '',
    year: new Date().getFullYear(),
    vin: '',
    plate_number: '',
    state_registered: '',
    unit_number: '',
    ownership: null,
    owner_driver_id: null,
    checklist_checked: false,
    checklist_date: null,
  };
}

// --- Applications ----------------------------------------------------------

export interface DriverApplicationBrief {
  id: number;
  status: string;
  pdf_status: string | null;
  driver_is_owner: boolean;
  created_at: string | null;
}

export interface DriverDetail extends DriverSummary {
  dob?: string | null;
  notes?: string | null;
  applications: DriverApplicationBrief[];
}

export interface DriverCreate {
  company_id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  phone: string;
  dob?: string | null;
  status: string;
  notes?: string | null;
  checklist_checked: boolean;
  checklist_date?: string | null;
}

export function emptyDriver(companyId: number): DriverCreate {
  return {
    company_id: companyId,
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '',
    status: 'Pending',
    notes: '',
    checklist_checked: false,
    checklist_date: null,
  };
}

export interface DriverUpdate {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  notes?: string | null;
  checklist_checked?: boolean;
  checklist_date?: string | null;
}

export type CompensationType = 'percentage' | 'weekly_flat' | 'per_mile' | 'hourly';

export interface ApplicationSettings {
  min_age: number;
  min_years_history: number;
  deposit_amount: number;
  deposit_weeks: number;
  trailer_maintenance_monthly: number;
  compensation_type: CompensationType;
  percentage_rate: number;             // legacy single rate (fallback)
  percentage_rate_non_amazon: number;  // percentage: primary (non-Amazon) rate
  percentage_rate_amazon: number;      // percentage: optional Amazon-loads rate
  weekly_amount: number;
  loaded_rate: number;
  empty_rate: number;
  hourly_rate: number;
  include_auto_liability: boolean;
  include_cargo: boolean;
  insurance_cargo_liability: number;
  eld_device_weekly: number;
  tablet_weekly: number;
  prepass_monthly: number;
  administration_fee_weekly: number;
  include_penalties: boolean;
  include_fees: boolean;
}

export interface ApplicationCreate {
  company_id: number;
  driver_id?: number | null;
  driver_is_owner: boolean;
  expires_at?: string | null;
  settings: ApplicationSettings;
}

export interface ApplicationListItem {
  id: number;
  access_token: string;
  apply_url: string;
  status: string;
  company_id: number;
  driver_id: number | null;
  driver_is_owner: boolean;
  pdf_status: string | null;
  created_at: string | null;
  expires_at: string | null;
}

export interface ApplicationResponse extends ApplicationListItem {
  manager_config: Record<string, unknown>;
  pdf_error: string | null;
  submitted_at: string | null;
  pdf_generated_at: string | null;
  updated_at: string | null;
  driver: DriverSummary | null;
}

// Sensible defaults for the create form (match ApplicationSettings field defaults).
export function defaultSettings(): ApplicationSettings {
  return {
    min_age: 21,
    min_years_history: 1,
    deposit_amount: 0,
    deposit_weeks: 0,
    trailer_maintenance_monthly: 0,
    compensation_type: 'percentage',
    percentage_rate: 0,
    percentage_rate_non_amazon: 0,
    percentage_rate_amazon: 0,
    weekly_amount: 0,
    loaded_rate: 0,
    empty_rate: 0,
    hourly_rate: 0,
    include_auto_liability: false,
    include_cargo: false,
    insurance_cargo_liability: 0,
    eld_device_weekly: 0,
    tablet_weekly: 0,
    prepass_monthly: 0,
    administration_fee_weekly: 0,
    include_penalties: true,
    include_fees: true,
  };
}

// Optional company fields: empty strings must become null, since the backend
// validates email as EmailStr (an empty string is rejected with "needs @-sign").
export function normalizeCompany(c: CompanyCreate): CompanyCreate {
  const optional: Array<keyof CompanyCreate> = [
    'dot_number',
    'mc_number',
    'phone',
    'email',
    'fax',
    'owner_name',
    'owner_ssn',
    'owner_dob',
    'owner_address',
    'owner_license_no',
    'owner_license_state',
    'ein',
  ];
  const out: CompanyCreate = { ...c };
  optional.forEach((k) => {
    if (typeof out[k] === 'string' && (out[k] as string).trim() === '') {
      (out as any)[k] = null;
    }
  });
  return out;
}

export function emptyCompany(): CompanyCreate {
  return {
    name: '',
    dot_number: '',
    mc_number: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    phone: '',
    email: '',
    fax: '',
    owner_name: '',
    owner_ssn: '',
    owner_dob: '',
    owner_address: '',
    owner_license_no: '',
    owner_license_state: '',
    ein: '',
  };
}
