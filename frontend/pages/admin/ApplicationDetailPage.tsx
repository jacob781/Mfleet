import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ApiError,
  counterSign,
  deleteApplication,
  downloadApplicationDocument,
  downloadPdf,
  getApplication,
  getApplicationAnswers,
  openApplicationDocumentInTab,
  openEmployerPacketInTab,
  getPdfObjectUrl,
  openApplicationPdfInTab,
  listEmployers,
  markEmployerReceived,
  regeneratePdf,
  sendEmployerPacket,
  updateApplicationLinkExpiry,
  updateApplicationStatus,
  updateEmployerEmail,
} from '../../lib/adminApi';
import type {
  ApplicationResponse,
  ApplicationStatus,
  EmployerVerification,
} from '../../lib/adminTypes';
import type { SignatureData } from '../../lib/driverTypes';
import { useAuth } from '../../lib/auth';
import SignatureInput from '../../components/driver/SignatureInput';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  Button,
  Card,
  CopyButton,
  SelectInput,
  Spinner,
  StatusBadge,
  TextInput,
} from '../../components/admin/ui';

function fmtDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US');
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

// Recursively render the driver's submitted answers (already sanitized server-side).
const AnswersView: React.FC<{ data: unknown }> = ({ data }) => {
  if (data === null || data === undefined || data === '') return <span className="text-gray-400">—</span>;
  if (typeof data === 'boolean') return <span>{data ? 'Yes' : 'No'}</span>;
  if (typeof data === 'string' || typeof data === 'number') return <span>{String(data)}</span>;
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <div className="flex flex-col gap-2">
        {data.map((item, i) => (
          <div key={i} className="rounded border border-gray-100 p-2">
            <AnswersView data={item} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-gray-50 py-1 last:border-0">
          <span className="text-xs text-mfleet-gray">{labelize(k)}</span>
          <span className="max-w-[60%] text-right text-sm text-mfleet-gray-dark">
            <AnswersView data={v} />
          </span>
        </div>
      ))}
    </div>
  );
};

// Horizontal, scrollable row of record cards (any list-like section).
const RecordCarousel: React.FC<{ cards: Array<{ label: string; data: unknown }> }> = ({ cards }) => (
  <div className="flex gap-3 overflow-x-auto pb-2">
    {cards.map((c, i) => (
      <div key={i} className="min-w-[230px] max-w-[270px] shrink-0 rounded-lg border border-gray-200 p-3">
        <div className="mb-1 text-[11px] font-semibold text-mfleet-gray">{c.label}</div>
        <AnswersView data={c.data} />
      </div>
    ))}
  </div>
);

// 7-day record of duty: one compact tile per day, laid out in a single row.
const SevenDayTiles: React.FC<{ rows: Array<Record<string, unknown>> }> = ({ rows }) => (
  <div className="overflow-x-auto pb-1">
    <div className="grid min-w-[560px] grid-cols-7 gap-2">
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-mfleet-gray">Day {i + 1}</div>
          <div className="mt-0.5 text-sm font-medium text-mfleet-gray-dark">{(r?.date as string) || '—'}</div>
          <div className="mt-1.5 text-[10px] uppercase text-mfleet-gray">Hours</div>
          <div className="text-sm text-mfleet-gray-dark">{(r?.hours as string) ?? '—'}</div>
          <div className="mt-1.5 text-[10px] uppercase text-mfleet-gray">Relieved</div>
          <div className="text-sm text-mfleet-gray-dark">{(r?.relieved_time as string) || '—'}</div>
        </div>
      ))}
    </div>
  </div>
);

// Flat object rendered as a compact 2-column key/value grid.
const KeyValueGrid: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
    {Object.entries(data).map(([k, v]) => (
      <div key={k} className="flex justify-between gap-4 border-b border-gray-50 py-1 last:border-0">
        <span className="text-xs text-mfleet-gray">{labelize(k)}</span>
        <span className="max-w-[60%] text-right text-sm text-mfleet-gray-dark">
          <AnswersView data={v} />
        </span>
      </div>
    ))}
  </div>
);

const DOC_LABELS: Record<string, string> = {
  medical_cert: "Medical examiner's certificate",
  cdl: 'Driver license (CDL)',
  annual_inspection: 'DOT annual inspection report',
  registration: 'Registration (cab card)',
};

