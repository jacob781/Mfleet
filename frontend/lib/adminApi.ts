import type {
  ApplicationCreate,
  ApplicationListItem,
  ApplicationResponse,
  ApplicationStatus,
  CompanyCreate,
  CompanyResponse,
  DriverCreate,
  DriverDetail,
  DriverSummary,
  AlertItem,
  ComplianceDocument,
  DriverUpdate,
  EmployerVerification,
  GoogleStatus,
  Token,
  TruckCreate,
  TruckResponse,
  UserCreate,
  UserResponse,
  UserUpdate,
} from './adminTypes';
import { errorText, toast } from '../components/Toast';

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  ((import.meta as any).env?.PROD ? '' : 'http://localhost:8000');

const TOKEN_KEY = 'mfleet_token';
const REFRESH_KEY = 'mfleet_refresh';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function getRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
/** Store a login/refresh response: short-lived access token + rotating refresh token. */
export function setTokens(t: Token): void {
  setToken(t.access_token);
  if (t.refresh_token) localStorage.setItem(REFRESH_KEY, t.refresh_token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
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
    const detail = data?.detail ?? data;
    toast(errorText(res.status, detail));
    throw new ApiError(res.status, detail);
  }
  return data;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Exchange the refresh token for a new pair. Rotation means the old refresh token
 * is blacklisted server-side, so this must never run twice in parallel — a single
 * in-flight promise is shared by every request that hits a 401 at the same time.
 */
let renewal: Promise<boolean> | null = null;

/**
 * The only endpoints a 401 must NOT trigger a renewal for: /refresh would recurse,
 * and login/logout have no session to save. Every other /api/auth/* route — /me
 * above all — has to renew like any other call. Excluding the whole prefix logged
 * managers out on any reload once the access token had aged past its hour, while
 * their refresh token was still good for a day.
 */
const NO_RENEW = new Set(['/api/auth/login', '/api/auth/refresh', '/api/auth/logout']);

function renewSession(): Promise<boolean> {
  if (!renewal) {
    const refresh = getRefresh();
    const run = !refresh
      ? Promise.resolve(false)
      : fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
        .then(async (res) => {
          if (res.ok) {
            setTokens(await res.json());
            return true;
          }
          // Rotation is single-use, so a second tab that raced us gets refused
          // here — but it already wrote a fresh pair to localStorage, and that
          // one is good. Only a token nobody replaced means the session is over.
          return getRefresh() !== refresh;
        })
        .catch(() => false);
    renewal = run.finally(() => { renewal = null; });
  }
  return renewal;
}

async function request(path: string, init: RequestInit = {}, retry = true): Promise<any> {
  const headers: Record<string, string> = { ...authHeaders(), ...(init.headers as any) };
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    toast('Could not reach the server. Check your connection and try again.');
    throw new ApiError(0, 'network error');
  }
  // Access token died mid-session: renew silently and replay the call once. Only
  // if that fails does parse() clear the session and send the manager to login.
  if (res.status === 401 && retry && !NO_RENEW.has(path) && getRefresh()) {
    if (await renewSession()) return request(path, init, false);
  }
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

/** Retire the refresh token server-side so it can't be replayed after logout. */
export function logoutSession(): Promise<void> {
  const refresh = getRefresh();
  if (!refresh) return Promise.resolve();
  return jsonRequest('/api/auth/logout', 'POST', { refresh_token: refresh })
    .then(() => undefined)
    .catch(() => undefined);
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

export function listCompanies(hasLicense?: boolean): Promise<CompanyResponse[]> {
  return request(`/api/companies${hasLicense == null ? '' : `?has_license=${hasLicense}`}`);
}

export function createCompany(body: CompanyCreate): Promise<CompanyResponse> {
  return jsonRequest('/api/companies', 'POST', body);
}

export function updateCompany(id: number, body: Partial<CompanyResponse>): Promise<CompanyResponse> {
  return jsonRequest(`/api/companies/${id}`, 'PATCH', body);
}

// --- Drivers ---------------------------------------------------------------

export function listDrivers(
  companyId?: number, checklist?: boolean, doc?: DocFilter, driverStatus?: string,
): Promise<DriverSummary[]> {
  const qs = listQuery(companyId, checklist, doc);
  const status = driverStatus ? `${qs ? '&' : '?'}driver_status=${encodeURIComponent(driverStatus)}` : '';
  return request(`/api/drivers${qs}${status}`);
}

export function createDriver(body: DriverCreate): Promise<DriverDetail> {
  return jsonRequest('/api/drivers', 'POST', body);
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

// --- Employer verification --------------------------------------------------

export function listEmployers(appId: number): Promise<EmployerVerification[]> {
  return request(`/api/applications/${appId}/employers`);
}

export function updateEmployerEmail(
  appId: number,
  evId: number,
  email: string | null,
): Promise<EmployerVerification> {
  return jsonRequest(`/api/applications/${appId}/employers/${evId}`, 'PATCH', { email });
}

export function sendEmployerPacket(appId: number, evId: number): Promise<EmployerVerification> {
  return request(`/api/applications/${appId}/employers/${evId}/send`, { method: 'POST' });
}

export function markEmployerReceived(appId: number, evId: number): Promise<EmployerVerification> {
  return request(`/api/applications/${appId}/employers/${evId}/received`, { method: 'POST' });
}

export function openEmployerPacketInTab(appId: number, evId: number): void {
  openFileInTab(`/api/applications/${appId}/employers/${evId}/pdf`);
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
async function fetchFileBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...(init.headers as any) } });
  if (!res.ok) await parse(res); // throws ApiError with the server detail
  return res.blob();
}

