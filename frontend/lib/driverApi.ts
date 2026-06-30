import type { DriverFormValues, FormMeta, EmploymentItem } from './driverTypes';
import type { Gap } from './employmentGaps';

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

// Ask the server (the single source of truth) to compute employment gaps from the
// current history, so the UI never recomputes them itself.
export function getEmploymentGaps(
  token: string,
  employment_history: EmploymentItem[],
  application_date: string,
): Promise<Gap[]> {
  return fetch(`${API_BASE}/api/form/${token}/employment-gaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employment_history, application_date }),
  })
    .then(parse)
    .then((r) => r.gaps as Gap[]);
}

export function getStatus(token: string): Promise<{ status: string; pdf_status: string | null }> {
  return fetch(`${API_BASE}/api/form/${token}/status`).then(parse);
}

export function pdfUrl(token: string): string {
  return `${API_BASE}/api/form/${token}/pdf`;
}

// Upload a required document (multipart). Stored on the server by id; the path is
// recorded in the draft and folded into the final contract.
export function uploadDocument(token: string, docType: string, file: File): Promise<any> {
  const body = new FormData();
  body.append('file', file);
  return fetch(`${API_BASE}/api/form/${token}/documents/${docType}`, { method: 'POST', body }).then(parse);
}

// View an already-uploaded document back (token-gated, never static).
export function documentUrl(token: string, docType: string): string {
  return `${API_BASE}/api/form/${token}/documents/${docType}`;
}

// Fetch the full assembled contract preview as a blob object URL (token access).
// Throws FormError (422 when fields are still incomplete).
export async function getPreviewObjectUrl(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/form/${token}/preview`);
  if (!res.ok) {
    const text = await res.text();
    let detail: any = text;
    try {
      detail = text ? JSON.parse(text).detail : null;
    } catch {
      /* keep raw text */
    }
    throw new FormError(res.status, detail);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
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
    medical: { expiration_date: '' },
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
      tested_positive_preemployment: false,
      violated_dot_regulations: false,
      sap_evaluation: false,
      sap_details: '',
    },
    employment_history: [],
    employment_declaration: { gap_explanations: {}, not_employed_affirm: false, not_convicted_affirm: false },
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
    document_expiries: { annual_inspection: '', registration: '' },
  };
}
