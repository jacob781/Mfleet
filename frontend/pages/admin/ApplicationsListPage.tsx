import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listApplications, listCompanies } from '../../lib/adminApi';
import type { ApplicationListItem, CompanyResponse } from '../../lib/adminTypes';
import { Button, Card, SelectInput, Spinner, StatusBadge } from '../../components/admin/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_driver', label: 'Pending driver' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending review' },
];

function fmtDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

const ApplicationsListPage: React.FC = () => {
  const [apps, setApps] = useState<ApplicationListItem[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Companies once (for name resolution + the filter dropdown).
  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    listApplications({
      status: statusFilter || undefined,
      company_id: companyFilter ? Number(companyFilter) : undefined,
    })
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [statusFilter, companyFilter]);

  const companyName = useMemo(() => {
    const map = new Map<number, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return (id: number) => map.get(id) ?? `#${id}`;
  }, [companies]);

  const copyLink = async (item: ApplicationListItem) => {
    try {
      await navigator.clipboard.writeText(item.apply_url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((c) => (c === item.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">Applications</h1>
        <Link to="/admin/applications/new">
          <Button>New application</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </div>
        <div className="w-56">
          <SelectInput value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">
            No applications match these filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">PDF</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-mfleet-gray">{a.id}</td>
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">
                    {companyName(a.company_id)}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {a.driver_id ? `#${a.driver_id}` : <span className="italic">New driver</span>}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {a.driver_is_owner ? 'Owner' : 'Company'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={a.pdf_status} />
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{fmtDate(a.created_at)}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{fmtDate(a.expires_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => copyLink(a)}>
                        {copiedId === a.id ? 'Copied!' : 'Copy link'}
                      </Button>
                      <Link to={`/admin/applications/${a.id}`}>
                        <Button variant="secondary">Open</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default ApplicationsListPage;
