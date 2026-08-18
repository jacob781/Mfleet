import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAlerts, markAlertsRead, markAlertsUnread, markAllAlertsRead } from '../../lib/adminApi';
import type { AlertItem } from '../../lib/adminTypes';
import { Button, Card, Spinner, StatusBadge, cn } from '../../components/admin/ui';
import { ALERTS_CHANGED_EVENT } from '../../lib/adminTypes';

/**
 * The compliance board. Read state is shared by the team, not personal: if someone
 * has already looked at an expiring licence, it should not go red again for the next
 * manager. Read rows stay on the page, greyed, below everything still new — the
 * server sorts them there (see collect_alerts).
 */
const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    listAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const unread = useMemo(() => alerts.filter((a) => !a.read_at), [alerts]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      setPicked(new Set());
      load();
      // The badge in the navbar is a different component with its own copy of the
      // count; without this it keeps showing the number from page load.
      window.dispatchEvent(new Event(ALERTS_CHANGED_EVENT));
    } catch {
      // adminApi already toasted the reason
    } finally {
      setBusy(false);
    }
  };

  const togglePick = (key: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const when = (days: number | null) =>
    days == null ? 'never uploaded'
    : days < 0 ? `expired ${-days}d ago`
    : days === 0 ? 'expires today'
    : `in ${days}d`;

  const openSubject = (a: AlertItem) =>
    a.subject_kind === 'driver' ? navigate(`/admin/drivers?focus=${a.driver_id}`)
    : a.subject_kind === 'truck' ? navigate(`/admin/trucks?focus=${a.truck_id}`)
    : navigate('/admin/companies');

  // The header checkbox works on what is still new — ticking off what is already
  // ticked off is not an action anybody wants.
  const allUnreadPicked = unread.length > 0 && unread.every((a) => picked.has(a.key));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-mfleet-gray-dark">Compliance alerts</h1>
          <p className="mt-1 text-sm text-mfleet-gray">
            {unread.length === 0
              ? 'Nothing new.'
              : `${unread.length} new · marking as read is shared with the whole team`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {picked.size > 0 && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => run(() => markAlertsRead([...picked]))}
            >
              Mark {picked.size} read
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={busy || unread.length === 0}
            onClick={() => run(markAllAlertsRead)}
          >
            Mark all read
          </Button>
        </div>
      </div>

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
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    title="Select everything new"
                    checked={allUnreadPicked}
                    onChange={(e) =>
                      setPicked(e.target.checked ? new Set(unread.map((a) => a.key)) : new Set())
                    }
                  />
                </th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.map((a) => {
                const read = !!a.read_at;
                return (
                  <tr
                    key={a.key}
                    onClick={() => openSubject(a)}
                    className={cn('cursor-pointer hover:bg-gray-50', read && 'opacity-55')}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={picked.has(a.key)}
                        onChange={() => togglePick(a.key)}
                      />
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 font-medium',
                        read ? 'text-mfleet-gray' : 'text-mfleet-gray-dark',
                      )}
                    >
                      <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase text-mfleet-gray">
                        {a.subject_kind}
                      </span>
                      {a.subject}
                    </td>
                    <td className="px-4 py-3 text-mfleet-gray">{a.document_type}</td>
                    <td className="px-4 py-3 text-mfleet-gray">{a.expiry_date ?? '—'}</td>
                    <td className="px-4 py-3 text-mfleet-gray">{when(a.days_left)}</td>
                    <td className="px-4 py-3">
                      {read ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {a.status}
                        </span>
                      ) : (
                        <StatusBadge value={a.status} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() => (read ? markAlertsUnread([a.key]) : markAlertsRead([a.key])))
                        }
                        className={cn(
                          'inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40',
                          read
                            ? 'border-gray-300 bg-white text-mfleet-gray hover:bg-gray-50'
                            : 'border-mfleet-blue/30 bg-mfleet-blue/10 text-mfleet-blue hover:bg-mfleet-blue/20',
                        )}
                      >
                        {read ? 'Mark new' : 'Mark read'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default AlertsPage;
