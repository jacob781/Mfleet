import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDriver, listCompanies, listDrivers, updateDriver } from '../../lib/adminApi';
import type { CompanyResponse, DriverDetail, DriverSummary } from '../../lib/adminTypes';
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
import DocumentList from '../../components/admin/DocumentList';

const DRIVER_STATUSES = ['Pending', 'Active', 'Terminated'];

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

  // Open the drawer with the list row, then load full detail (dob, applications).
  const openDriver = (d: DriverSummary) => {
    setSelected({ ...d });
    setDraft({ ...d });
    setEditing(false);
    setDetail(null);
    getDriver(d.id).then(setDetail).catch(() => setDetail(null));
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
              <>
                <div className="grid grid-cols-2 gap-3">
                  <ReadOnlyField label="First name" value={selected.first_name} />
                  <ReadOnlyField label="Last name" value={selected.last_name} />
                </div>
                {selected.middle_name && (
                  <ReadOnlyField label="Middle name" value={selected.middle_name} />
                )}
                <ReadOnlyField label="Email" value={selected.email} />
                <ReadOnlyField label="Phone" value={selected.phone} />
                <ReadOnlyField label="Status" value={selected.status} copyable={false} />
                {detail?.dob && (
                  <ReadOnlyField label="Date of birth" value={new Date(detail.dob).toLocaleDateString('en-US')} />
                )}
              </>
            )}

            <div>
              <h3 className="mb-2 mt-2 text-sm font-semibold text-mfleet-gray-dark">Documents</h3>
              <DocumentList driverId={selected.id} />
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
    </div>
  );
};

export default DriversPage;