// Driver-uploaded documents: View opens the file in a new tab, Download saves it.
// The path stored in the answers is never shown — only the two actions.
const DocumentsSection: React.FC<{ appId: number; docs: Record<string, unknown> }> = ({ appId, docs }) => {
  const view = (docType: string) => openApplicationDocumentInTab(appId, docType);
  const keys = Object.keys(docs).filter((k) => docs[k]);
  if (keys.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-col gap-2">
      {keys.map((dt) => (
        <div key={dt} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
          <span className="text-sm text-mfleet-gray-dark">{DOC_LABELS[dt] ?? labelize(dt)}</span>
          <span className="flex gap-3">
            <button type="button" onClick={() => view(dt)} className="text-sm font-medium text-mfleet-blue underline">
              View
            </button>
            <button
              type="button"
              onClick={() => downloadApplicationDocument(appId, dt, dt)}
              className="text-sm font-medium text-mfleet-blue underline"
            >
              Download
            </button>
          </span>
        </div>
      ))}
    </div>
  );
};

// Renders one section's body: documents as buttons, tiles for the 7-day log, a
// carousel for any list (and the experience group), or a key/value grid otherwise.
const SectionBody: React.FC<{ name: string; value: unknown; appId: number }> = ({ name, value, appId }) => {
  if (name === 'documents' && value && typeof value === 'object' && !Array.isArray(value)) {
    return <DocumentsSection appId={appId} docs={value as Record<string, unknown>} />;
  }
  if (name === 'seven_day_log' && Array.isArray(value) && value.length > 0) {
    return <SevenDayTiles rows={value as Array<Record<string, unknown>>} />;
  }
  if (name === 'experience' && value && typeof value === 'object' && !Array.isArray(value)) {
    const cards = Object.entries(value as Record<string, unknown>).map(([sk, sv]) => ({ label: labelize(sk), data: sv }));
    return <RecordCarousel cards={cards} />;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">—</span>;
    if (value[0] !== null && typeof value[0] === 'object') {
      return <RecordCarousel cards={value.map((item, i) => ({ label: `#${i + 1}`, data: item }))} />;
    }
    return <AnswersView data={value} />;
  }
  return <KeyValueGrid data={value as Record<string, unknown>} />;
};

