import type {
  ApplicationCreate,
  ApplicationListItem,
  ApplicationResponse,
  CompanyCreate,
  CompanyResponse,
  DriverSummary,
  Token,
  UserCreate,
  UserResponse,
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

// --- Companies -------------------------------------------------------------

export function listCompanies(): Promise<CompanyResponse[]> {
  return request('/api/companies');
}

export function createCompany(body: CompanyCreate): Promise<CompanyResponse> {
  return jsonRequest('/api/companies', 'POST', body);
}

// --- Drivers ---------------------------------------------------------------

export function listDrivers(companyId?: number): Promise<DriverSummary[]> {
  const qs = companyId != null ? `?company_id=${companyId}` : '';
  return request(`/api/drivers${qs}`);
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

export function createApplication(body: ApplicationCreate): Promise<ApplicationResponse> {
  return jsonRequest('/api/applications', 'POST', body);
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
