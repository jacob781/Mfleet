// Types for the driver application wizard. Mirrors backend ApplicationPayload
// (backend/models.py) minus the manager `config` (injected server-side).

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  years?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface CDLInfo {
  state: string;
  number: string;
  type: string;
  expiration: string; // yyyy-mm-dd
}

export interface MedicalInfo {
  expiration_date: string; // yyyy-mm-dd
}

export interface ExperienceItem {
  type: string;
  dates: string;
  miles: string;
}

export interface ExperienceGroup {
  straight: ExperienceItem;
  tractor: ExperienceItem;
  doubles: ExperienceItem;
}

export interface LicenseHistory {
  denied: boolean;
  denied_reason?: string;
  suspended: boolean;
  suspended_reason?: string;
}

export interface AccidentRecord {
  date: string;
  nature: string;
  fatalities: number;
  injuries: number;
  chemical_spill: boolean;
}

export interface Violation {
  date: string;
  location: string;
  charge: string;
  penalty: string;
  vehicle_type: string;
}

export interface DrugAlcoholHistory {
  tested_positive_3yrs: boolean;
  breath_alcohol_04_3yrs: boolean;
  refused_test_3yrs: boolean;
  tested_positive_preemployment: boolean;
  violated_dot_regulations: boolean;
  sap_evaluation: boolean;
  sap_details?: string;
}

export interface EmploymentItem {
  employer_name: string;
  employer_address: string;
  employer_city: string;
  employer_state: string;
  employer_zip: string;
  employer_phone: string;
  employer_fax?: string;
  start_date: string;
  end_date: string;
  position: string;
  salary: string;
  reason_for_leaving: string;
  subject_to_fmcsr: boolean;
  safety_sensitive: boolean;
  was_driver_subject_to_testing: boolean;
}

export interface DailyLog {
  date: string;
  hours: string;
  relieved_time: string;
}

export interface TruckEquipment {
  make: string;
  year: number;
  type: string;
  vin: string;
  state: string;
  plate: string;
}

export interface W9 {
  name: string;
  business_name?: string;
  type: 'Individual' | 'C Corp' | 'S Corp' | 'Partnership' | 'LLC' | 'Trust/estate' | 'Other';
  llc_classification?: string;       // C / S / P, only when type = LLC
  other_classification?: string;     // free text, only when type = Other
  exempt_payee_code?: string;        // W-9 line 4, entities only
  fatca_exemption_code?: string;     // W-9 line 4, entities only
  address: string;
  city_state_zip: string;
  tin: string;
}

export interface Banking {
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: 'Checking' | 'Savings';
}

export interface EmploymentDeclaration {
  gap_explanations: Record<string, string>; // keyed by "<from>_<to>" (ISO), see lib/employmentGaps
  not_employed_affirm: boolean;
  not_convicted_affirm: boolean;
}

export interface SignatureData {
  image_base64: string | null;
  signer_first_name: string;
  timestamp_et: string;
  date: string;
}

export interface DriverFormValues {
  application_date: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  ssn: string;
  dob: string;
  phone: string;
  email: string;
  address: Address;
  residency_history: Address[];
  emergency: EmergencyContact;
  cdl: CDLInfo;
  medical: MedicalInfo;
  experience: ExperienceGroup;
  license_history: LicenseHistory;
  accidents: AccidentRecord[];
  violations: Violation[];
  drug_alcohol_history: DrugAlcoholHistory;
  employment_history: EmploymentItem[];
  employment_declaration: EmploymentDeclaration;
  seven_day_log: DailyLog[];
  last_relieved_time: string;
  last_relieved_date: string;
  last_relieved_location: string;
  equipment: TruckEquipment[];
  ifta_choice?: 'own' | 'carrier' | null;
  w9: W9;
  banking: Banking;
  policies: { title: string; body: string }[];
  signatures: Record<string, SignatureData>;
  // Expiry dates (YYYY-MM-DD) for owner truck docs without a dedicated field.
  document_expiries?: { annual_inspection?: string; registration?: string };
}

// Metadata returned by GET /api/form/{token}
import type { FineRow, FineSection, FineSchedule, FeesSchedule } from './adminTypes';
export type { FineRow, FineSection, FineSchedule, FeesSchedule };

export interface Compensation {
  compensation_type: 'percentage' | 'weekly_flat' | 'per_mile' | 'hourly' | null;
  percentage_rate_non_amazon: number | null;
  percentage_rate_amazon: number | null;
  weekly_amount: number | null;
  loaded_rate: number | null;
  empty_rate: number | null;
  hourly_rate: number | null;
  insurance_cargo_liability: number | null;
  eld_device_weekly: number | null;          // Service / week
  tablet_weekly: number | null;              // Tablet / month
  prepass_monthly: number | null;            // IFTA / week
  administration_fee_weekly: number | null;
}

export interface FormMeta {
  driver_is_owner: boolean;
  company_name: string | null;
  min_age: number | null;
  min_years_history: number | null;
  status: string;
  answers: Partial<DriverFormValues>;
  include_penalties: boolean;
  include_fees: boolean;
  fine_schedule: FineSchedule | null;
  fees_schedule: FeesSchedule | null;
  compensation: Compensation | null;
}

export const SIGNATURE_SECTIONS = [
  { key: 'personal_info', label: 'Personal Information & Application' },
  { key: 'qualifications', label: 'Driver Qualifications' },
  { key: 'employment_auth', label: 'Employment Verification Authorization' },
  { key: 'drug_testing', label: 'Drug & Alcohol Testing Consent' },
  { key: 'lease_agreement', label: 'Lease Agreement', ownerOnly: true },
  { key: 'w9', label: 'W-9 Taxpayer Certification' },
  { key: 'direct_deposit', label: 'Direct Deposit Authorization' },
] as const;
