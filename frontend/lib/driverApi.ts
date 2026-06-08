import type { DriverFormValues, FormMeta } from './driverTypes';

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  ((import.meta as any).env?.PROD ? '' : 'http://localhost:8000');

export class FormError extends Error {
  status: number;
  detail: any;
  constructor(status: number, detail: any) {
    super(`Form request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

async function parse(res: Response): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new FormError(res.status, data?.detail ?? data);
  return data;
}

export function getForm(token: string): Promise<FormMeta> {
  return fetch(`${API_BASE}/api/form/${token}`).then(parse);
}

export function saveDraft(token: string, partial: Record<string, unknown>): Promise<any> {
  return fetch(`${API_BASE}/api/form/${token}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  }).then(parse);
}

export function submitForm(token: string, values: DriverFormValues): Promise<any> {
  return fetch(`${API_BASE}/api/form/${token}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  }).then(parse);
}

export function getStatus(token: string): Promise<{ status: string; pdf_status: string | null }> {
  return fetch(`${API_BASE}/api/form/${token}/status`).then(parse);
}

export function pdfUrl(token: string): string {
  return `${API_BASE}/api/form/${token}/pdf`;
}

const emptyAddress = () => ({ street: '', city: '', state: '', zip: '', years: '' });
const emptyExperienceItem = () => ({ type: '', dates: '', miles: '' });

export function emptyDriverForm(): DriverFormValues {
  return {
    application_date: new Date().toISOString().slice(0, 10),
    first_name: '',
    middle_name: '',
    last_name: '',
    ssn: '',
    dob: '',
    phone: '',
    email: '',
    address: emptyAddress(),
    residency_history: [],
    emergency: { name: '', phone: '', relation: '' },
    cdl: { state: '', number: '', type: '', expiration: '' },
    medical: { examiner_name: '', registry_number: '', expiration_date: '', waiver: false },
    experience: {
      straight: emptyExperienceItem(),
      tractor: emptyExperienceItem(),
      doubles: emptyExperienceItem(),
    },
    license_history: { denied: false, denied_reason: '', suspended: false, suspended_reason: '' },
    accidents: [],
    violations: [],
    drug_alcohol_history: {
      tested_positive_3yrs: false,
      breath_alcohol_04_3yrs: false,
      refused_test_3yrs: false,
      violated_dot_regulations: false,
      sap_evaluation: false,
      sap_details: '',
    },
    employment_history: [],
    seven_day_log: Array.from({ length: 7 }, () => ({ date: '', hours: '', relieved_time: '' })),
    last_relieved_time: '',
    last_relieved_date: '',
    last_relieved_location: '',
    equipment: [],
    ifta_choice: null,
    w9: { name: '', business_name: '', type: 'Individual', address: '', city_state_zip: '', tin: '' },
    banking: { bank_name: '', routing_number: '', account_number: '', account_type: 'Checking' },
    policies: [],
    signatures: {},
  };
}
