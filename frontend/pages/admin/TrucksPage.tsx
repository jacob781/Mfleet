import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ApiError,
  createTruck,
  deleteTruck,
  downloadDocument,
  listCompanies,
  listDrivers,
  listTruckDocuments,
  listTrucks,
  openDocumentInTab,
  updateTruck,
  uploadTruckDocument,
} from '../../lib/adminApi';
import {
  emptyTruck,
  type CompanyResponse,
  type ComplianceDocument,
  type DriverSummary,
  type TruckCreate,
  type TruckResponse,
} from '../../lib/adminTypes';
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
  TextInput,
} from '../../components/admin/ui';
import ManagerDocUpload from '../../components/admin/ManagerDocUpload';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { ChecklistCell, ChecklistFields } from '../../components/admin/Checklist';
import { DocFilterSelect, parseDocFilter } from '../../components/admin/DocFilter';
import { DocIndicator } from '../../components/admin/DocIndicator';
import { ListCount, SortHeader, byNumber, byText, useListView } from '../../components/admin/listView';
import { TRUCK_MAKES } from '../../lib/truckMakes';
import { maskedRegister } from '../../lib/masks';

// Manager-uploadable truck documents. `typeLabel` matches ComplianceDocument.document_type.
const TRUCK_DOCS = [
  { key: 'annual_inspection', label: 'Annual inspection', typeLabel: 'Annual Inspection' },
  { key: 'registration', label: 'Registration (cab card)', typeLabel: 'Registration' },
] as const;


