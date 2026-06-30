import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  ApiError,
  createApplication,
  createCompany,
  listCompanies,
  listDrivers,
} from '../../lib/adminApi';
import {
  defaultSettings,
  emptyCompany,
  normalizeCompany,
  type ApplicationResponse,
  type ApplicationSettings,
  type CompanyResponse,
  type DriverSummary,
  type FineSchedule,
  type FeesSchedule,
} from '../../lib/adminTypes';
import CompanyFields from '../../components/admin/CompanyFields';
import FineScheduleEditor from '../../components/admin/FineScheduleEditor';
import FeesScheduleEditor from '../../components/admin/FeesScheduleEditor';
import { Button, Card, Field, SelectInput, Spinner, TextInput, Toggle } from '../../components/admin/ui';

interface CreateForm {
  company_mode: 'existing' | 'new';
  company_id: string;
  new_company: ReturnType<typeof emptyCompany>;
  driver_mode: 'existing' | 'new';
  driver_id: string;
  driver_is_owner: boolean;
  expires_at: string;
  settings: ApplicationSettings;
}

const COMPENSATION_OPTIONS = [
  { value: 'percentage', label: 'Percentage of gross' },
  { value: 'weekly_flat', label: 'Weekly flat' },
  { value: 'per_mile', label: 'Per mile' },
  { value: 'hourly', label: 'Hourly' },
] as const;

// Keys of ApplicationSettings that are numeric (coerced + mapped from 422).
const SETTINGS_KEYS = Object.keys(defaultSettings()) as Array<keyof ApplicationSettings>;

