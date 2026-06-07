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
  examiner_name: string;
  registry_number: string;
  expiration_date: string; // yyyy-mm-dd
  waiver: boolean;
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
}

export interface DrugAlcoholHistory {
  tested_positive_3yrs: boolean;
  breath_alcohol_04_3yrs: boolean;
  refused_test_3yrs: boolean;
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
  type: 'Individual' | 'C Corp' | 'S Corp' | 'Partnership';
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
}

// Metadata returned by GET /api/form/{token}
export interface FormMeta {
  driver_is_owner: boolean;
  company_name: string | null;
  min_age: number | null;
  min_years_history: number | null;
  status: string;
  answers: Partial<DriverFormValues>;
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
