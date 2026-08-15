import React, { useState } from 'react';
import type { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Button, Field, Spinner, TextInput, inputBase } from './ui';
import { DateField } from '../DateInput';
import { maskedRegister, maskPhone, maskState } from '../../lib/masks';
import { ApiError, lookupCarrier } from '../../lib/adminApi';
import type { MotusLookupResponse } from '../../lib/adminTypes';

interface CompanyFieldsProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  // Scoped RHF errors subtree; typed loosely since it's nested/standalone.
  errors?: any;
  /** Register-name prefix when nested in a larger form, e.g. "new_company". */
  prefix?: string;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  /** When true, show only the DOT field + lookup first; the rest appears after a
   *  successful lookup or "Fill in manually" (mirrors the driver employer form). */
  lookupFirst?: boolean;
}

/**
 * Reusable carrier-company field block. Used standalone on the Companies page
 * (prefix omitted) and nested inside the create-application form
 * (prefix="new_company"). Field names mirror CompanyCreate in schemas.py.
 */
const CompanyFields: React.FC<CompanyFieldsProps> = ({
  register, control, errors, prefix, setValue, watch, lookupFirst,
}) => {
  const name = (f: string) => (prefix ? `${prefix}.${f}` : f);
  const err = (f: string) => (errors as any)?.[f]?.message as string | undefined;

  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [mode, setMode] = useState<'lookup' | 'details'>(lookupFirst ? 'lookup' : 'details');

  const insStatus = watch(name('insurance_status'));
  const insPolicy = watch(name('insurance_policy_number'));
  const insEff = watch(name('insurance_effective_date'));
  const insCov = watch(name('insurance_max_coverage'));

  const applyLookup = (r: MotusLookupResponse) => {
    setValue(name('name'), r.legal_name || '');
    setValue(name('dot_number'), r.usdot_number || '');
    setValue(name('mc_number'), r.mc_number || '');
    setValue(name('phone'), r.phone ? maskPhone(r.phone) : '');
    setValue(name('email'), r.email || '');
    if (r.owner) {
      setValue(name('owner_name'), `${r.owner.first_name} ${r.owner.last_name}`.trim());
      setValue(name('owner_title'), r.owner.title || '');
      setValue(name('owner_phone'), r.owner.phone ? maskPhone(r.owner.phone) : '');
      setValue(name('owner_email'), r.owner.email || '');
    }
    if (r.physical_address) {
      setValue(name('address_street'), r.physical_address.street);
      setValue(name('address_city'), r.physical_address.city);
      setValue(name('address_state'), maskState(r.physical_address.state));
      setValue(name('address_zip'), r.physical_address.zip);
    }
    if (r.insurance) {
      setValue(name('insurance_status'), r.insurance.status);
      setValue(name('insurance_policy_number'), r.insurance.policy_number || '');
      setValue(name('insurance_effective_date'), r.insurance.effective_date || '');
      setValue(name('insurance_max_coverage'), r.insurance.max_coverage ?? null);
    } else {
      setValue(name('insurance_status'), null);
    }
  };

  const doLookup = async () => {
    const dot = String(watch(name('dot_number')) || '').trim();
    if (!dot) {
      setLookupError('Enter a USDOT number first.');
      return;
    }
    setLookingUp(true);
    setLookupError(null);
    try {
      const r = await lookupCarrier(dot);
      applyLookup(r);
      setMode('details');
    } catch (e) {
      setLookupError(
        e instanceof ApiError && typeof e.detail === 'string' ? e.detail : 'Lookup failed. Try again.',
      );
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* DOT + lookup — always visible; the rest stays hidden until resolved. */}
      <div className="sm:col-span-2">
        <Field label="DOT number" error={err('dot_number')}>
          <div className="flex flex-wrap items-center gap-2">
            <TextInput {...maskedRegister(register, name('dot_number'), 'dot')} className="max-w-[160px]" />
            <Button type="button" variant="secondary" onClick={doLookup} disabled={lookingUp}>
              {lookingUp ? <Spinner className="h-4 w-4" /> : 'Lookup by USDOT'}
            </Button>
            {mode === 'lookup' && (
              <button
                type="button"
                onClick={() => { setLookupError(null); setMode('details'); }}
                className="px-1 text-sm font-medium text-mfleet-blue underline"
              >
                Fill in manually
              </button>
            )}
          </div>
        </Field>
        {lookupError && <span className="block text-xs text-red-600">{lookupError}</span>}
        {insStatus === 'active' && (
          <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
            Insurance active: ${Number(insCov || 0).toLocaleString()} · effective {insEff || '—'} · policy{' '}
            {insPolicy || '—'}
          </div>
        )}
        {insStatus === 'none' && (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            No active insurance ≥ $300,000.
          </div>
        )}
      </div>

      {mode === 'details' && (
        <>
          <Field label="Company name" required error={err('name')} className="sm:col-span-2">
            <TextInput {...register(name('name'), { required: 'Required' })} placeholder="Acme Trucking LLC" />
          </Field>

          <Field label="MC number" error={err('mc_number')}>
            <TextInput {...maskedRegister(register, name('mc_number'), 'mc')} />
          </Field>
          <Field label="EIN" error={err('ein')}>
            <TextInput {...maskedRegister(register, name('ein'), 'ein')} />
          </Field>

          <Field label="Street address" required error={err('address_street')} className="sm:col-span-2">
            <TextInput {...register(name('address_street'), { required: 'Required' })} placeholder="123 Main St" />
          </Field>

          <Field label="City" required error={err('address_city')}>
            <TextInput {...register(name('address_city'), { required: 'Required' })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State" required error={err('address_state')}>
              <TextInput {...maskedRegister(register, name('address_state'), 'state', { required: 'Required' })} />
            </Field>
            <Field label="ZIP" required error={err('address_zip')}>
              <TextInput {...maskedRegister(register, name('address_zip'), 'zip', { required: 'Required' })} />
            </Field>
          </div>

          <Field label="Phone" error={err('phone')}>
            <TextInput {...maskedRegister(register, name('phone'), 'phone')} />
          </Field>
          <Field label="Email" error={err('email')}>
            <TextInput
              type="email"
              {...register(name('email'), {
                validate: (v: string) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || 'Enter a valid email',
              })}
              placeholder="dispatch@acme.com"
            />
          </Field>
          <Field label="Fax" error={err('fax')}>
            <TextInput {...maskedRegister(register, name('fax'), 'phone')} />
          </Field>

          <div className="mt-2 sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
            Owner / principal
          </div>

          <Field label="Owner name" error={err('owner_name')}>
            <TextInput {...register(name('owner_name'))} placeholder="John Doe" />
          </Field>
          <Field label="Owner title" error={err('owner_title')}>
            <TextInput {...register(name('owner_title'))} />
          </Field>
          <Field label="Owner phone" error={err('owner_phone')}>
            <TextInput {...maskedRegister(register, name('owner_phone'), 'phone')} />
          </Field>
          <Field label="Owner email" error={err('owner_email')}>
            <TextInput
              type="email"
              {...register(name('owner_email'), {
                validate: (v: string) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || 'Enter a valid email',
              })}
              placeholder="owner@acme.com"
            />
          </Field>
          <Field label="Owner date of birth" error={err('owner_dob')}>
            <DateField name={name('owner_dob')} control={control} className={inputBase} />
          </Field>

          <Field label="Owner SSN" error={err('owner_ssn')}>
            <TextInput {...maskedRegister(register, name('owner_ssn'), 'ssn')} />
          </Field>
          <Field label="Owner address" error={err('owner_address')}>
            <TextInput {...register(name('owner_address'))} placeholder="123 Main St, City, ST 00000" />
          </Field>

          <Field label="Owner license #" error={err('owner_license_no')}>
            <TextInput {...register(name('owner_license_no'))} />
          </Field>
          <Field label="License state" error={err('owner_license_state')}>
            <TextInput {...maskedRegister(register, name('owner_license_state'), 'state')} />
          </Field>
        </>
      )}

      {/* Insurance snapshot travels with the form (read-only UI above), so the
          create/update payload persists it server-side. */}
      <input type="hidden" {...register(name('insurance_status'))} />
      <input type="hidden" {...register(name('insurance_policy_number'))} />
      <input type="hidden" {...register(name('insurance_effective_date'))} />
      <input type="hidden" {...register(name('insurance_max_coverage'))} />
    </div>
  );
};

export default CompanyFields;