const TrucksPage: React.FC = () => {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<TruckResponse[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');
  const [checklistFilter, setChecklistFilter] = useState(''); // '' | 'yes' | 'no'
  const [docFilter, setDocFilter] = useState(''); // '' | '<doc_type>:yes|no'
  const [showForm, setShowForm] = useState(false);
  /** The truck whose detail drawer is open (view or edit). */
  const [viewing, setViewing] = useState<TruckResponse | null>(null);
  /** Whether the drawer is in edit mode. */
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [docsReload, setDocsReload] = useState(0);
  const [truckDocs, setTruckDocs] = useState<ComplianceDocument[]>([]);
  const [pendingDelete, setPendingDelete] = useState<TruckResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!viewing) { setTruckDocs([]); return; }
    listTruckDocuments(viewing.id).then(setTruckDocs).catch(() => setTruckDocs([]));
  }, [viewing, docsReload]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TruckCreate>({ defaultValues: emptyTruck(0) });

  // Make: dropdown of common makes + "Other" free-text, mirroring the driver form.
  const make = watch('make') ?? '';
  const preset = TRUCK_MAKES.find((m) => m.toLowerCase() === make.toLowerCase());
  const [makeOther, setMakeOther] = useState(false);
  const makeSelectVal = preset ?? (makeOther || make ? 'OTHER' : '');

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
    listDrivers().then(setDrivers).catch(() => setDrivers([]));
  }, []);

  const refresh = () => {
    setLoading(true);
    listTrucks(
      companyFilter ? Number(companyFilter) : undefined,
      checklistFilter === '' ? undefined : checklistFilter === 'yes',
      parseDocFilter(docFilter),
    )
      .then(setTrucks)
      .catch(() => setTrucks([]))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [companyFilter, checklistFilter, docFilter]);

  // Deep-link from the alerts page: ?focus=<truckId> opens that vehicle's drawer once.
  const [searchParams] = useSearchParams();
  const focusedRef = React.useRef<string | null>(null);
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (!focus || focusedRef.current === focus) return;
    const t = trucks.find((x) => x.id === Number(focus));
    if (t) {
      focusedRef.current = focus;
      openView(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trucks, searchParams]);

  const companyName = useMemo(() => {
    const map = new Map<number, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return (id: number) => map.get(id) ?? `#${id}`;
  }, [companies]);

  const { query, setQuery, sort, toggleSort, visible, searchRef } = useListView(
    trucks,
    (t) => [t.unit_number, t.make, t.year, t.vin, t.plate_number, t.state_registered,
            companyName(t.company_id)],
    {
      unit_number: byText((t) => t.unit_number),
      year: byNumber((t) => t.year),
      company: byText((t) => companyName(t.company_id)),
    },
  );

  const driverName = useMemo(() => {
    const map = new Map<number, string>();
    drivers.forEach((d) => map.set(d.id, `${d.first_name} ${d.last_name}`));
    return (id?: number | null) => (id != null ? map.get(id) ?? `#${id}` : '—');
  }, [drivers]);

  const closeDrawer = () => {
    setViewing(null);
    setDrawerEditing(false);
  };

  const openView = (t: TruckResponse) => {
    setShowForm(false);
    setViewing(t);
    setDrawerEditing(false);
  };

  const toggleDrawerEdit = () => {
    if (!drawerEditing && viewing) {
      // Entering edit mode — seed the form with current values
      reset(viewing);
      setFormError(null);
    }
    setDrawerEditing((v) => !v);
  };

  const openCreate = () => {
    setViewing(null);
    setDrawerEditing(false);
    reset(emptyTruck(companyFilter ? Number(companyFilter) : companies[0]?.id ?? 0));
    setFormError(null);
    setShowForm(true);
  };

  const onSubmit = async (data: TruckCreate) => {
    setFormError(null);
    const body = {
      ...data,
      company_id: Number(data.company_id),
      year: Number(data.year),
      unit_number: data.unit_number?.trim() || null,
      ownership: data.ownership || null,
      owner_driver_id: data.owner_driver_id ? Number(data.owner_driver_id) : null,
      checklist_checked: !!data.checklist_checked,
      checklist_date: data.checklist_date || null,
    };
    try {
      if (viewing && drawerEditing) {
        await updateTruck(viewing.id, body);
        closeDrawer();
      } else {
        // Reopen the new truck's drawer so the manager can upload its documents.
        const created = await createTruck(body);
        openView(created);
      }
      setShowForm(false);
      refresh();
    } catch (e) {
      const detail = e instanceof ApiError ? e.detail : null;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d: any) => d.msg || d.detail).join('; ')
        : 'Could not save the vehicle. Check the fields and try again.';
      setFormError(msg);
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTruck(pendingDelete.id);
      setPendingDelete(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  };

  const formEl = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company" required error={errors.company_id?.message}>
          <SelectInput {...register('company_id', { required: 'Required' })}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Make" required error={errors.make?.message}>
          <SelectInput
            value={makeSelectVal}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'OTHER') {
                setMakeOther(true);
                setValue('make', '', { shouldDirty: true });
              } else {
                setMakeOther(false);
                setValue('make', v, { shouldValidate: true, shouldDirty: true });
              }
            }}
          >
            <option value="">— select —</option>
            {TRUCK_MAKES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="OTHER">Other</option>
          </SelectInput>
          {makeSelectVal === 'OTHER' && (
            <TextInput
              className="mt-2"
              placeholder="Enter make"
              {...register('make', { required: 'Required' })}
            />
          )}
        </Field>
        <Field label="Year" required error={errors.year?.message}>
          <TextInput
            type="number"
            {...register('year', {
              required: 'Required',
              valueAsNumber: true,
              min: { value: 1900, message: 'Year looks too old' },
              max: { value: new Date().getFullYear() + 1, message: 'Year is in the future' },
            })}
          />
        </Field>
        <Field label="VIN" required error={errors.vin?.message}>
          <TextInput maxLength={17} {...maskedRegister(register, 'vin', 'vin', { required: 'Required' })} />
        </Field>
        <Field label="Plate number" required error={errors.plate_number?.message}>
          <TextInput maxLength={10} {...maskedRegister(register, 'plate_number', 'plate', { required: 'Required' })} />
        </Field>
        <Field label="State registered" required error={errors.state_registered?.message}>
          <TextInput maxLength={2} {...maskedRegister(register, 'state_registered', 'state', { required: 'Required' })} />
        </Field>
        <Field label="Unit No" error={errors.unit_number?.message}>
          <TextInput maxLength={32} placeholder="e.g. 101" {...register('unit_number')} />
        </Field>
        <Field label="Ownership" error={errors.ownership?.message}>
          <SelectInput {...register('ownership')}>
            <option value="">—</option>
            <option value="owned">Owned</option>
            <option value="leased">Leased</option>
          </SelectInput>
        </Field>
        <Field label="Owner" error={errors.owner_driver_id?.message}>
          <SelectInput {...register('owner_driver_id')}>
            <option value="">Company{watch('company_id') ? ` (${companyName(Number(watch('company_id')))})` : ''}</option>
            {drivers
              .filter((d) => d.company_id === Number(watch('company_id')))
              .map((d) => (
                <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
              ))}
          </SelectInput>
        </Field>
      </div>
      <ChecklistFields
        checked={watch('checklist_checked')}
        date={watch('checklist_date')}
        onChange={(checked, date) => {
          setValue('checklist_checked', checked, { shouldDirty: true });
          setValue('checklist_date', date, { shouldDirty: true });
        }}
      />
      {formError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => { drawerEditing ? toggleDrawerEdit() : setShowForm(false); }}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : (viewing && drawerEditing) ? 'Save' : 'Create vehicle'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">Vehicles</h1>
        <Button onClick={openCreate} disabled={companies.length === 0}>
          Add vehicle
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="w-80">
          <TextInput
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search unit, make, VIN, plate…"
          />
        </div>
        <ListCount visible={visible.length} total={trucks.length} noun="vehicles" />
      </div>

      <div className="flex gap-3">
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
        <div className="w-48">
          <SelectInput value={checklistFilter} onChange={(e) => setChecklistFilter(e.target.value)}>
            <option value="">All checklists</option>
            <option value="yes">Checklist done</option>
            <option value="no">Checklist pending</option>
          </SelectInput>
        </div>
        <div className="w-64">
          <DocFilterSelect docs={TRUCK_DOCS} value={docFilter} onChange={setDocFilter} />
        </div>
      </div>

      {showForm && !viewing && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">New vehicle</h2>
          {formEl}
        </Card>
      )}

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">
            {trucks.length === 0
              ? 'No vehicles yet. Add one to start building the fleet.'
              : `No vehicles match “${query}”.`}
          </div>
        ) : (
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="w-12 px-4 py-3">#</th>
                <SortHeader label="Unit No" col="unit_number" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3">Make</th>
                <SortHeader label="Year" col="year" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3">VIN</th>
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">State</th>
                <SortHeader label="Company" col="company" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Checklist</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((t, i) => (
                <tr
                  key={t.id}
                  onClick={() => openView(t)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  {/* Numbers the rows on screen, so they stay 1..N under any filter or sort. */}
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {t.unit_number || '—'}
                    {t.unit_number && <CopyButton text={t.unit_number} />}
                  </td>
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">{t.make}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{t.year}</td>
                  <td className="px-4 py-3 font-mono text-xs text-mfleet-gray">
                    {t.vin}
                    <CopyButton text={t.vin} />
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {t.plate_number}
                    <CopyButton text={t.plate_number} />
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{t.state_registered}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{companyName(t.company_id)}</td>
                  <td className="px-4 py-3">
                    <DocIndicator flags={t.doc_flags} />
                  </td>
                  <td className="px-4 py-3">
                    <ChecklistCell checked={t.checklist_checked} date={t.checklist_date} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(t);
                      }}
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
        title={viewing ? `${viewing.make} ${viewing.year}` : ''}
        headerRight={<EditButton editing={drawerEditing} onClick={toggleDrawerEdit} />}
      >
        {viewing && (
          <div className="flex flex-col gap-6">
            {drawerEditing ? (
              /* ── Edit mode ─────────────────────────────── */
              formEl
            ) : (
              /* ── View mode ─────────────────────────────── */
              <div className="flex flex-col gap-3">
                <ReadOnlyField label="Company" value={companyName(viewing.company_id)} />
                <div className="grid grid-cols-2 gap-3">
                  <ReadOnlyField label="Make" value={viewing.make} />
                  <ReadOnlyField label="Year" value={viewing.year} copyable={false} />
                </div>
                <ReadOnlyField label="VIN" value={viewing.vin} />
                <div className="grid grid-cols-2 gap-3">
                  <ReadOnlyField label="Plate number" value={viewing.plate_number} />
                  <ReadOnlyField label="State registered" value={viewing.state_registered} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ReadOnlyField label="Unit No" value={viewing.unit_number || '—'} />
                  <ReadOnlyField label="Ownership" value={viewing.ownership ? viewing.ownership[0].toUpperCase() + viewing.ownership.slice(1) : '—'} copyable={false} />
                </div>
                {viewing.owner_driver_id ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-mfleet-gray">Owner</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/drivers?focus=${viewing.owner_driver_id}`)}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-mfleet-gray-dark hover:bg-gray-50"
                    >
                      <span>{driverName(viewing.owner_driver_id)}</span>
                      <span className="text-mfleet-blue">→</span>
                    </button>
                  </div>
                ) : (
                  <ReadOnlyField label="Owner" value={`Company (${companyName(viewing.company_id)})`} copyable={false} />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-mfleet-gray">Checklist</span>
                  <div><ChecklistCell checked={viewing.checklist_checked} date={viewing.checklist_date} /></div>
                </div>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-mfleet-gray-dark">Documents</h3>
              <div className="flex flex-col gap-2">
                {TRUCK_DOCS.map(({ key, label, typeLabel }) => {
                  const doc = truckDocs.find((d) => d.document_type === typeLabel);
                  return (
                    <ManagerDocUpload
                      key={key}
                      label={label}
                      requireExpiry
                      currentExpiry={doc?.expiry_date}
                      hasFile={doc?.has_file}
                      status={doc?.status}
                      docId={doc?.id}
                      isImage={doc?.is_image}
                      onView={doc?.has_file ? () => openDocumentInTab(doc.id) : undefined}
                      onDownload={doc?.has_file ? () => downloadDocument(doc.id, doc.document_type) : undefined}
                      onSave={async (f, e) => {
                        await uploadTruckDocument(viewing.id, key, f, e);
                        setDocsReload((k) => k + 1);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete vehicle?"
        message={pendingDelete
          ? `${pendingDelete.make} ${pendingDelete.year} (${pendingDelete.plate_number}) will be permanently removed, along with its documents and their files.`
          : ''}
        // The VIN, not the plate: plates get reassigned, the VIN identifies this
        // exact vehicle — and it is long enough that nobody deletes one by reflex.
        confirmPhrase={pendingDelete?.vin}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default TrucksPage;

