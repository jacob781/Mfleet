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

export const inputBase =
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
  // Compliance document statuses.
  Valid: 'bg-green-100 text-green-800',
  'Expiring Soon': 'bg-amber-100 text-amber-800',
  Expired: 'bg-red-100 text-red-800',
  // Employer verification statuses.
  sent: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
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

// --- Drawer (right slide-over) ---------------------------------------------

// Right-anchored slide-over for quick view/edit/documents; close with the X, the
// backdrop, or Esc. ponytail: CSS transition, no animation lib.
export const Drawer: React.FC<{
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional element rendered to the right of the title (e.g. edit button). */
  headerRight?: React.ReactNode;
}> = ({ open, title, onClose, children, headerRight }) => {
  // Esc closes the drawer, like the backdrop and the X.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
  <div className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')}>
    <div
      onClick={onClose}
      className={cn(
        'absolute inset-0 bg-black/30 transition-opacity',
        open ? 'opacity-100' : 'opacity-0',
      )}
    />
    <div
      className={cn(
        'absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl transition-transform',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-mfleet-gray-dark">{title}</h2>
        <div className="flex items-center gap-2">
          {headerRight}
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-mfleet-gray transition-colors hover:bg-gray-100 hover:text-mfleet-gray-dark">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </div>
  </div>
  );
};

// --- ReadOnlyField ---------------------------------------------------------

// Displays a label + value pair in read-only mode, with an optional copy button.
export const ReadOnlyField: React.FC<{
  label: string;
  value?: string | number | null;
  /** Set to false to hide the copy button even when value is present. */
  copyable?: boolean;
  className?: string;
}> = ({ label, value, copyable = true, className }) => (
  <div className={cn('flex flex-col gap-0.5', className)}>
    <span className="text-xs font-medium uppercase tracking-wide text-mfleet-gray">{label}</span>
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-mfleet-gray-dark">
        {value != null && value !== '' ? value : '—'}
      </span>
      {copyable && value != null && value !== '' && <CopyButton text={String(value)} />}
    </div>
  </div>
);

// --- Edit toggle button (pencil) -------------------------------------------

export const EditButton: React.FC<{
  editing: boolean;
  onClick: () => void;
  className?: string;
}> = ({ editing, onClick, className }) => {
  if (editing) return null;
  return (
    <button
      type="button"
      title="Edit"
      onClick={onClick}
      className={cn(
        'rounded-lg p-1.5 text-mfleet-gray transition-colors hover:bg-gray-100 hover:text-mfleet-gray-dark',
        className,
      )}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
      </svg>
    </button>
  );
};

// --- Copy button -----------------------------------------------------------

// Click-to-copy icon. stopPropagation so it works inside clickable rows.
// ponytail: ephemeral "✓" feedback, no tooltip lib.
export const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const [copied, setCopied] = React.useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      title="Copy"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className={cn(
        'ml-1 align-middle text-mfleet-gray hover:text-mfleet-blue',
        copied && 'text-green-600',
        className,
      )}
    >
      {copied ? '✓' : '⧉'}
    </button>
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
