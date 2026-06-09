import React from 'react';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// --- Button ----------------------------------------------------------------

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-mfleet-blue/40';
  const variants: Record<string, string> = {
    primary: 'bg-mfleet-blue text-white hover:bg-mfleet-blue-dark',
    secondary:
      'bg-white text-mfleet-gray-dark border border-gray-300 hover:bg-gray-50',
    ghost: 'text-mfleet-blue hover:bg-mfleet-blue/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
};

// --- Card ------------------------------------------------------------------

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'rounded-xl border border-gray-200 bg-white shadow-sm',
      className,
    )}
    {...props}
  />
);

// --- Field wrapper ---------------------------------------------------------

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
}) => (
  <div className={cn('flex flex-col gap-1', className)}>
    {label && (
      <label htmlFor={htmlFor} className="text-sm font-medium text-mfleet-gray-dark">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
    )}
    {children}
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
);

// --- Inputs ----------------------------------------------------------------

const inputBase =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-mfleet-gray-dark placeholder-gray-400 focus:border-mfleet-blue focus:outline-none focus:ring-1 focus:ring-mfleet-blue';

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputBase, className)} {...props} />
));
TextInput.displayName = 'TextInput';

export const SelectInput = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(inputBase, 'pr-8', className)} {...props}>
    {children}
  </select>
));
SelectInput.displayName = 'SelectInput';

// --- Toggle (checkbox) -----------------------------------------------------

export const Toggle = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, className, ...props }, ref) => (
  <label className="flex items-center gap-2 text-sm text-mfleet-gray-dark cursor-pointer">
    <input
      ref={ref}
      type="checkbox"
      className={cn('h-4 w-4 rounded border-gray-300 text-mfleet-blue focus:ring-mfleet-blue', className)}
      {...props}
    />
    {label}
  </label>
));
Toggle.displayName = 'Toggle';

// --- Status badge ----------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  pending_driver: 'bg-amber-100 text-amber-800',
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  ready: 'bg-green-100 text-green-800',
  generating: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
};

export const StatusBadge: React.FC<{ value: string | null | undefined }> = ({ value }) => {
  if (!value) return <span className="text-gray-400">—</span>;
  const style = STATUS_STYLES[value] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style,
      )}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
};

// --- Misc ------------------------------------------------------------------

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin h-5 w-5 text-mfleet-blue', className)}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);
