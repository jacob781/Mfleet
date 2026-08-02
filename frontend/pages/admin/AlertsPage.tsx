import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAlerts } from '../../lib/adminApi';
import type { AlertItem } from '../../lib/adminTypes';
import { Card, Spinner, StatusBadge } from '../../components/admin/ui';

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const when = (days: number | null) =>
    days == null ? 'never uploaded'
    : days < 0 ? `expired ${-days}d ago`
    : days === 0 ? 'expires today'
    : `in ${days}d`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-mfleet-gray-dark">Compliance alerts</h1>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">
            Every required document is on file and valid for the next 30 days. 🎉
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.map((a) => (
                <tr
                  key={`${a.subject_kind}-${a.driver_id ?? a.truck_id ?? a.company_id}-${a.document_type}`}
                  onClick={() =>
                    a.subject_kind === 'driver'
                      ? navigate(`/admin/drivers?focus=${a.driver_id}`)
                      : a.subject_kind === 'truck'
                        ? navigate(`/admin/trucks?focus=${a.truck_id}`)
                        : navigate('/admin/companies')
                  }
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">
                    <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase text-mfleet-gray">
                      {a.subject_kind}
                    </span>
                    {a.subject}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{a.document_type}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{a.expiry_date ?? '—'}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{when(a.days_left)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={a.status} />
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

export default AlertsPage;
