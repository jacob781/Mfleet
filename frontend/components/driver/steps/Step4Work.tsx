import React, { useEffect, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { CheckboxField, FieldGroup, TextField } from '../fields';
import { FormError, lookupEmployer } from '../../../lib/driverApi';
import { maskPhone, maskState, maskZip } from '../../../lib/masks';

// Per-employer UI state: 'lookup' shows only the USDOT field until the driver either
// finds the carrier (auto-fill) or chooses to fill everything in manually.
type EmployerUi = { mode: 'lookup' | 'details'; collapsed: boolean };

const newEmployer = () => ({
  employer_name: '', employer_address: '', employer_city: '', employer_state: '',
  employer_zip: '', employer_phone: '', employer_fax: '', usdot_number: '', no_usdot: false,
  employer_email: '',
  start_date: '', end_date: '',
  position: '', salary: '', reason_for_leaving: '', subject_to_fmcsr: false,
  safety_sensitive: false, was_driver_subject_to_testing: false,
});

// Verifying prior employment is the point of this step (49 CFR 391.23), and one
// entry is never enough to establish a record.
const MIN_EMPLOYERS = 2;

const Step4Work: React.FC<{ token: string }> = ({ token }) => {
  const { watch, getValues, setValue, control, formState: { errors } } = useFormContext();
  const log = watch('seven_day_log') || [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'employment_history',
    // Two employers minimum. The list is not built from FieldArrayList, so the rule
    // lives here and its message is rendered above the entries.
    rules: {
      validate: (v: any[]) =>
        (v?.length ?? 0) >= MIN_EMPLOYERS
        || `List at least ${MIN_EMPLOYERS} previous employers.`,
    },
  });
  const employersError = (errors as any)?.employment_history?.root?.message as string | undefined;

  const [employerUi, setEmployerUi] = useState<Record<string, EmployerUi>>({});
  const [lookingUp, setLookingUp] = useState<string | null>(null);   // field id
  const [lookupError, setLookupError] = useState<Record<string, string>>({});

  const setUi = (id: string, patch: Partial<EmployerUi>) =>
    setEmployerUi((m) => {
      const cur = m[id] ?? { mode: 'lookup', collapsed: false };
      return { ...m, [id]: { ...cur, ...patch } };
    });

  // Pre-fill the record-of-duty dates from the application date (day 1 = that date,
  // each row one day earlier) as MM/DD. Only fills blanks so manual edits stay.
  useEffect(() => {
    const appDate = getValues('application_date');
    const base = appDate ? new Date(`${String(appDate).slice(0, 10)}T00:00:00`) : new Date();
    (getValues('seven_day_log') || []).forEach((d: { date?: string }, i: number) => {
      if (!d?.date) {
        const dt = new Date(base);
        dt.setDate(base.getDate() - i);
        const mmdd = `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
        setValue(`seven_day_log.${i}.date`, mmdd);
      }
    });
  }, [getValues, setValue]);

  const doLookup = async (index: number, id: string) => {
    const usdot = String(getValues(`employment_history.${index}.usdot_number`) || '').trim();
    if (!usdot) {
      setLookupError((m) => ({ ...m, [id]: 'Enter a USDOT number first.' }));
      return;
    }
    setLookingUp(id);
    setLookupError((m) => ({ ...m, [id]: '' }));
    try {
      const r = await lookupEmployer(token, usdot);
      setValue(`employment_history.${index}.employer_name`, r.legal_name || '');
      setValue(`employment_history.${index}.usdot_number`, r.usdot_number || usdot);
      if (r.physical_address) {
        setValue(`employment_history.${index}.employer_address`, r.physical_address.street);
        setValue(`employment_history.${index}.employer_city`, r.physical_address.city);
        setValue(`employment_history.${index}.employer_state`, maskState(r.physical_address.state));
        setValue(`employment_history.${index}.employer_zip`, maskZip(r.physical_address.zip));
      }
      setValue(`employment_history.${index}.employer_phone`, r.phone ? maskPhone(r.phone) : '');
      setValue(`employment_history.${index}.employer_email`, r.email || '');
      setUi(id, { mode: 'details', collapsed: false });
    } catch (e) {
      setLookupError((m) => ({
        ...m,
        [id]: e instanceof FormError && typeof e.detail === 'string' ? e.detail : 'Lookup failed.',
      }));
    } finally {
      setLookingUp(null);
    }
  };

  return (
    <div>
      <FieldGroup title="Employment history (last 10 years)">
        {employersError && <p className="mb-3 text-sm text-red-600">{employersError}</p>}
        {fields.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">Add your previous employers (most recent first).</p>
        )}
        {fields.map((f, index) => {
          const ui = employerUi[f.id] ?? { mode: 'lookup', collapsed: false };
          const employerName = (watch(`employment_history.${index}.employer_name`) as string) || '';
          const noUsdot = !!watch(`employment_history.${index}.no_usdot`);
          return (
            <div key={f.id} className="rounded-lg border border-gray-200 p-3 mb-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setUi(f.id, { collapsed: !ui.collapsed })}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500"
                >
                  <span>{ui.collapsed ? '▸' : '▾'}</span>
                  <span>{employerName || `Employer #${index + 1}`}</span>
                </button>
                <button type="button" onClick={() => remove(index)} className="min-h-8 text-sm text-red-600 underline">
                  Remove
                </button>
              </div>

              {!ui.collapsed && (
                <>
                  {!noUsdot && (
                    <TextField
                      name={`employment_history.${index}.usdot_number`}
                      label="USDOT number"
                      required
                      inputMode="numeric"
                    />
                  )}
                  {/* Intrastate and regional carriers often have no DOT number, and a
                      previous job need not be trucking at all. Ticking this drops the
                      number and the lookup, and the details are filled in by hand. */}
                  <CheckboxField
                    name={`employment_history.${index}.no_usdot`}
                    label="This employer has no USDOT number"
                  />

                  {ui.mode === 'lookup' && !noUsdot && (
                    <>
                      <button
                        type="button"
                        onClick={() => doLookup(index, f.id)}
                        disabled={lookingUp === f.id}
                        className="mb-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 font-medium text-mfleet-blue disabled:opacity-60"
                      >
                        {lookingUp === f.id ? 'Looking up…' : 'Lookup by USDOT'}
                      </button>
                      {lookupError[f.id] && (
                        <p className="mb-2 text-sm text-red-600">{lookupError[f.id]}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => { setLookupError((m) => ({ ...m, [f.id]: '' })); setUi(f.id, { mode: 'details' }); }}
                        className="mb-4 text-sm font-medium text-mfleet-blue underline"
                      >
                        Fill in manually
                      </button>
                    </>
                  )}

                  {(ui.mode === 'details' || noUsdot) && (
                    <>
                      {!noUsdot && (
                        <button
                          type="button"
                          onClick={() => setUi(f.id, { mode: 'lookup' })}
                          className="mb-4 text-sm font-medium text-mfleet-blue underline"
                        >
                          Look up by USDOT
                        </button>
                      )}
                      <TextField name={`employment_history.${index}.employer_name`} label="Employer name" />
                      <TextField name={`employment_history.${index}.employer_address`} label="Address" />
                      <TextField name={`employment_history.${index}.employer_city`} label="City" />
                      <TextField name={`employment_history.${index}.employer_state`} label="State" format="state" />
                      <TextField name={`employment_history.${index}.employer_zip`} label="ZIP" format="zip" />
                      <TextField name={`employment_history.${index}.employer_phone`} label="Phone" format="phone" />
                      <TextField name={`employment_history.${index}.employer_fax`} label="Fax" />
                      <TextField name={`employment_history.${index}.employer_email`} label="Email" type="email" />
                      <TextField name={`employment_history.${index}.start_date`} label="Start date" type="date" />
                      <TextField name={`employment_history.${index}.end_date`} label="End date" type="date" />
                      <TextField name={`employment_history.${index}.position`} label="Position" />
                      <TextField name={`employment_history.${index}.salary`} label="Salary" />
                      <TextField name={`employment_history.${index}.reason_for_leaving`} label="Reason for leaving" />
                      <CheckboxField name={`employment_history.${index}.subject_to_fmcsr`} label="Was this job subject to FMCSRs?" />
                      <CheckboxField name={`employment_history.${index}.safety_sensitive`} label="Was this a safety-sensitive function (DOT)?" />
                      <CheckboxField name={`employment_history.${index}.was_driver_subject_to_testing`} label="Were you subject to drug/alcohol testing?" />
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => append(newEmployer())}
          className="w-full min-h-12 rounded-lg border-2 border-dashed border-mfleet-blue text-mfleet-blue font-medium"
        >
          + Add employer
        </button>
      </FieldGroup>

      <FieldGroup title="Record of duty — last 7 days">
        {log.map((_: unknown, i: number) => (
          <div key={i} className="rounded-lg border border-gray-200 p-3 mb-3">
            <span className="text-sm font-medium text-gray-500">Day {i + 1}</span>
            <TextField name={`seven_day_log.${i}.date`} label="Date" format="mmdd" />
            <TextField name={`seven_day_log.${i}.hours`} label="Total hours on duty" inputMode="numeric" />
            <TextField name={`seven_day_log.${i}.relieved_time`} label="Time relieved" placeholder="e.g. 6:00 PM" />
          </div>
        ))}
      </FieldGroup>

      <FieldGroup title="Last relieved from duty">
        <TextField name="last_relieved_date" label="Date" type="date" />
        <TextField name="last_relieved_time" label="Time" placeholder="e.g. 6:00 PM" />
        <TextField name="last_relieved_location" label="Location" />
      </FieldGroup>
    </div>
  );
};

export default Step4Work;
