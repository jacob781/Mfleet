import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, getDriver } from '../../lib/adminApi';
import type { DriverDetail } from '../../lib/adminTypes';
import { Button, Card, Spinner, StatusBadge } from '../../components/admin/ui';

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-0">
    <span className="text-sm text-mfleet-gray">{label}</span>
    <span className="text-right text-sm font-medium text-mfleet-gray-dark">{children}</span>
  </div>
);

const DriverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDriver(Number(id))
      .then(setDriver)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (notFound || !driver) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-mfleet-gray">Driver not found.</p>
        <Link to="/admin/drivers" className="mt-4 inline-block">
          <Button variant="secondary">Back to drivers</Button>
        </Link>
      </Card>
    );
  }

  const fullName = `${driver.first_name} ${driver.middle_name ? driver.middle_name + ' ' : ''}${driver.last_name}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">{fullName}</h1>
        <Link to="/admin/drivers">
          <Button variant="ghost">Back to drivers</Button>
        </Link>
      </div>

      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">Profile</h2>
        <Row label="Email">{driver.email}</Row>
        <Row label="Phone">{driver.phone}</Row>
        <Row label="Date of birth">{fmtDate(driver.dob)}</Row>
        <Row label="Status">
          <StatusBadge value={driver.status} />
        </Row>
      </Card>

      <Card className="overflow-hidden">
        <h2 className="px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
          Applications
        </h2>
        {driver.applications.length === 0 ? (
          <div className="py-10 text-center text-sm text-mfleet-gray">No applications for this driver.</div>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">PDF</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {driver.applications.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/admin/applications/${a.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-mfleet-gray">{a.id}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{a.driver_is_owner ? 'Owner' : 'Company'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={a.pdf_status} />
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{fmtDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="text-xs text-mfleet-gray">
        Open an application to view the full submitted form and the generated PDF.
      </p>
    </div>
  );
};

export default DriverDetailPage;
