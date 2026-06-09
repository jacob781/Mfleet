// TS DTOs mirroring backend/schemas.py — kept in sync by hand.

export interface Token {
  access_token: string;
  token_type: string;
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
}

export interface CompanyResponse extends CompanyCreate {
  id: number;
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
  applications: DriverApplicationBrief[];
}

export type CompensationType = 'percentage' | 'weekly_flat' | 'per_mile' | 'hourly';

export interface ApplicationSettings {
  min_age: number;
  min_years_history: number;
  deposit_amount: number;
  deposit_weeks: number;
  trailer_maintenance_monthly: number;
  compensation_type: CompensationType;
  percentage_rate: number;
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
  };
}
