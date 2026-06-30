import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  createTruck,
  deleteTruck,
  listCompanies,
  listTrucks,
  updateTruck,
} from '../../lib/adminApi';
import {
  emptyTruck,
  type CompanyResponse,
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
import DocumentList from '../../components/admin/DocumentList';
import { TRUCK_MAKES } from '../../lib/truckMakes';

const TrucksPage: React.FC = () => {
  const [trucks, setTrucks] = useState<TruckResponse[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  /** The truck whose detail drawer is open (view or edit). */
  const [viewing, setViewing] = useState<TruckResponse | null>(null);
  /** Whether the drawer is in edit mode. */
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
  }, []);

  const refresh = () => {
    setLoading(true);
    listTrucks(companyFilter ? Number(companyFilter) : undefined)
      .then(setTrucks)
      .catch(() => setTrucks([]))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [companyFilter]);

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
    const body = { ...data, company_id: Number(data.company_id), year: Number(data.year) };
    try {
      if (viewing && drawerEditing) {
        await updateTruck(viewing.id, body);
      } else {
        await createTruck(body);
      }
      closeDrawer();
      setShowForm(false);
      refresh();
    } catch {
      setFormError('Could not save the vehicle. Check the fields and try again.');
    }
  };

  const onDelete = async (t: TruckResponse) => {
    if (!window.confirm(`Delete ${t.make} ${t.year} (${t.plate_number})?`)) return;
    await deleteTruck(t.id);
    refresh();
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
            {...register('year', { required: 'Required', valueAsNumber: true })}
          />
        </Field>
        <Field label="VIN" required error={errors.vin?.message}>
          <TextInput {...register('vin', { required: 'Required' })} />
        </Field>
        <Field label="Plate number" required error={errors.plate_number?.message}>
          <TextInput {...register('plate_number', { required: 'Required' })} />
        </Field>
        <Field label="State registered" required error={errors.state_registered?.message}>
          <TextInput
            maxLength={2}
            {...register('state_registered', { required: 'Required' })}
            placeholder="TX"
          />
        </Field>
      </div>
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

      {showForm && !viewing && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">New vehicle</h2>
          {formEl}
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : trucks.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">
            No vehicles yet. Add one to start building the fleet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="px-4 py-3">Make</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">VIN</th>
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trucks.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => openView(t)}
                  className="cursor-pointer hover:bg-gray-50"
                >
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
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(t);
                      }}
                      className="text-sm font-medium text-red-600 underline"
                    >
                      Delete
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
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-mfleet-gray-dark">Documents</h3>
              <DocumentList truckId={viewing.id} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TrucksPage;

