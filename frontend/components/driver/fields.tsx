import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';

function errorAt(errors: any, name: string): any {
  return name.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), errors);
}

const inputCls =
  'w-full min-h-12 rounded-lg border border-gray-300 px-3 text-base bg-white ' +
  'focus:border-mfleet-blue focus:ring-1 focus:ring-mfleet-blue outline-none';

interface BaseProps {
  name: string;
  label: string;
  required?: boolean;
}

export const FieldGroup: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="mb-6">
    {title && <legend className="text-base font-semibold text-mfleet-gray-dark mb-3">{title}</legend>}
    {children}
  </fieldset>
);

export const TextField: React.FC<
  BaseProps & {
    type?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    placeholder?: string;
    valueAsNumber?: boolean;
    autoComplete?: string;
  }
> = ({ name, label, required, type = 'text', inputMode, placeholder, valueAsNumber, autoComplete }) => {
  const { register, formState: { errors } } = useFormContext();
  const err = errorAt(errors, name);
  const rules: RegisterOptions = {
    required: required ? `${label} is required` : false,
    valueAsNumber: !!valueAsNumber,
  };
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-mfleet-gray-dark mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <input
        {...register(name, rules)}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputCls}
      />
      {err && <span className="block text-sm text-red-600 mt-1">{String(err.message || 'Invalid')}</span>}
    </label>
  );
};

export const TextAreaField: React.FC<BaseProps & { placeholder?: string; rows?: number }> = ({
  name, label, required, placeholder, rows = 3,
}) => {
  const { register, formState: { errors } } = useFormContext();
  const err = errorAt(errors, name);
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-mfleet-gray-dark mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <textarea
        {...register(name, { required: required ? `${label} is required` : false })}
        rows={rows}
        placeholder={placeholder}
        className={inputCls + ' py-2 resize-y'}
      />
      {err && <span className="block text-sm text-red-600 mt-1">{String(err.message || 'Invalid')}</span>}
    </label>
  );
};

export const SelectField: React.FC<BaseProps & { options: { value: string; label: string }[] }> = ({
  name, label, required, options,
}) => {
  const { register, formState: { errors } } = useFormContext();
  const err = errorAt(errors, name);
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-mfleet-gray-dark mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <select {...register(name, { required: required ? `${label} is required` : false })} className={inputCls}>
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {err && <span className="block text-sm text-red-600 mt-1">{String(err.message || 'Invalid')}</span>}
    </label>
  );
};

export const CheckboxField: React.FC<BaseProps & { requiredTrue?: string }> = ({ name, label, requiredTrue }) => {
  const { register, formState: { errors } } = useFormContext();
  const err = errorAt(errors, name);
  return (
    <div className="mb-4">
      <label className="flex items-center gap-3 min-h-12 cursor-pointer">
        <input
          type="checkbox"
          {...register(name, requiredTrue ? { validate: (v) => v === true || requiredTrue } : undefined)}
          className="h-6 w-6 rounded border-gray-300 text-mfleet-blue"
        />
        <span className="text-base text-mfleet-gray-dark">{label}</span>
      </label>
      {err && <span className="block text-sm text-red-600 mt-1">{String(err.message || 'Required')}</span>}
    </div>
  );
};
