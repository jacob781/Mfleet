import type {
  ApplicationCreate,
  ApplicationListItem,
  ApplicationResponse,
  ApplicationStatus,
  CompanyCreate,
  CompanyResponse,
  DriverDetail,
  DriverSummary,
  AlertItem,
  ComplianceDocument,
  DriverUpdate,
  Token,
  TruckCreate,
  TruckResponse,
  UserCreate,
  UserResponse,
  UserUpdate,
} from './adminTypes';

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  ((import.meta as any).env?.PROD ? '' : 'http://localhost:8000');

const TOKEN_KEY = 'mfleet_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  detail: any;
  constructor(status: number, detail: any) {
    super(`Request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

// Fired on a 401 so the auth layer can drop the session and redirect to login.
export const AUTH_EXPIRED_EVENT = 'mfleet:auth-expired';

async function parse(res: Response): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, data?.detail ?? data);
  }
  return data;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, init: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { ...authHeaders(), ...(init.headers as any) };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  return parse(res);
}

function jsonRequest(path: string, method: string, body: unknown): Promise<any> {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// --- Auth ------------------------------------------------------------------

// /login expects OAuth2PasswordRequestForm => x-www-form-urlencoded, not JSON.
export async function login(email: string, password: string): Promise<Token> {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
}

export function getMe(): Promise<UserResponse> {
  return request('/api/auth/me');
}

// --- Users (admin-only) ----------------------------------------------------

export function listUsers(): Promise<UserResponse[]> {
  return request('/api/auth/users');
}

export function createUser(body: UserCreate): Promise<UserResponse> {
  return jsonRequest('/api/auth/users', 'POST', body);
}

export function updateUser(id: number, body: UserUpdate): Promise<UserResponse> {
  return jsonRequest(`/api/auth/users/${id}`, 'PATCH', body);
}

export function deleteUser(id: number): Promise<void> {
  return request(`/api/auth/users/${id}`, { method: 'DELETE' }).then(() => undefined);
}

export function adminResetPassword(id: number, newPassword: string): Promise<void> {
  return jsonRequest(`/api/auth/users/${id}/password`, 'POST', { new_password: newPassword }).then(
    () => undefined,
  );
}

export function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  return jsonRequest('/api/auth/me/password', 'POST', {
    current_password: currentPassword,
    new_password: newPassword,
  }).then(() => undefined);
}

// --- Companies -------------------------------------------------------------

export function listCompanies(): Promise<CompanyResponse[]> {
  return request('/api/companies');
}

export function createCompany(body: CompanyCreate): Promise<CompanyResponse> {
  return jsonRequest('/api/companies', 'POST', body);
}

export function updateCompany(id: number, body: Partial<CompanyResponse>): Promise<CompanyResponse> {
  return jsonRequest(`/api/companies/${id}`, 'PATCH', body);
}

// --- Drivers ---------------------------------------------------------------

export function listDrivers(companyId?: number): Promise<DriverSummary[]> {
  const qs = companyId != null ? `?company_id=${companyId}` : '';
  return request(`/api/drivers${qs}`);
}

export function getDriver(id: number): Promise<DriverDetail> {
  return request(`/api/drivers/${id}`);
}

export function updateDriver(id: number, body: DriverUpdate): Promise<DriverDetail> {
  return jsonRequest(`/api/drivers/${id}`, 'PATCH', body);
}

export function listDriverDocuments(id: number): Promise<ComplianceDocument[]> {
  return request(`/api/drivers/${id}/documents`);
}

// --- Compliance documents & alerts -----------------------------------------

export function listTruckDocuments(id: number): Promise<ComplianceDocument[]> {
  return request(`/api/trucks/${id}/documents`);
}

export function listAlerts(days?: number): Promise<AlertItem[]> {
  const qs = days != null ? `?days=${days}` : '';
  return request(`/api/compliance/alerts${qs}`);
}

// Files (compliance docs, application uploads) are JWT-protected — fetch with the
// auth header and hand back a blob/object URL the browser can show or save.
async function fetchFileBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) await parse(res); // throws ApiError with the server detail
  return res.blob();
}

function saveBlob(blob: Blob, baseName: string): void {
  const ext =
    blob.type === 'application/pdf' ? 'pdf'
    : blob.type === 'image/png' ? 'png'
    : blob.type.startsWith('image/') ? 'jpg'
    : 'bin';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.${ext}`.replace(/\s+/g, '_');
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function getDocumentObjectUrl(docId: number): Promise<string> {
  return URL.createObjectURL(await fetchFileBlob(`/api/compliance/documents/${docId}/file`));
}

export async function downloadDocument(docId: number, baseName: string): Promise<void> {
  saveBlob(await fetchFileBlob(`/api/compliance/documents/${docId}/file`), baseName);
}

// Driver-uploaded documents served per application (by doc_type, e.g. "cdl").
export async function getApplicationDocumentObjectUrl(appId: number, docType: string): Promise<string> {
  return URL.createObjectURL(await fetchFileBlob(`/api/applications/${appId}/documents/${docType}`));
}

export async function downloadApplicationDocument(appId: number, docType: string, baseName: string): Promise<void> {
  saveBlob(await fetchFileBlob(`/api/applications/${appId}/documents/${docType}`), baseName);
}

// --- Trucks ----------------------------------------------------------------

export function listTrucks(companyId?: number): Promise<TruckResponse[]> {
  const qs = companyId != null ? `?company_id=${companyId}` : '';
  return request(`/api/trucks${qs}`);
}

export function createTruck(body: TruckCreate): Promise<TruckResponse> {
  return jsonRequest('/api/trucks', 'POST', body);
}

export function updateTruck(id: number, body: Partial<TruckCreate>): Promise<TruckResponse> {
  return jsonRequest(`/api/trucks/${id}`, 'PATCH', body);
}

export function deleteTruck(id: number): Promise<void> {
  return request(`/api/trucks/${id}`, { method: 'DELETE' }).then(() => undefined);
}

// --- Applications ----------------------------------------------------------

export function listApplications(filters: {
  status?: string;
  company_id?: number;
} = {}): Promise<ApplicationListItem[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.company_id != null) params.set('company_id', String(filters.company_id));
  const qs = params.toString();
  return request(`/api/applications${qs ? `?${qs}` : ''}`);
}

export function getApplication(id: number): Promise<ApplicationResponse> {
  return request(`/api/applications/${id}`);
}

// Sanitized driver-submitted answers (SSN/banking masked, signatures stripped).
export function getApplicationAnswers(id: number): Promise<Record<string, unknown>> {
  return request(`/api/applications/${id}/answers`);
}

// Fetch the protected PDF as a blob and return an object URL (for inline preview).
export async function getPdfObjectUrl(id: number): Promise<string> {
  const res = await fetch(`${API_BASE}/api/applications/${id}/pdf`, { headers: authHeaders() });
  if (!res.ok) {
    await parse(res); // throws ApiError with server detail
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function createApplication(body: ApplicationCreate): Promise<ApplicationResponse> {
  return jsonRequest('/api/applications', 'POST', body);
}

// Re-run PDF generation from the driver's saved answers (no driver action needed).
export function regeneratePdf(id: number): Promise<ApplicationResponse> {
  return request(`/api/applications/${id}/regenerate-pdf`, { method: 'POST' });
}

export function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
): Promise<ApplicationResponse> {
  return jsonRequest(`/api/applications/${id}/status`, 'PATCH', { status });
}

// Manager counter-signature: applies the company/carrier signature, regenerates
// the PDF with both signatures, and approves the application.
export function counterSign(
  id: number,
  sig: { image_base64: string; signer_first_name: string; timestamp_et: string; date: string },
): Promise<ApplicationResponse> {
  return jsonRequest(`/api/applications/${id}/countersign`, 'POST', sig);
}

// PDF endpoint is JWT-protected, so a plain <a href> can't carry the token.
// Fetch as a blob with the Authorization header and trigger a download.
export async function downloadPdf(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/applications/${id}/pdf`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await parse(res); // throws ApiError with the server detail
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `application_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
