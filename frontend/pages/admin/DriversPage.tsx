import React, { useEffect, useMemo, useState } from 'react';
import { listCompanies, listDrivers } from '../../lib/adminApi';
import type { CompanyResponse, DriverSummary } from '../../lib/adminTypes';
import { Card, SelectInput, Spinner, StatusBadge } from '../../components/admin/ui';

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    listDrivers(companyFilter ? Number(companyFilter) : undefined)
      .then(setDrivers)
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, [companyFilter]);

  const companyName = useMemo(() => {
    const map = new Map<number, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return (id: number) => map.get(id) ?? `#${id}`;
  }, [companies]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-mfleet-gray-dark">Drivers</h1>

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

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">
            No drivers yet. Drivers appear here once they complete an application.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">
                    {d.first_name} {d.middle_name ? `${d.middle_name} ` : ''}
                    {d.last_name}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{companyName(d.company_id)}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{d.email}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{d.phone}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={d.status} />
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

export default DriversPage;
