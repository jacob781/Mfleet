import React, { useState } from 'react';
import { ApiError, changeMyPassword } from '../../lib/adminApi';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, Spinner, TextInput } from '../../components/admin/ui';

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMsg(null);
    if (next.length < 8) return setMsg({ ok: false, text: 'New password must be at least 8 characters.' });
    setBusy(true);
    try {
      await changeMyPassword(current, next);
      setMsg({ ok: true, text: 'Password changed.' });
      setCurrent('');
      setNext('');
    } catch (e) {
      setMsg({
        ok: false,
        text: e instanceof ApiError && typeof e.detail === 'string' ? e.detail : 'Could not change password.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-mfleet-gray-dark">My account</h1>

      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">Profile</h2>
        <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
          <span className="text-mfleet-gray">Name</span>
          <span className="font-medium text-mfleet-gray-dark">{user?.full_name || '—'}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
          <span className="text-mfleet-gray">Email</span>
          <span className="font-medium text-mfleet-gray-dark">{user?.email}</span>
        </div>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-mfleet-gray">Role</span>
          <span className="font-medium capitalize text-mfleet-gray-dark">{user?.role}</span>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Change password</h2>
        <div className="flex flex-col gap-4">
          <Field label="Current password">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="New password">
            <TextInput
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
        </div>
        {msg && (
          <div
            className={
              'mt-3 rounded-lg px-3 py-2 text-sm ' +
              (msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')
            }
          >
            {msg.text}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={submit} disabled={busy || !current || !next}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Update password'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AccountPage;
