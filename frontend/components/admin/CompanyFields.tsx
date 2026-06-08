import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { Field, TextInput } from './ui';

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
        <TextInput {...register(name('dot_number'))} placeholder="1234567" />
      </Field>
      <Field label="MC number" error={err('mc_number')}>
        <TextInput {...register(name('mc_number'))} placeholder="MC-987654" />
      </Field>

      <Field label="Street address" required error={err('address_street')} className="sm:col-span-2">
        <TextInput {...register(name('address_street'), { required: 'Required' })} placeholder="123 Main St" />
      </Field>

      <Field label="City" required error={err('address_city')}>
        <TextInput {...register(name('address_city'), { required: 'Required' })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="State" required error={err('address_state')}>
          <TextInput {...register(name('address_state'), { required: 'Required' })} placeholder="WA" />
        </Field>
        <Field label="ZIP" required error={err('address_zip')}>
          <TextInput {...register(name('address_zip'), { required: 'Required' })} placeholder="98101" />
        </Field>
      </div>

      <Field label="Phone" error={err('phone')}>
        <TextInput {...register(name('phone'))} placeholder="(555) 123-4567" />
      </Field>
      <Field label="Email" error={err('email')}>
        <TextInput type="email" {...register(name('email'))} placeholder="dispatch@acme.com" />
      </Field>
      <Field label="Fax" error={err('fax')}>
        <TextInput {...register(name('fax'))} />
      </Field>
    </div>
  );
};

export default CompanyFields;
