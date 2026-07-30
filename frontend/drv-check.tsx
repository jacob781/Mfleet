import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import './index.css';
import DriversPage from './pages/admin/DriversPage';
import { setTokens } from './lib/adminApi';

setTokens({ access_token: 'x', token_type: 'bearer', refresh_token: 'y' });

const DRIVERS = [
  { id: 1, company_id: 1, first_name: 'John', middle_name: null, last_name: 'Zeta', email: '', phone: '', status: 'Pending', checklist_checked: false, checklist_date: null, doc_flags: [] },
];
(window as any).posted = [];
window.fetch = (async (url: string, init: any = {}) => {
  const path = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  if (init.method === 'POST' && path === '/api/drivers') {
    (window as any).posted.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ ...DRIVERS[0], id: 2, applications: [] }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }
  const body = path === '/api/drivers' ? DRIVERS
    : path === '/api/companies' ? [{ id: 1, name: 'Acme', address_street: '', address_city: 'Seattle', address_state: 'WA', address_zip: '' }]
    : [];
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as any;

createRoot(document.getElementById('root')!).render(
  <MemoryRouter><div className="p-6"><DriversPage /></div></MemoryRouter>,
);
