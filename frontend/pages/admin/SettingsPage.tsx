import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { googleConnect, googleDisconnect, googleStatus } from '../../lib/adminApi';
import type { GoogleStatus } from '../../lib/adminTypes';
import { Button, Card, Spinner } from '../../components/admin/ui';

const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();

  const refresh = () => {
    setLoading(true);
    googleStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  // Banner after returning from Google's consent screen.
  const result = params.get('google');
  useEffect(() => {
    if (result) {
      const t = setTimeout(() => {
        params.delete('google');
        setParams(params, { replace: true });
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [result]);

  const connect = async () => {
    setBusy(true);
    try {
      const { auth_url } = await googleConnect();
      window.location.href = auth_url; // off to Google's consent screen
    } catch {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Google Drive? Signed documents will stop syncing.')) return;
    setBusy(true);
    try {
      await googleDisconnect();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-mfleet-gray-dark">Settings</h1>

      {result === 'connected' && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Google Drive connected.
        </div>
      )}
      {result === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not connect Google Drive. Please try again.
        </div>
      )}

      <Card className="p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
          Google Drive
        </h2>
        <p className="mb-4 text-sm text-mfleet-gray">
          Connect once. Signed contracts are uploaded automatically into a per-company /
          per-driver folder structure. The connection refreshes itself — you only re-connect
          if it's revoked.
        </p>

        {loading ? (
          <Spinner className="h-5 w-5" />
        ) : !status?.configured ? (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Not configured on the server yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and
            GOOGLE_REDIRECT_URI in the backend environment, then reload this page.
          </div>
        ) : status.connected ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-mfleet-gray-dark">
                Connected{status.email ? ` — ${status.email}` : ''}
              </div>
              {status.connected_at && (
                <div className="text-xs text-mfleet-gray">
                  since {new Date(status.connected_at).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={connect} disabled={busy}>
                Reconnect
              </Button>
              <Button variant="danger" onClick={disconnect} disabled={busy}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={connect} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Connect Google Drive'}
          </Button>
        )}
      </Card>
    </div>
  );
};

export default SettingsPage;