const ApplicationCreatePage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<ApplicationResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    defaultValues: {
      company_mode: 'existing',
      company_id: '',
      new_company: emptyCompany(),
      driver_mode: 'new',
      driver_id: '',
      driver_is_owner: true,
      expires_at: '',
      settings: defaultSettings(),
    },
  });

  const companyMode = watch('company_mode');
  const companyId = watch('company_id');

  // Per-application fine-schedule override (option 3). Off = inherit the company's table;
  // on = edit a copy just for this contract. Only for existing companies (a new one gets
  // the default and can be edited on its company page).
  const [customizeFines, setCustomizeFines] = useState(false);
  const fineOverride = useRef<FineSchedule | null>(null);
  const selectedCompany = companies.find((c) => c.id === Number(companyId));
  // Reset the override whenever the selected company changes.
  useEffect(() => {
    setCustomizeFines(false);
    fineOverride.current = null;
  }, [companyId, companyMode]);
  const toggleCustomizeFines = (on: boolean) => {
    fineOverride.current = on && selectedCompany?.fine_schedule
      ? JSON.parse(JSON.stringify(selectedCompany.fine_schedule))
      : null;
    setCustomizeFines(on);
  };

  // Same pattern for the compact fees schedule.
  const [customizeFees, setCustomizeFees] = useState(false);
  const feesOverride = useRef<FeesSchedule | null>(null);
  useEffect(() => {
    setCustomizeFees(false);
    feesOverride.current = null;
  }, [companyId, companyMode]);
  const toggleCustomizeFees = (on: boolean) => {
    feesOverride.current = on && selectedCompany?.fees_schedule
      ? JSON.parse(JSON.stringify(selectedCompany.fees_schedule))
      : null;
    setCustomizeFees(on);
  };
  const driverMode = watch('driver_mode');
  const compType = watch('settings.compensation_type');

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  // A brand-new company has no drivers yet → force "new driver".
  useEffect(() => {
    if (companyMode === 'new') {
      setValue('driver_mode', 'new');
      setDrivers([]);
    }
  }, [companyMode, setValue]);

  // Load drivers for the chosen existing company (for the existing-driver select).
  useEffect(() => {
    if (companyMode === 'existing' && companyId) {
      listDrivers(Number(companyId)).then(setDrivers).catch(() => setDrivers([]));
    } else {
      setDrivers([]);
    }
  }, [companyMode, companyId]);

  const onSubmit = async (data: CreateForm) => {
    setFormError(null);

    // Client-side: the active compensation rate must be set.
    const s = data.settings;
    const activeRate: Record<string, keyof ApplicationSettings> = {
      percentage: 'percentage_rate_non_amazon',
      weekly_flat: 'weekly_amount',
      per_mile: 'loaded_rate',
      hourly: 'hourly_rate',
    };
    const rateField = activeRate[s.compensation_type];
    if (rateField && Number(s[rateField]) <= 0) {
      setError(`settings.${rateField}` as any, { message: 'Required for this pay type' });
      return;
    }

    try {
      // 1. Resolve company_id (create the new company first if needed).
      let companyIdNum: number;
      if (data.company_mode === 'new') {
        const company = await createCompany(normalizeCompany(data.new_company));
        companyIdNum = company.id;
      } else {
        companyIdNum = Number(data.company_id);
      }

      // 2. Coerce numeric settings (number inputs can produce strings/NaN).
      const settings = { ...s };
      SETTINGS_KEYS.forEach((k) => {
        if (typeof settings[k] === 'number' || /^[\d.]+$/.test(String(settings[k]))) {
          const n = Number(settings[k]);
          if (Number.isFinite(n)) (settings as any)[k] = n;
        }
      });

      // Per-application override: a customized copy, or null to inherit the company table.
      (settings as any).fine_schedule = customizeFines ? fineOverride.current : null;
      (settings as any).fees_schedule = customizeFees ? feesOverride.current : null;

      // 3. Create the application.
      const app = await createApplication({
        company_id: companyIdNum,
        driver_id: data.driver_mode === 'existing' && data.driver_id ? Number(data.driver_id) : null,
        driver_is_owner: data.driver_is_owner,
        expires_at: data.expires_at ? `${data.expires_at}T00:00:00` : null,
        settings,
      });
      setCreated(app);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && Array.isArray(e.detail)) {
        let mappedAny = false;
        for (const item of e.detail) {
          const loc = Array.isArray(item.loc) ? item.loc : [];
          const field = String(loc[loc.length - 1]);
          if ((SETTINGS_KEYS as string[]).includes(field)) {
            setError(`settings.${field}` as any, { message: item.msg });
            mappedAny = true;
          }
        }
        setFormError(
          mappedAny
            ? 'Please fix the highlighted fields.'
            : 'Validation failed: ' + e.detail.map((d: any) => d.msg).join('; '),
        );
      } else if (e instanceof ApiError) {
        setFormError(typeof e.detail === 'string' ? e.detail : 'Could not create the application.');
      } else {
        setFormError('Could not create the application.');
      }
    }
  };

  const copyLink = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/apply/${created.access_token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  // --- Success screen -------------------------------------------------------
  if (created) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-mfleet-gray-dark">Application created</h1>
          <p className="mt-1 text-sm text-mfleet-gray">
            Send this link to the driver to fill out and sign their application.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <input
              readOnly
              value={`${window.location.origin}/apply/${created.access_token}`}
              className="flex-1 bg-transparent px-2 text-sm text-mfleet-gray-dark outline-none"
            />
            <Button onClick={copyLink}>{copied ? 'Copied!' : 'Copy link'}</Button>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link to={`/admin/applications/${created.id}`}>
              <Button variant="secondary">Open application</Button>
            </Link>
            <Button
              onClick={() => {
                reset();
                setCreated(null);
              }}
            >
              Create another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- Form -----------------------------------------------------------------
  const num = (name: keyof ApplicationSettings, label: string, step?: string) => (
    <Field label={label} error={(errors.settings as any)?.[name]?.message}>
      <TextInput
        type="number"
        step={step}
        {...register(`settings.${name}` as const, { valueAsNumber: true })}
      />
    </Field>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">New application</h1>
        <Link to="/admin/applications">
          <Button variant="ghost">Back to list</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Company ----------------------------------------------------------*/}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Carrier company</h2>
          <div className="mb-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="existing" {...register('company_mode')} /> Existing company
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="new" {...register('company_mode')} /> New company
            </label>
          </div>

          {companyMode === 'existing' ? (
            <Field label="Company" required error={errors.company_id?.message}>
              <SelectInput
                {...register('company_id', {
                  required: companyMode === 'existing' ? 'Select a company' : false,
                })}
              >
                <option value="">— Select —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
              {companies.length === 0 && (
                <span className="text-xs text-mfleet-gray">
                  No companies yet — switch to “New company” to add one inline.
                </span>
              )}
            </Field>
          ) : (
            <CompanyFields register={register} errors={errors.new_company} prefix="new_company" />
          )}
        </Card>

        {/* Driver -----------------------------------------------------------*/}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Driver</h2>
          <div className="mb-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                value="existing"
                disabled={companyMode === 'new'}
                {...register('driver_mode')}
              />{' '}
              Existing driver
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="new" {...register('driver_mode')} /> New driver
            </label>
          </div>

          {driverMode === 'existing' ? (
            <Field label="Driver" required error={errors.driver_id?.message}>
              <SelectInput
                {...register('driver_id', {
                  required: driverMode === 'existing' ? 'Select a driver' : false,
                })}
              >
                <option value="">— Select —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.last_name} ({d.email})
                  </option>
                ))}
              </SelectInput>
              {companyMode === 'existing' && companyId && drivers.length === 0 && (
                <span className="text-xs text-mfleet-gray">
                  This company has no drivers yet — use “New driver”.
                </span>
              )}
            </Field>
          ) : (
            <p className="text-sm text-mfleet-gray">
              The driver will fill in their own details through the application link.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <Toggle label="Owner-operator (driver owns the truck)" {...register('driver_is_owner')} />
            <Field label="Link expires (optional — defaults to +30 days)" error={errors.expires_at?.message}>
              <div className="w-56">
                <TextInput type="date" {...register('expires_at')} />
              </div>
            </Field>
          </div>
        </Card>

        {/* Settings ---------------------------------------------------------*/}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Contract settings</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {num('min_age', 'Minimum age')}
            {num('min_years_history', 'Min. years experience')}
            {num('deposit_amount', 'Deposit amount ($)')}
            {num('deposit_weeks', 'Deposit weeks')}
            {num('trailer_maintenance_monthly', 'Trailer maintenance / month ($)')}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Compensation
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pay type">
              <SelectInput {...register('settings.compensation_type')}>
                {COMPENSATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {compType === 'percentage' && (
              <>
                {num('percentage_rate_non_amazon', 'Non-Amazon loads (%)')}
                {num('percentage_rate_amazon', 'Amazon loads (%) — if different')}
              </>
            )}
            {compType === 'weekly_flat' && num('weekly_amount', 'Weekly amount ($)', '0.01')}
            {compType === 'per_mile' && (
              <>
                {num('loaded_rate', 'Loaded rate ($/mi)', '0.01')}
                {num('empty_rate', 'Empty rate ($/mi)', '0.01')}
              </>
            )}
            {compType === 'hourly' && num('hourly_rate', 'Hourly rate ($)', '0.01')}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Insurance
          </h3>
          <div className="flex flex-col gap-3">
            <Toggle label="Include Auto Liability" {...register('settings.include_auto_liability')} />
            <Toggle label="Include Cargo" {...register('settings.include_cargo')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {num('insurance_cargo_liability', 'Auto liability and cargo ($)')}
            </div>
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Weekly / monthly fees
          </h3>
          {/* Labels relabeled per company request; field keys unchanged
              (eld_device_weekly→Service, tablet_weekly→Tablet/month, prepass_monthly→IFTA). */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {num('eld_device_weekly', 'Service / week ($)')}
            {num('tablet_weekly', 'Tablet / month ($)')}
            {num('prepass_monthly', 'IFTA / week ($)')}
            {num('administration_fee_weekly', 'Administration fee / week ($)')}
          </div>
          <p className="mt-2 text-xs text-mfleet-gray">
            Prepass is billed monthly according to toll-road usage.
          </p>

          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
            Penalties
          </h3>
          <div className="flex flex-col gap-3">
            <Toggle
              label="Include Schedule A penalties page"
              {...register('settings.include_penalties')}
            />
            <p className="text-xs text-mfleet-gray">
              Uses this company&apos;s fine schedule. Edit the amounts on the company&apos;s page,
              or customize them just for this driver below.
            </p>
            {companyMode === 'existing' && selectedCompany?.fine_schedule && (
              <Toggle
                label="Customize fine schedule for this application"
                checked={customizeFines}
                onChange={(e) => toggleCustomizeFines(e.target.checked)}
              />
            )}
            {customizeFines && fineOverride.current && (
              <div className="mt-2 rounded-lg border border-gray-200 p-3">
                <FineScheduleEditor key={companyId} draft={fineOverride.current} />
              </div>
            )}

            <Toggle
              label="Include compact FINES & FEES schedule page"
              {...register('settings.include_fees')}
            />
            {companyMode === 'existing' && selectedCompany?.fees_schedule && (
              <Toggle
                label="Customize fines & fees for this application"
                checked={customizeFees}
                onChange={(e) => toggleCustomizeFees(e.target.checked)}
              />
            )}
            {customizeFees && feesOverride.current && (
              <div className="mt-2 rounded-lg border border-gray-200 p-3">
                <FeesScheduleEditor key={companyId} draft={feesOverride.current} />
              </div>
            )}
          </div>
        </Card>

        {formError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link to="/admin/applications">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Create application'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationCreatePage;
