import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  deleteDriver,
  downloadDocument,
  getDriver,
  listCompanies,
  listDriverDocuments,
  listDrivers,
  listTrucks,
  openDocumentInTab,
  updateDriver,
  uploadDriverDocument,
} from '../../lib/adminApi';
import type { ComplianceDocument, CompanyResponse, DriverDetail, DriverSummary, TruckResponse } from '../../lib/adminTypes';
import {
  Button,
  Card,
  CopyButton,
  Drawer,
  EditButton,
  Field,
  ReadOnlyField,
  SelectInput,
  Spinner,
  StatusBadge,
  TextInput,
} from '../../components/admin/ui';
import ManagerDocUpload from '../../components/admin/ManagerDocUpload';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const DRIVER_STATUSES = ['Pending', 'Active', 'Terminated'];

// Manager-uploadable driver documents. `typeLabel` matches ComplianceDocument.document_type.
const DRIVER_DOCS = [
  { key: 'cdl', label: 'Driver license (CDL)', typeLabel: 'CDL' },
  { key: 'medical_cert', label: "Medical examiner's certificate", typeLabel: 'Medical Cert' },
] as const;

const DriversPage: React.FC = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');
  const [selected, setSelected] = useState<DriverSummary | null>(null);
  const [detail, setDetail] = useState<DriverDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  /** Snapshot of the driver row used for editing; `selected` stays immutable in view mode. */
  const [draft, setDraft] = useState<DriverSummary | null>(null);
  const [driverDocs, setDriverDocs] = useState<ComplianceDocument[]>([]);
  const [driverTrucks, setDriverTrucks] = useState<TruckResponse[]>([]);
  const [docsReload, setDocsReload] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<DriverSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onDeleteDriver = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteDriver(pendingDelete.id);
      setPendingDelete(null);
      if (selected?.id === pendingDelete.id) closeDrawer();
      refresh();
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!selected) { setDriverDocs([]); return; }
    listDriverDocuments(selected.id).then(setDriverDocs).catch(() => setDriverDocs([]));
  }, [selected, docsReload]);

  // Open the drawer with the list row, then load full detail (dob, applications).
  const openDriver = (d: DriverSummary) => {
    setSelected({ ...d });
    setDraft({ ...d });
    setEditing(false);
    setDetail(null);
    getDriver(d.id).then(setDetail).catch(() => setDetail(null));
    setDriverTrucks([]);
    listTrucks(d.company_id)
      .then((ts) => setDriverTrucks(ts.filter((t) => t.owner_driver_id === d.id)))
      .catch(() => setDriverTrucks([]));
  };

  const closeDrawer = () => {
    setSelected(null);
    setEditing(false);
  };

  const toggleEdit = () => {
    if (editing) {
      // Cancel editing — restore draft from selected
      setDraft(selected ? { ...selected } : null);
    }
    setEditing((v) => !v);
  };

  const refresh = () => {
    setLoading(true);
    listDrivers(companyFilter ? Number(companyFilter) : undefined)
      .then(setDrivers)
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await updateDriver(draft.id, {
        first_name: draft.first_name,
        middle_name: draft.middle_name,
        last_name: draft.last_name,
        email: draft.email,
        phone: draft.phone,
        status: draft.status,
      });
      setSelected(null);
      setEditing(false);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  useEffect(refresh, [companyFilter]);

  // Deep-link from the alerts page: ?focus=<driverId> opens that driver's drawer once.
  const [searchParams] = useSearchParams();
  const focusedRef = React.useRef<string | null>(null);
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus || focusedRef.current === focus) return;
    const d = drivers.find((x) => x.id === Number(focus));
    if (d) {
      focusedRef.current = focus;
      openDriver(d);
    }
  }, [drivers, searchParams]);

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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => openDriver(d)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">
                    {d.first_name} {d.middle_name ? `${d.middle_name} ` : ''}
                    {d.last_name}
                    <CopyButton
                      text={`${d.first_name} ${d.middle_name ? `${d.middle_name} ` : ''}${d.last_name}`.replace(/\s+/g, ' ').trim()}
                    />
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{companyName(d.company_id)}</td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {d.email}
                    <CopyButton text={d.email} />
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {d.phone}
                    <CopyButton text={d.phone} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={d.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); setPendingDelete(d); }}
                      className="rounded-lg p-1.5 text-mfleet-gray transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Drawer
        open={!!selected}
        onClose={closeDrawer}
        title={selected ? `${selected.first_name} ${selected.last_name}` : ''}
        headerRight={<EditButton editing={editing} onClick={toggleEdit} />}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            {editing && draft ? (
              /* ── Edit mode ─────────────────────────────────────── */
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name">
                    <TextInput
                      value={draft.first_name}
                      onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
                    />
                  </Field>
                  <Field label="Last name">
                    <TextInput
                      value={draft.last_name}
                      onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Email">
                  <TextInput
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <TextInput
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </Field>
                <Field label="Status">
                  <SelectInput
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  >
                    {DRIVER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </SelectInput>
                </Field>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={toggleEdit}>Cancel</Button>
                  <Button onClick={save} disabled={saving}>
                    {saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
                  </Button>
                </div>
              </>
            ) : (
              /* ── View mode ─────────────────────────────────────── */
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <ReadOnlyField label="First name" value={selected.first_name} />
                <ReadOnlyField label="Last name" value={selected.last_name} />
                {selected.middle_name && (
                  <ReadOnlyField label="Middle name" value={selected.middle_name} />
                )}
                <ReadOnlyField label="Status" value={selected.status} copyable={false} />
                <ReadOnlyField label="Email" value={selected.email} className="col-span-2" />
                <ReadOnlyField label="Phone" value={selected.phone} />
                {detail?.dob && (
                  <ReadOnlyField label="Date of birth" value={new Date(detail.dob).toLocaleDateString('en-US')} />
                )}
              </div>
            )}

            <div>
              <h3 className="mb-2 mt-2 text-sm font-semibold text-mfleet-gray-dark">Documents</h3>
              <div className="flex flex-col gap-2">
                {DRIVER_DOCS.map(({ key, label, typeLabel }) => {
                  const doc = driverDocs.find((d) => d.document_type === typeLabel);
                  return (
                    <ManagerDocUpload
                      key={key}
                      label={label}
                      requireExpiry
                      currentExpiry={doc?.expiry_date}
                      hasFile={doc?.has_file}
                      status={doc?.status}
                      onView={doc?.has_file ? () => openDocumentInTab(doc.id) : undefined}
                      onDownload={doc?.has_file ? () => downloadDocument(doc.id, doc.document_type) : undefined}
                      onSave={async (f, e) => {
                        await uploadDriverDocument(selected.id, key, f, e);
                        setDocsReload((k) => k + 1);
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 mt-2 text-sm font-semibold text-mfleet-gray-dark">Trucks</h3>
              {driverTrucks.length === 0 ? (
                <p className="text-sm text-mfleet-gray">No trucks owned by this driver.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {driverTrucks.map((t) => (
                    <li
                      key={t.id}
                      onClick={() => navigate(`/admin/trucks?focus=${t.id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                    >
                      <span className="text-sm text-mfleet-gray-dark">
                        {t.make} {t.year}{t.unit_number ? ` · Unit ${t.unit_number}` : ''}
                      </span>
                      <span className="font-mono text-xs text-mfleet-gray">{t.plate_number}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 mt-2 text-sm font-semibold text-mfleet-gray-dark">Applications</h3>
              {!detail ? (
                <Spinner className="h-5 w-5" />
              ) : detail.applications.length === 0 ? (
                <p className="text-sm text-mfleet-gray">No applications for this driver.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {detail.applications.map((a) => (
                    <li
                      key={a.id}
                      onClick={() => navigate(`/admin/applications/${a.id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                    >
                      <span className="text-sm text-mfleet-gray-dark">
                        #{a.id} · {a.driver_is_owner ? 'Owner' : 'Company'}
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusBadge value={a.status} />
                        <StatusBadge value={a.pdf_status} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete driver?"
        message={pendingDelete
          ? `${pendingDelete.first_name} ${pendingDelete.last_name} will be permanently removed, along with their applications, documents, and any trucks they own.`
          : ''}
        busy={deleting}
        onConfirm={onDeleteDriver}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default DriversPage;
