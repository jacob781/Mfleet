import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createCompany,
  deleteCompany,
  downloadOwnerLicense,
  openOwnerLicenseInTab,
  listCompanies,
  listDrivers,
  listTrucks,
  updateCompany,
  uploadOwnerLicense,
} from '../../lib/adminApi';
import {
  emptyCompany,
  normalizeCompany,
  type CompanyCreate,
  type CompanyResponse,
  type FineSchedule,
  type FeesSchedule,
} from '../../lib/adminTypes';
import CompanyFields from '../../components/admin/CompanyFields';
import ManagerDocUpload from '../../components/admin/ManagerDocUpload';
import FineScheduleEditor from '../../components/admin/FineScheduleEditor';
import FeesScheduleEditor from '../../components/admin/FeesScheduleEditor';
import { Button, Card, CopyButton, Drawer, EditButton, ReadOnlyField, SelectInput, Spinner, TextInput } from '../../components/admin/ui';
import { ListCount, SortHeader, byText, useListView } from '../../components/admin/listView';

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CompanyResponse | null>(null);
  const [deleteMode, setDeleteMode] = useState<'cascade' | 'reassign'>('cascade');
  const [deleteTarget, setDeleteTarget] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  /** What a cascade delete would take with it — loaded when the dialog opens. */
  const [collateral, setCollateral] = useState<{ drivers: string[]; trucks: string[] } | null>(null);
  const [typedName, setTypedName] = useState('');
  const [editingFines, setEditingFines] = useState<CompanyResponse | null>(null);
  const [savingFines, setSavingFines] = useState(false);
  const fineDraft = useRef<FineSchedule | null>(null);

  const openFines = (c: CompanyResponse) => {
    fineDraft.current = c.fine_schedule ? JSON.parse(JSON.stringify(c.fine_schedule)) : null;
    setEditingFines(c);
  };

  const saveFines = async () => {
    if (!editingFines || !fineDraft.current) return;
    setSavingFines(true);
    try {
      await updateCompany(editingFines.id, { fine_schedule: fineDraft.current });
      setEditingFines(null);
      refresh();
    } finally {
      setSavingFines(false);
    }
  };

  const [editingFees, setEditingFees] = useState<CompanyResponse | null>(null);
  const [savingFees, setSavingFees] = useState(false);
  const feesDraft = useRef<FeesSchedule | null>(null);

  const openFees = (c: CompanyResponse) => {
    feesDraft.current = c.fees_schedule ? JSON.parse(JSON.stringify(c.fees_schedule)) : null;
    setEditingFees(c);
  };

  const saveFees = async () => {
    if (!editingFees || !feesDraft.current) return;
    setSavingFees(true);
    try {
      await updateCompany(editingFees.id, { fees_schedule: feesDraft.current });
      setEditingFees(null);
      refresh();
    } finally {
      setSavingFees(false);
    }
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyCreate>({ defaultValues: emptyCompany() });

  // Separate form instance for the edit drawer.
  const editForm = useForm<CompanyCreate>({ defaultValues: emptyCompany() });
  const [viewing, setViewing] = useState<CompanyResponse | null>(null);
  const [licenseFilter, setLicenseFilter] = useState(''); // '' | 'yes' | 'no'
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openViewCompany = (c: CompanyResponse) => {
    setViewing(c);
    setDrawerEditing(false);
    setEditError(null);
  };

  const closeDrawer = () => {
    setViewing(null);
    setDrawerEditing(false);
  };

  const toggleDrawerEdit = () => {
    if (!drawerEditing && viewing) {
      editForm.reset({ ...emptyCompany(), ...viewing });
      setEditError(null);
    }
    setDrawerEditing((v) => !v);
  };

  const onEditSubmit = editForm.handleSubmit(async (data) => {
    if (!viewing) return;
    setEditError(null);
    try {
      await updateCompany(viewing.id, normalizeCompany(data));
      closeDrawer();
      refresh();
    } catch {
      setEditError('Could not save the company. Check the fields and try again.');
    }
  });

  const refresh = () => {
    setLoading(true);
    listCompanies(licenseFilter === '' ? undefined : licenseFilter === 'yes')
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [licenseFilter]);

  const location = (c: CompanyResponse) => `${c.address_city}, ${c.address_state}`;

  const { query, setQuery, sort, toggleSort, visible, searchRef } = useListView(
    companies,
    (c) => [c.name, c.dot_number, c.mc_number, location(c), c.phone],
    {
      name: byText((c) => c.name),
      location: byText(location),
    },
  );

  // Open the delete dialog and load exactly who goes down with the company. The two
  // list endpoints already filter by company, so this needs no new API.
  const askDelete = (c: CompanyResponse) => {
    setPendingDelete(c);
    setDeleteMode('cascade');
    setDeleteTarget('');
    setTypedName('');
    setCollateral(null);
    Promise.all([listDrivers(c.id), listTrucks(c.id)])
      .then(([ds, ts]) => setCollateral({
        drivers: ds.map((d) => `${d.first_name} ${d.last_name}`.trim()),
        trucks: ts.map((t) => `${t.make} ${t.year}${t.unit_number ? ` · Unit ${t.unit_number}` : ''} (${t.plate_number})`),
      }))
      .catch(() => setCollateral({ drivers: [], trucks: [] }));
  };

  const onDeleteCompany = async () => {
    if (!pendingDelete) return;
    if (deleteMode === 'reassign' && !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCompany(pendingDelete.id, deleteMode, deleteMode === 'reassign' ? Number(deleteTarget) : undefined);
      if (viewing?.id === pendingDelete.id) closeDrawer();
      setPendingDelete(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (data: CompanyCreate) => {
    setFormError(null);
    try {
      // Reopen the new company's drawer so the manager can upload the owner's license.
      const created = await createCompany(normalizeCompany(data));
      reset(emptyCompany());
      setShowForm(false);
      openViewCompany(created);
      refresh();
    } catch {
      setFormError('Could not create company. Check the fields and try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">Companies</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add company'}
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="w-80">
          <TextInput
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, DOT, MC, city…"
          />
        </div>
        <ListCount visible={visible.length} total={companies.length} noun="companies" />
      </div>

      <div className="flex gap-3">
        <div className="w-72">
          <SelectInput value={licenseFilter} onChange={(e) => setLicenseFilter(e.target.value)}>
            <option value="">All companies</option>
            <option value="yes">Owner's license: on file</option>
            <option value="no">Owner's license: missing</option>
          </SelectInput>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">New company</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <CompanyFields register={register} control={control} errors={errors} />
            {formError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Create company'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {editingFines && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-mfleet-gray-dark">
              Fine schedule — {editingFines.name}
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditingFines(null)}>Cancel</Button>
              <Button onClick={saveFines} disabled={savingFines}>
                {savingFines ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
              </Button>
            </div>
          </div>
          {fineDraft.current ? (
            <FineScheduleEditor key={editingFines.id} draft={fineDraft.current} />
          ) : (
            <p className="text-sm text-mfleet-gray">This company has no fine schedule yet.</p>
          )}
        </Card>
      )}

      {editingFees && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-mfleet-gray-dark">
              Fines &amp; fees schedule — {editingFees.name}
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditingFees(null)}>Cancel</Button>
              <Button onClick={saveFees} disabled={savingFees}>
                {savingFees ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
              </Button>
            </div>
          </div>
          {feesDraft.current ? (
            <FeesScheduleEditor key={editingFees.id} draft={feesDraft.current} />
          ) : (
            <p className="text-sm text-mfleet-gray">This company has no fees schedule yet.</p>
          )}
        </Card>
      )}

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">
            {companies.length === 0
              ? 'No companies yet. Add one to start creating applications.'
              : `No companies match “${query}”.`}
          </div>
        ) : (
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="w-12 px-4 py-3">#</th>
                <SortHeader label="Name" col="name" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3">DOT</th>
                <th className="px-4 py-3">MC</th>
                <SortHeader label="Location" col="location" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Fines</th>
                <th className="px-4 py-3">Fees</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => openViewCompany(c)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  {/* Numbers the rows on screen, so they stay 1..N under any filter or sort. */}
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">
                    {c.name}
                    <CopyButton text={c.name} />
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {c.dot_number || '—'}
                    {c.dot_number && <CopyButton text={c.dot_number} />}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {c.mc_number || '—'}
                    {c.mc_number && <CopyButton text={c.mc_number} />}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {c.address_city}, {c.address_state}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {c.phone || '—'}
                    {c.phone && <CopyButton text={c.phone} />}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFines(c);
                      }}
                      className="text-sm font-medium text-mfleet-blue underline"
                    >
                      Edit fines
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFees(c);
                      }}
                      className="text-sm font-medium text-mfleet-blue underline"
                    >
                      Edit fees
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); askDelete(c); }}
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
        open={!!viewing}
        onClose={closeDrawer}
        title={viewing ? viewing.name : ''}
        headerRight={<EditButton editing={drawerEditing} onClick={toggleDrawerEdit} />}
      >
        {viewing && (
          drawerEditing ? (
            /* ── Edit mode ─────────────────────────────────────── */
            <form onSubmit={onEditSubmit} className="flex flex-col gap-4">
              <CompanyFields register={editForm.register} control={editForm.control} errors={editForm.formState.errors} />
              {editError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={toggleDrawerEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
                </Button>
              </div>
            </form>
          ) : (
            /* ── View mode ─────────────────────────────────────── */
            <div className="flex flex-col gap-3">
              <ReadOnlyField label="Company name" value={viewing.name} />
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="DOT number" value={viewing.dot_number} />
                <ReadOnlyField label="MC number" value={viewing.mc_number} />
              </div>
              <ReadOnlyField label="Street address" value={viewing.address_street} />
              <div className="grid grid-cols-3 gap-3">
                <ReadOnlyField label="City" value={viewing.address_city} />
                <ReadOnlyField label="State" value={viewing.address_state} />
                <ReadOnlyField label="ZIP" value={viewing.address_zip} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="Phone" value={viewing.phone} />
                <ReadOnlyField label="Email" value={viewing.email} />
              </div>
              <ReadOnlyField label="Fax" value={viewing.fax} />
            </div>
          )
        )}
        {viewing && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-mfleet-gray-dark">Owner's license</h3>
            <ManagerDocUpload
              label="Driver license"
              currentExpiry={viewing.owner_license_expiry}
              hasFile={!!viewing.owner_license_path}
              status={viewing.owner_license_status ?? undefined}
              requireExpiry
              onView={() => openOwnerLicenseInTab(viewing.id)}
              onDownload={() => downloadOwnerLicense(viewing.id, `${viewing.name}_owner_license`)}
              onSave={async (f, e) => {
                const updated = await uploadOwnerLicense(viewing.id, f, e);
                setViewing(updated);
                refresh();
              }}
            />
          </div>
        )}
      </Drawer>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setPendingDelete(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-mfleet-gray-dark">Delete {pendingDelete.name}?</h3>
            <p className="mt-2 text-sm text-mfleet-gray">
              This company has drivers, vehicles and applications. Choose what to do with them:
            </p>

            {/* Name what is at stake before the choice, not after it. */}
            {collateral === null ? (
              <p className="mt-3 text-xs text-mfleet-gray">Checking what belongs to this company…</p>
            ) : (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-800">
                <p className="font-semibold">
                  {collateral.drivers.length} driver{collateral.drivers.length === 1 ? '' : 's'} and{' '}
                  {collateral.trucks.length} vehicle{collateral.trucks.length === 1 ? '' : 's'} belong to it:
                </p>
                {collateral.drivers.length + collateral.trucks.length === 0 ? (
                  <p className="mt-1">Nothing else is attached — only the company record itself.</p>
                ) : (
                  <ul className="mt-1 list-disc pl-4">
                    {collateral.drivers.map((n) => <li key={`d-${n}`}>{n}</li>)}
                    {collateral.trucks.map((n) => <li key={`t-${n}`}>{n}</li>)}
                  </ul>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" className="mt-1" checked={deleteMode === 'cascade'} onChange={() => setDeleteMode('cascade')} />
                <span><span className="font-medium text-mfleet-gray-dark">Delete everything</span> — the company and all its drivers, vehicles, applications and documents.</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" className="mt-1" checked={deleteMode === 'reassign'} onChange={() => setDeleteMode('reassign')} />
                <span><span className="font-medium text-mfleet-gray-dark">Move to another company</span> — reassign its drivers, vehicles and applications, then delete this company.</span>
              </label>
              {deleteMode === 'reassign' && (
                <select
                  className="ml-6 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={deleteTarget}
                  onChange={(e) => setDeleteTarget(e.target.value)}
                >
                  <option value="">— select company —</option>
                  {companies.filter((c) => c.id !== pendingDelete.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            {/* Either way the company record itself is gone for good, so the name is
                typed in both modes. */}
            <label className="mt-4 block">
              <span className="text-xs text-mfleet-gray">
                Type <span className="font-semibold text-mfleet-gray-dark">{pendingDelete.name}</span> to confirm
              </span>
              <TextInput
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="mt-1"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>Cancel</Button>
              <Button
                variant="danger"
                onClick={onDeleteCompany}
                disabled={
                  deleting ||
                  (deleteMode === 'reassign' && !deleteTarget) ||
                  typedName.trim().toLowerCase() !== pendingDelete.name.trim().toLowerCase()
                }
              >
                {deleting ? <Spinner className="h-4 w-4 text-white" /> : deleteMode === 'reassign' ? 'Move & delete' : 'Delete all'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;

