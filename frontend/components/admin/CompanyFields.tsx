import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { Field, TextInput } from './ui';
import { maskedRegister } from '../../lib/masks';

interface CompanyFieldsProps {
  register: UseFormRegister<any>;
  // Scoped RHF errors subtree; typed loosely since it's nested/standalone.
  errors?: any;
  /** Register-name prefix when nested in a larger form, e.g. "new_company". */
  prefix?: string;
}

/**
 * Reusable carrier-company field block. Used both standalone on the Companies
 * page (prefix omitted) and nested inside the create-application form
 * (prefix="new_company"). Field names mirror CompanyCreate in schemas.py.
 */
const CompanyFields: React.FC<CompanyFieldsProps> = ({ register, errors, prefix }) => {
  const name = (f: string) => (prefix ? `${prefix}.${f}` : f);
  const err = (f: string) => (errors as any)?.[f]?.message as string | undefined;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Company name" required error={err('name')} className="sm:col-span-2">
        <TextInput {...register(name('name'), { required: 'Required' })} placeholder="Acme Trucking LLC" />
      </Field>

      <Field label="DOT number" error={err('dot_number')}>
        <TextInput {...maskedRegister(register, name('dot_number'), 'dot')} />
      </Field>
      <Field label="MC number" error={err('mc_number')}>
        <TextInput {...maskedRegister(register, name('mc_number'), 'mc')} />
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
        <TextInput type="email" {...register(name('email'))} placeholder="dispatch@acme.com" />
      </Field>
      <Field label="Fax" error={err('fax')}>
        <TextInput {...maskedRegister(register, name('fax'), 'phone')} />
      </Field>

      <Field label="EIN" error={err('ein')}>
        <TextInput {...maskedRegister(register, name('ein'), 'ein')} />
      </Field>

      <div className="mt-2 sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
        Owner / principal
      </div>

      <Field label="Owner name" error={err('owner_name')}>
        <TextInput {...register(name('owner_name'))} placeholder="John Doe" />
      </Field>
      <Field label="Owner date of birth" error={err('owner_dob')}>
        <TextInput type="date" {...register(name('owner_dob'))} />
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
    </div>
  );
};

export default CompanyFields;
