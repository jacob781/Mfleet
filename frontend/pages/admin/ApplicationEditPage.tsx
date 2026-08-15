import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ApiError,
  getApplication,
  listDrivers,
  updateApplication,
} from '../../lib/adminApi';
import {
  defaultSettings,
  type ApplicationResponse,
  type ApplicationSettings,
  type ApplicationUpdate,
  type DriverSummary,
  type FeesSchedule,
  type FineSchedule,
} from '../../lib/adminTypes';
import ContractSettingsFields from '../../components/admin/ContractSettingsFields';
import { Button, Card, Field, SelectInput, Spinner, Toggle, inputBase } from '../../components/admin/ui';
import { DateField } from '../../components/DateInput';

interface EditForm {
  driver_mode: 'existing' | 'new';
  driver_id: string;
  driver_is_owner: boolean;
  expires_at: string;
  settings: ApplicationSettings;
}

// Keys of ApplicationSettings that are numeric (coerced + mapped from 422).
const SETTINGS_KEYS = Object.keys(defaultSettings()) as Array<keyof ApplicationSettings>;

// The manager_config snapshot is the full Typst contract (company fields + settings);
// pick out just the settings keys to seed the form.
function settingsFromConfig(cfg: Record<string, unknown>): ApplicationSettings {
  const base = defaultSettings();
  (Object.keys(base) as Array<keyof ApplicationSettings>).forEach((k) => {
    const v = cfg[k];
    if (v !== undefined && v !== null) (base as any)[k] = v;
  });
  return base;
}

const ApplicationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationResponse | null>(null);
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    defaultValues: {
      driver_mode: 'new',
      driver_id: '',
      driver_is_owner: true,
      expires_at: '',
      settings: defaultSettings(),
    },
  });

  const driverMode = watch('driver_mode');

  // Per-application fine/fees overrides, seeded from the application's snapshot.
  const [customizeFines, setCustomizeFines] = useState(false);
  const fineOverride = useRef<FineSchedule | null>(null);
  const [customizeFees, setCustomizeFees] = useState(false);
  const feesOverride = useRef<FeesSchedule | null>(null);

  const cfg = (app?.manager_config || {}) as Record<string, unknown>;
  const canCustomizeFines = !!cfg.fine_schedule;
  const canCustomizeFees = !!cfg.fees_schedule;

  const toggleCustomizeFines = (on: boolean) => {
    fineOverride.current = on && cfg.fine_schedule
      ? (JSON.parse(JSON.stringify(cfg.fine_schedule)) as FineSchedule)
      : null;
    setCustomizeFines(on);
  };
  const toggleCustomizeFees = (on: boolean) => {
    feesOverride.current = on && cfg.fees_schedule
      ? (JSON.parse(JSON.stringify(cfg.fees_schedule)) as FeesSchedule)
      : null;
    setCustomizeFees(on);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApplication(Number(id))
      .then((a) => {
        setApp(a);
        const snapshot = (a.manager_config || {}) as Record<string, unknown>;
        setValue('driver_is_owner', a.driver_is_owner);
        setValue('expires_at', a.expires_at ? a.expires_at.slice(0, 10) : '');
        setValue('settings', settingsFromConfig(snapshot));
        if (a.driver_id) {
          setValue('driver_mode', 'existing');
          setValue('driver_id', String(a.driver_id));
        } else {
          setValue('driver_mode', 'new');
        }
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, setValue]);

  // Drivers for the fixed company (for the existing-driver select).
  useEffect(() => {
    if (!app) return;
    listDrivers(app.company_id).then(setDrivers).catch(() => setDrivers([]));
  }, [app]);

  const onSubmit = async (data: EditForm) => {
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
      // Coerce numeric settings (number inputs can produce strings/NaN).
      const settings = { ...s };
      SETTINGS_KEYS.forEach((k) => {
        if (typeof settings[k] === 'number' || /^[\d.]+$/.test(String(settings[k]))) {
          const n = Number(settings[k]);
          if (Number.isFinite(n)) (settings as any)[k] = n;
        }
      });

      // Per-application override: a customized copy, or null to keep the current value.
      (settings as any).fine_schedule = customizeFines ? fineOverride.current : null;
      (settings as any).fees_schedule = customizeFees ? feesOverride.current : null;

      const body: ApplicationUpdate = {
        driver_id: data.driver_mode === 'existing' && data.driver_id ? Number(data.driver_id) : null,
        driver_is_owner: data.driver_is_owner,
        settings,
      };
      // Empty = keep the current expiry; only send a new date when one is chosen.
      if (data.expires_at) body.expires_at = `${data.expires_at}T00:00:00`;

      const updated = await updateApplication(Number(id), body);
      navigate(`/admin/applications/${updated.id}`);
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
        setFormError(typeof e.detail === 'string' ? e.detail : 'Could not save the application.');
      } else {
        setFormError('Could not save the application.');
      }
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

  const companyName = (cfg.company_name as string) || `#${app.company_id}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">Edit application #{app.id}</h1>
        <Link to={`/admin/applications/${app.id}`}>
          <Button variant="ghost">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Company (immutable) -------------------------------------------------*/}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Carrier company</h2>
          <Field label="Company">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-mfleet-gray-dark">
              {companyName}
            </div>
          </Field>
        </Card>

        {/* Driver -----------------------------------------------------------*/}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Driver</h2>
          <div className="mb-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="existing" {...register('driver_mode')} /> Existing driver
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
              {drivers.length === 0 && (
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
            <Field label="Link expires (leave empty to keep the current expiry)" error={errors.expires_at?.message}>
              <div className="w-56">
                <DateField name="expires_at" control={control} className={inputBase} />
              </div>
            </Field>
          </div>
        </Card>

        {/* Settings ---------------------------------------------------------*/}
        <ContractSettingsFields
          register={register}
          watch={watch}
          errors={errors}
          customizeFines={customizeFines}
          fineDraft={fineOverride.current}
          canCustomizeFines={canCustomizeFines}
          onCustomizeFinesChange={toggleCustomizeFines}
          fineEditorKey={app.id}
          customizeFees={customizeFees}
          feesDraft={feesOverride.current}
          canCustomizeFees={canCustomizeFees}
          onCustomizeFeesChange={toggleCustomizeFees}
          feesEditorKey={app.id}
        />

        {formError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link to={`/admin/applications/${app.id}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationEditPage;