// Prior-employer verification packets: edit the employer's email, preview the
// packet, and email it. Seeded server-side from the driver's employment history.
const EmployerVerifications: React.FC<{ appId: number }> = ({ appId }) => {
  const [rows, setRows] = useState<EmployerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEmployers(appId)
      .then((r) => {
        setRows(r);
        setEmails(Object.fromEntries(r.map((e) => [e.id, e.email ?? ''])));
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [appId]);

  const patch = (row: EmployerVerification) => {
    const email = emails[row.id]?.trim() || null;
    if (email === (row.email ?? null)) return;
    updateEmployerEmail(appId, row.id, email)
      .then((updated) => setRows((rs) => rs.map((r) => (r.id === row.id ? updated : r))))
      .catch(() => { });
  };

  const view = (row: EmployerVerification) => openEmployerPacketInTab(appId, row.id);

  const run = async (row: EmployerVerification, fn: () => Promise<EmployerVerification>, fail: string) => {
    setError(null);
    setBusy(row.id);
    try {
      const updated = await fn();
      setRows((rs) => rs.map((r) => (r.id === row.id ? updated : r)));
    } catch (e) {
      setError(e instanceof ApiError && typeof e.detail === 'string' ? e.detail : fail);
    } finally {
      setBusy(null);
    }
  };

  const send = (row: EmployerVerification) =>
    run(row, () => sendEmployerPacket(appId, row.id), 'Could not send the packet.');
  const markReceived = (row: EmployerVerification) =>
    run(row, () => markEmployerReceived(appId, row.id), 'Could not mark received.');

  if (loading) return <Spinner className="h-5 w-5" />;
  if (rows.length === 0)
    return <p className="text-sm text-mfleet-gray">No prior employers listed by the driver.</p>;

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {rows.map((row) => (
        <div key={row.id} className="rounded-lg border border-gray-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-mfleet-gray-dark">
              {row.employer_name || `Employer #${row.employer_index + 1}`}
              {row.phone && <span className="ml-2 text-xs text-mfleet-gray">{row.phone}</span>}
            </div>
            <StatusBadge value={row.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              type="email"
              placeholder="employer@example.com"
              value={emails[row.id] ?? ''}
              onChange={(e) => setEmails((m) => ({ ...m, [row.id]: e.target.value }))}
              onBlur={() => patch(row)}
              className="max-w-xs"
            />
            <Button variant="secondary" onClick={() => view(row)}>
              View packet
            </Button>
            {row.status !== 'received' && (
              <Button
                onClick={() => send(row)}
                disabled={busy === row.id || !emails[row.id]?.trim() || row.attempts.length >= 3}
              >
                {busy === row.id ? <Spinner className="h-4 w-4 text-white" /> : row.attempts.length ? 'Resend' : 'Send'}
              </Button>
            )}
            {row.status === 'sent' && (
              <Button variant="secondary" onClick={() => markReceived(row)} disabled={busy === row.id}>
                Mark received
              </Button>
            )}
          </div>
          {(row.attempts.length > 0 || row.received_at) && (
            <div className="mt-2 flex flex-col gap-0.5 text-xs text-mfleet-gray">
              {row.attempts.map((a, i) => (
                <div key={i}>
                  Sent #{i + 1} to <span className="text-mfleet-gray-dark">{a.destination}</span> on {a.date}
                  <span className="text-gray-400"> · by {a.by}</span>
                </div>
              ))}
              {row.attempts.length >= 3 && row.status !== 'received' && (
                <div className="text-amber-700">Max attempts (3) reached — no reply yet.</div>
              )}
              {row.received_at && (
                <div className="text-green-700">
                  Reply received{row.received_from ? ` from ${row.received_from}` : ''} on{' '}
                  {new Date(row.received_at).toLocaleString('en-US')}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [extendBusy, setExtendBusy] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const { user } = useAuth();
  const [mgrSig, setMgrSig] = useState<SignatureData | null>(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

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

  // While a (re)generation is in flight, poll until it resolves.
  useEffect(() => {
    if (!id || app?.pdf_status !== 'generating') return;
    const t = setTimeout(() => {
      getApplication(Number(id)).then(setApp).catch(() => { });
    }, 3000);
    return () => clearTimeout(t);
  }, [id, app?.pdf_status, app]);

  // Load the driver's submitted answers (empty object if not submitted yet).
  useEffect(() => {
    if (!id) return;
    getApplicationAnswers(Number(id))
      .then((a) => setAnswers(a && Object.keys(a).length ? a : null))
      .catch(() => setAnswers(null));
  }, [id]);

  // Revoke the preview object URL when it changes / on unmount.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const togglePreview = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    if (!app) return;
    setPreviewError(null);
    try {
      setPreviewUrl(await getPdfObjectUrl(app.id));
    } catch (e) {
      setPreviewError(
        e instanceof ApiError && typeof e.detail === 'string' ? e.detail : 'Cannot preview the PDF.',
      );
    }
  };

  const handleRegenerate = async () => {
    if (!app) return;
    setRegenError(null);
    try {
      const updated = await regeneratePdf(app.id);
      setApp(updated); // status becomes "generating" → polling effect takes over
    } catch (e) {
      setRegenError(
        e instanceof ApiError && typeof e.detail === 'string'
          ? e.detail
          : 'Could not start regeneration.',
      );
    }
  };

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!app || status === app.status) return;
    setStatusError(null);
    try {
      const updated = await updateApplicationStatus(app.id, status);
      setApp(updated);
    } catch (e) {
      setStatusError(
        e instanceof ApiError && typeof e.detail === 'string' ? e.detail : 'Could not update status.',
      );
    }
  };

  const handleExtendLink = async (days: number) => {
    if (!app) return;
    setExtendError(null);
    setExtendBusy(true);
    try {
      const when = new Date(Date.now() + days * 86400000).toISOString();
      setApp(await updateApplicationLinkExpiry(app.id, when));
    } catch (e) {
      setExtendError(
        e instanceof ApiError && typeof e.detail === 'string' ? e.detail : 'Could not extend the link.',
      );
    } finally {
      setExtendBusy(false);
    }
  };

  const copyLink = async () => {
    if (!app) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/apply/${app.access_token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleCounterSign = async () => {
    if (!app || !mgrSig?.image_base64) return;
    setSignError(null);
    setSigning(true);
    try {
      const updated = await counterSign(app.id, {
        image_base64: mgrSig.image_base64,
        signer_first_name: mgrSig.signer_first_name || user?.full_name || '',
        timestamp_et: mgrSig.timestamp_et || '',
        date: mgrSig.date || '',
      });
      setApp(updated);
      setMgrSig(null);
    } catch (e) {
      setSignError(
        e instanceof ApiError && typeof e.detail === 'string'
          ? e.detail
          : 'Could not counter-sign. Please try again.',
      );
    } finally {
      setSigning(false);
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

  const onDelete = async () => {
    if (!app) return;
    setDeleting(true);
    try {
      await deleteApplication(app.id);
      navigate('/admin/applications');
    } finally {
      setDeleting(false);
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

  // Link-expiry status, to warn + offer an extension (esp. after reopening to pending_driver).
  const expiryInfo = (() => {
    if (!app.expires_at) return null;
    const ms = new Date(app.expires_at).getTime() - Date.now();
    if (ms < 0) return { level: 'expired' as const, label: 'Expired' };
    const days = Math.ceil(ms / 86400000);
    if (days <= 7) return { level: 'soon' as const, label: `Expires in ${days}d` };
    return { level: 'ok' as const, label: null };
  })();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-mfleet-gray-dark">Application #{app.id}</h1>
          <StatusBadge value={app.status} />
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/applications/${app.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Link to="/admin/applications">
            <Button variant="ghost">Back to list</Button>
          </Link>
        </div>
      </div>

      {/* Notes/flags derived from the driver's answers — things the manager should act on. */}
      {(() => {
        const notes: string[] = [];
        if (answers?.ifta_choice === 'own') {
          notes.push('Driver chose to file their OWN quarterly fuel-tax (IFTA) returns.');
        }
        return notes.length ? (
          <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3">
            <p className="text-sm font-semibold text-orange-800">Notes</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-orange-800">
              {notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        ) : null;
      })()}

      {/* Apply link */}
      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
          Driver link
        </h2>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <input
            readOnly
            value={`${window.location.origin}/apply/${app.access_token}`}
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
          <Row label="Company">
            {companyName}
            <CopyButton text={companyName} />
          </Row>
          <Row label="Type">{app.driver_is_owner ? 'Owner-operator' : 'Company driver'}</Row>
          <Row label="Driver">
            {app.driver ? (
              <>
                {app.driver.first_name} {app.driver.last_name}
                <CopyButton text={`${app.driver.first_name} ${app.driver.last_name}`} />
              </>
            ) : (
              'New (driver fills in)'
            )}
          </Row>
          <Row label="Created">{fmtDateTime(app.created_at)}</Row>
          <Row label="Submitted">{fmtDateTime(app.submitted_at)}</Row>
          <Row label="Expires">
            {fmtDateTime(app.expires_at)}
            {expiryInfo?.label && (
              <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${expiryInfo.level === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {expiryInfo.label}
              </span>
            )}
          </Row>
          {(expiryInfo?.level === 'expired' || expiryInfo?.level === 'soon') && (
            <div className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              The driver link {expiryInfo.level === 'expired' ? 'has expired' : 'is expiring soon'} — extend it so the driver can open the form.
              <div className="mt-2 flex gap-2">
                <Button onClick={() => handleExtendLink(7)} disabled={extendBusy}>+7 days</Button>
                <Button onClick={() => handleExtendLink(30)} disabled={extendBusy}>+30 days</Button>
              </div>
              {extendError && <p className="mt-1 text-red-600">{extendError}</p>}
            </div>
          )}
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-mfleet-gray">
              Update status
            </label>
            <SelectInput
              value={app.status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            >
              <option value="pending_driver">Pending driver</option>
              <option value="pending_review">Pending review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </SelectInput>
            {statusError && <p className="mt-1 text-xs text-red-600">{statusError}</p>}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Document
          </h2>
          <Row label="PDF status">
            <StatusBadge value={app.pdf_status} />
          </Row>
          <Row label="PDF generated">{fmtDateTime(app.pdf_generated_at)}</Row>
          {app.pdf_error && (
            <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {app.pdf_error}
            </div>
          )}
          <div className="mt-4">
            <Button onClick={handleDownload} disabled={!pdfReady} className="w-full">
              Download PDF
            </Button>
            {pdfReady && (
              <Button variant="secondary" onClick={togglePreview} className="mt-2 w-full">
                {previewUrl ? 'Hide preview' : 'Preview PDF'}
              </Button>
            )}
            {previewError && <p className="mt-2 text-xs text-red-600">{previewError}</p>}
            {!app.submitted_at && (
              <p className="mt-2 text-xs text-mfleet-gray">
                Available once the driver submits and the document is generated.
              </p>
            )}
            {app.pdf_status === 'generating' && (
              <p className="mt-2 text-xs text-mfleet-gray">Generating the document…</p>
            )}
            {!!app.submitted_at && app.pdf_status !== 'generating' && (
              <div className="mt-2">
                <Button variant="secondary" onClick={handleRegenerate} className="w-full">
                  Regenerate PDF
                </Button>
                <p className="mt-1 text-xs text-mfleet-gray">
                  Re-runs generation from the driver’s saved answers — no driver action needed.
                </p>
              </div>
            )}
            {downloadError && <p className="mt-2 text-xs text-red-600">{downloadError}</p>}
            {regenError && <p className="mt-2 text-xs text-red-600">{regenError}</p>}
          </div>
        </Card>
      </div>

      {/* Inline PDF preview (no download) */}
      {previewUrl && (
        <Card className="overflow-hidden p-2">
          <div className="flex justify-end p-2">
            <Button variant="secondary" onClick={() => openApplicationPdfInTab(app.id)}>
              Open in new tab
            </Button>
          </div>
          <iframe title="PDF preview" src={previewUrl} className="h-[80vh] w-full rounded" />
        </Card>
      )}

      {/* Manager counter-signature — shown once the driver has submitted */}
      {app.status === 'pending_review' && (
        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Counter-sign &amp; approve
          </h2>
          <p className="mb-4 text-xs text-mfleet-gray">
            Sign as the company / carrier representative. This applies your signature to the carrier
            lines, regenerates the document with both signatures, and marks the application approved.
          </p>
          <SignatureInput
            label="Company representative signature"
            signerFirstName={user?.full_name || ''}
            value={mgrSig || undefined}
            onChange={(s) => setMgrSig(s)}
          />
          <Button onClick={handleCounterSign} disabled={!mgrSig?.image_base64 || signing}>
            {signing ? 'Signing…' : 'Counter-sign & approve'}
          </Button>
          {signError && <p className="mt-2 text-sm text-red-600">{signError}</p>}
        </Card>
      )}

      {/* Driver-submitted form data (collapsed by default — it's long) */}
      {answers && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
              Submitted by driver
            </h2>
            <Button variant="ghost" onClick={() => setShowAnswers((v) => !v)}>
              {showAnswers ? 'Hide' : 'Show'}
            </Button>
          </div>
          {showAnswers && (
            <div className="mt-3">
              <p className="mb-3 text-xs text-mfleet-gray">SSN and banking details are masked.</p>
              {(() => {
                const entries = Object.entries(answers);
                const isSection = (v: unknown) => v !== null && typeof v === 'object';
                const scalars = entries.filter(([, v]) => !isSection(v));
                const sections = entries.filter(([, v]) => isSection(v));
                return (
                  <>
                    {scalars.length > 0 && (
                      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                        {scalars.map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 border-b border-gray-100 py-1.5">
                            <span className="text-xs text-mfleet-gray">{labelize(k)}</span>
                            <span className="max-w-[65%] text-right text-sm text-mfleet-gray-dark">
                              <AnswersView data={v} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sections.map(([k, v]) => (
                      <section key={k} className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                        <h3 className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-mfleet-gray-dark">
                          {labelize(k)}
                        </h3>
                        <div className="p-3">
                          <SectionBody name={k} value={v} appId={app.id} />
                        </div>
                      </section>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </Card>
      )}

      {/* Prior-employer verification packets — available once the driver has signed */}
      {app.submitted_at && (
        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Employer verification
          </h2>
          <p className="mb-4 text-xs text-mfleet-gray">
            Add each previous employer's email, then send them the signed verification packet.
          </p>
          <EmployerVerifications appId={app.id} />
        </Card>
      )}

      {/* Contract config snapshot */}
      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
          Contract settings
        </h2>
        <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {/* Skip object snapshots (fine_schedule / fees_schedule) — they'd render as
              "[object Object]". Their include_* booleans already show whether they apply,
              and the tables are viewable/editable on the Companies page. */}
          {Object.entries(cfg)
            .filter(([, value]) => typeof value !== 'object' || value === null)
            .map(([key, value]) => (
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

      {/* Erasing an application is nothing like the actions above it, so it sits at
          the foot of the page rather than beside Edit in the header. */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-4">
        <p className="text-sm text-mfleet-gray">
          Deleting removes the driver's answers, employer verifications, the generated
          PDF and every uploaded document. To stop a driver filling it in, set the
          status back instead.
        </p>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete application
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete application?"
        message={`Application #${app.id} for ${companyName} will be erased for good, along with the driver's answers, employer verifications, generated PDF, and uploaded documents.`}
        // Typing the driver's surname is the same gate the driver record uses; without
        // a driver attached yet, the application number does the job.
        confirmPhrase={app.driver?.last_name || String(app.id)}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};

export default ApplicationDetailPage;
