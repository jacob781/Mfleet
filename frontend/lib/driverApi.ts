import type { DriverFormValues, FormMeta, EmploymentItem } from './driverTypes';
import type { Gap } from './employmentGaps';
import type { MotusLookupResponse } from './adminTypes';
import { errorText, toast } from '../components/Toast';

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
  if (!res.ok) {
    const detail = data?.detail ?? data;
    toast(errorText(res.status, detail));
    throw new FormError(res.status, detail);
  }
  return data;
}

export function getForm(token: string): Promise<FormMeta> {
  // no-store: the token's status (expired/reopened) can change server-side, and a
  // cached 410 "link expired" must not survive the manager extending the link.
  return fetch(`${API_BASE}/api/form/${token}`, { cache: 'no-store' }).then(parse);
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

// MOTUS carrier lookup by USDOT number (token-gated) — auto-fills a prior employer.
export function lookupEmployer(token: string, usdot: string): Promise<MotusLookupResponse> {
  return fetch(`${API_BASE}/api/form/${token}/motus/lookup?usdot=${encodeURIComponent(usdot)}`).then(parse);
}

export function getStatus(token: string): Promise<{ status: string; pdf_status: string | null }> {
  return fetch(`${API_BASE}/api/form/${token}/status`, { cache: 'no-store' }).then(parse);
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

// Per-truck document upload/view for owner-operators (keyed by equipment index).
export function uploadTruckDocument(token: string, truckIndex: number, docType: string, file: File): Promise<any> {
  const body = new FormData();
  body.append('file', file);
  return fetch(`${API_BASE}/api/form/${token}/trucks/${truckIndex}/documents/${docType}`, { method: 'POST', body }).then(parse);
}

export function truckDocumentUrl(token: string, truckIndex: number, docType: string): string {
  return `${API_BASE}/api/form/${token}/trucks/${truckIndex}/documents/${docType}`;
}

// Direct URL of the full assembled contract preview (token access). Used for both the
// inline iframe and "open in new tab" — a real URL, not a blob:, so iOS Safari works.
export function previewUrl(token: string): string {
  return `${API_BASE}/api/form/${token}/preview`;
}

// Validate that the preview is ready (throws FormError with 422 detail when fields are
// incomplete) without keeping a blob: URL around.
export async function checkPreview(token: string): Promise<void> {
  const res = await fetch(previewUrl(token));
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
    truck_document_expiries: {},
  };
}