// Short-lived, file-scoped token for opening a document straight in a browser tab.
function getFileToken(): Promise<string> {
  return request('/api/auth/file-token').then((r: Token) => r.access_token);
}

// Open a document in a new tab by navigating straight to the server, authorised by a
// short-lived file token in the URL (a tab navigation can't send headers). Unlike a
// blob: URL, a tab reload re-hits the server — so after a document is replaced the
// tab shows the current file (old one is overwritten on disk, `no-store` server-side),
// instead of a stale in-memory snapshot that lingers until the admin page reloads.
function openFileInTab(path: string): void {
  const tab = window.open('', '_blank'); // open synchronously so popup blockers allow it
  getFileToken()
    .then((token) => {
      const sep = path.includes('?') ? '&' : '?';
      const url = `${API_BASE}${path}${sep}token=${encodeURIComponent(token)}`;
      if (tab) tab.location.href = url; else window.open(url, '_blank');
    })
    .catch(() => tab?.close());
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

export function openDocumentInTab(docId: number): void {
  openFileInTab(`/api/compliance/documents/${docId}/file`);
}

export async function downloadDocument(docId: number, baseName: string): Promise<void> {
  saveBlob(await fetchFileBlob(`/api/compliance/documents/${docId}/file`), baseName);
}

export function documentBlob(docId: number): Promise<Blob> {
  return fetchFileBlob(`/api/compliance/documents/${docId}/file`);
}

/** Turn a stored photo 90° (positive = clockwise). Replaces the file on the server. */
export function rotateDocument(docId: number, deg: number): Promise<ComplianceDocument> {
  return request(`/api/compliance/documents/${docId}/rotate?deg=${deg}`, { method: 'POST' });
}

// Driver-uploaded documents served per application (by doc_type, e.g. "cdl").
export function openApplicationDocumentInTab(appId: number, docType: string): void {
  openFileInTab(`/api/applications/${appId}/documents/${docType}`);
}

export async function downloadApplicationDocument(appId: number, docType: string, baseName: string): Promise<void> {
  saveBlob(await fetchFileBlob(`/api/applications/${appId}/documents/${docType}`), baseName);
}

// Manager-side multipart upload (auth header only; browser sets the multipart boundary).
/** Details printed on the document; all optional, blank fields are simply not sent. */
export interface DocFields {
  expiry: string;
  issue?: string;
  number?: string;
  address?: string;
  issuing_state?: string;
}

function uploadForm(path: string, file: File | null, values: DocFields | string): Promise<any> {
  const v: DocFields = typeof values === 'string' ? { expiry: values } : values;
  const fd = new FormData();
  if (file) fd.append('file', file);
  for (const [key, val] of Object.entries(v)) {
    if (val) fd.append(key, val);
  }
  return request(path, { method: 'POST', body: fd });
}

export function uploadTruckDocument(
  truckId: number, docType: string, file: File | null, values: DocFields,
): Promise<ComplianceDocument> {
  return uploadForm(`/api/trucks/${truckId}/documents/${docType}`, file, values);
}

export function uploadOwnerLicense(
  companyId: number, file: File | null, expiry: string,
): Promise<CompanyResponse> {
  return uploadForm(`/api/companies/${companyId}/owner-license`, file, expiry);
}

export function uploadDriverDocument(
  driverId: number, docType: string, file: File | null, values: DocFields,
): Promise<ComplianceDocument> {
  return uploadForm(`/api/drivers/${driverId}/documents/${docType}`, file, values);
}

// Every version of one document, newest first (see the routers for the ordering).
export function listDriverDocumentHistory(
  driverId: number, docType: string,
): Promise<ComplianceDocument[]> {
  return request(`/api/drivers/${driverId}/documents/${docType}/history`);
}

export function listTruckDocumentHistory(
  truckId: number, docType: string,
): Promise<ComplianceDocument[]> {
  return request(`/api/trucks/${truckId}/documents/${docType}/history`);
}

export function openOwnerLicenseInTab(companyId: number): void {
  openFileInTab(`/api/companies/${companyId}/owner-license/file`);
}

export async function downloadOwnerLicense(companyId: number, baseName: string): Promise<void> {
  saveBlob(await fetchFileBlob(`/api/companies/${companyId}/owner-license/file`), baseName);
}

// --- Excel export ----------------------------------------------------------

/** Download a list as .xlsx. `ids` are the rows the page is showing, in its order —
 *  that is how the sheet inherits every filter, the search box and the sort. */
export async function exportXlsx(
  kind: 'drivers' | 'trucks' | 'companies', ids: number[],
): Promise<void> {
  const blob = await fetchFileBlob(`/api/export/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${kind}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Trucks ----------------------------------------------------------------

export function listTrucks(
  companyId?: number, checklist?: boolean, doc?: DocFilter,
): Promise<TruckResponse[]> {
  return request(`/api/trucks${listQuery(companyId, checklist, doc)}`);
}

/** "document on file?" list filter — `type` is a doc_type key (cdl, registration…). */
export interface DocFilter { type: string; has: boolean }

// Shared query builder for the company + checklist + document list filters.
function listQuery(companyId?: number, checklist?: boolean, doc?: DocFilter): string {
  const p = new URLSearchParams();
  if (companyId != null) p.set('company_id', String(companyId));
  if (checklist != null) p.set('checklist', String(checklist));
  if (doc) {
    p.set('doc', doc.type);
    p.set('has_doc', String(doc.has));
  }
  const qs = p.toString();
  return qs ? `?${qs}` : '';
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

export function deleteDriver(id: number): Promise<void> {
  return request(`/api/drivers/${id}`, { method: 'DELETE' }).then(() => undefined);
}

// mode: 'cascade' deletes everything; 'reassign' moves drivers/trucks/apps to targetCompanyId.
export function deleteCompany(id: number, mode: 'cascade' | 'reassign', targetCompanyId?: number): Promise<void> {
  const qs = new URLSearchParams({ mode });
  if (targetCompanyId != null) qs.set('target_company_id', String(targetCompanyId));
  return request(`/api/companies/${id}?${qs}`, { method: 'DELETE' }).then(() => undefined);
}

// --- Integrations (Google Drive) -------------------------------------------

export function googleStatus(): Promise<GoogleStatus> {
  return request('/api/integrations/google/status');
}

export function googleConnect(): Promise<{ auth_url: string }> {
  return request('/api/integrations/google/connect', { method: 'POST' });
}

export function googleDisconnect(): Promise<void> {
  return request('/api/integrations/google/disconnect', { method: 'POST' }).then(() => undefined);
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

// Set/extend the driver link's expiry (ISO datetime), so a reopened application stays reachable.
export function updateApplicationLinkExpiry(
  id: number,
  expiresAt: string,
): Promise<ApplicationResponse> {
  return jsonRequest(`/api/applications/${id}/link-expiry`, 'PATCH', { expires_at: expiresAt });
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
