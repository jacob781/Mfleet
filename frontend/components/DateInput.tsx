import React from 'react';
import { Controller, type Control, type RegisterOptions } from 'react-hook-form';
import { isoToUs, maskDate, usToIso } from '../lib/masks';

/**
 * MM/DD/YYYY text field that stores ISO yyyy-mm-dd — used everywhere instead of
 * <input type="date">, which renders in the browser's locale (dd.mm.yyyy on a
 * non-US Chrome) and can't be forced to US order.
 * ponytail: no calendar popup; add a picker only if managers ask for one.
 */
export const DateInput: React.FC<{
  value?: string | null;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  className?: string;
}> = ({ value, onChange, onBlur, className }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(() => isoToUs(value));

  // Re-sync when the caller swaps the record underneath (drawer switch, form
  // reset) — but never while the user is mid-edit in this very input.
  React.useEffect(() => {
    if (document.activeElement !== ref.current) setText(isoToUs(value));
  }, [value]);

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      placeholder="MM/DD/YYYY"
      maxLength={10}
      value={text}
      onChange={(e) => {
        const t = maskDate(e.target.value);
        setText(t);
        onChange(usToIso(t));
      }}
      // A half-typed date was never stored — clear it so that's visible.
      onBlur={() => {
        if (!usToIso(text)) setText('');
        onBlur?.();
      }}
      className={className}
    />
  );
};

/** react-hook-form binding for DateInput; the form value stays ISO. */
export const DateField: React.FC<{
  name: string;
  control: Control<any>;
  rules?: RegisterOptions;
  className?: string;
}> = ({ name, control, rules, className }) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    render={({ field }) => (
      <DateInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} className={className} />
    )}
  />
);
