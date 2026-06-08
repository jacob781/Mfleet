import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, downloadPdf, getApplication } from '../../lib/adminApi';
import type { ApplicationResponse } from '../../lib/adminTypes';
import { Button, Card, Spinner, StatusBadge } from '../../components/admin/ui';

function fmtDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function fmtConfigValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function labelize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-0">
    <span className="text-sm text-mfleet-gray">{label}</span>
    <span className="text-right text-sm font-medium text-mfleet-gray-dark">{children}</span>
  </div>
);

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApplication(Number(id))
      .then(setApp)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const copyLink = async () => {
    if (!app) return;
    try {
      await navigator.clipboard.writeText(app.apply_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = async () => {
    if (!app) return;
    setDownloadError(null);
    try {
      await downloadPdf(app.id);
    } catch (e) {
      setDownloadError(
        e instanceof ApiError && typeof e.detail === 'string'
          ? e.detail
          : 'PDF is not available yet.',
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-mfleet-gray">Application not found.</p>
        <Link to="/admin/applications" className="mt-4 inline-block">
          <Button variant="secondary">Back to list</Button>
        </Link>
      </Card>
    );
  }

  const cfg = app.manager_config || {};
  const companyName = (cfg.company_name as string) || `#${app.company_id}`;
  const pdfReady = app.pdf_status === 'ready';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-mfleet-gray-dark">Application #{app.id}</h1>
          <StatusBadge value={app.status} />
        </div>
        <Link to="/admin/applications">
          <Button variant="ghost">Back to list</Button>
        </Link>
      </div>

      {/* Apply link */}
      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
          Driver link
        </h2>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <input
            readOnly
            value={app.apply_url}
            className="flex-1 bg-transparent px-2 text-sm text-mfleet-gray-dark outline-none"
          />
          <Button onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</Button>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Overview
          </h2>
          <Row label="Company">{companyName}</Row>
          <Row label="Type">{app.driver_is_owner ? 'Owner-operator' : 'Company driver'}</Row>
          <Row label="Driver">
            {app.driver
              ? `${app.driver.first_name} ${app.driver.last_name}`
              : 'New (driver fills in)'}
          </Row>
          <Row label="Created">{fmtDateTime(app.created_at)}</Row>
          <Row label="Submitted">{fmtDateTime(app.submitted_at)}</Row>
          <Row label="Expires">{fmtDateTime(app.expires_at)}</Row>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Document
          </h2>
          <Row label="PDF status">
            <StatusBadge value={app.pdf_status} />
          </Row>
          {app.pdf_error && (
            <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {app.pdf_error}
            </div>
          )}
          <div className="mt-4">
            <Button onClick={handleDownload} disabled={!pdfReady} className="w-full">
              Download PDF
            </Button>
            {!pdfReady && (
              <p className="mt-2 text-xs text-mfleet-gray">
                Available once the driver submits and the document is generated.
              </p>
            )}
            {downloadError && (
              <p className="mt-2 text-xs text-red-600">{downloadError}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Contract config snapshot */}
      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
          Contract settings
        </h2>
        <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {Object.entries(cfg).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between gap-4 border-b border-gray-100 py-2"
            >
              <dt className="text-sm text-mfleet-gray">{labelize(key)}</dt>
              <dd className="text-right text-sm font-medium text-mfleet-gray-dark">
                {fmtConfigValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
};

export default ApplicationDetailPage;
