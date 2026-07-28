import type React from 'react';
import type { UseFormRegister, RegisterOptions } from 'react-hook-form';

// Shared input masks + validators, used by both the driver wizard
// (components/driver/fields.tsx) and the admin forms (components/admin/*).

type InputMode = React.HTMLAttributes<HTMLInputElement>['inputMode'];

export const digitsOnly = (v: unknown) => String(v ?? '').replace(/\D/g, '');
const lettersOnly = (v: unknown) => String(v ?? '').replace(/[^a-zA-Z]/g, '');

export function maskPhone(v: string): string {
  const d = digitsOnly(v).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function maskSsn(v: string): string {
  const d = digitsOnly(v).slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

export function maskEin(v: string): string {
  const d = digitsOnly(v).slice(0, 9);
  return d.length <= 2 ? d : `${d.slice(0, 2)}-${d.slice(2)}`;
}

export function maskZip(v: string): string {
  const d = digitsOnly(v).slice(0, 9);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskState(v: string): string {
  return lettersOnly(v).slice(0, 2).toUpperCase();
}

// US date entry: MM/DD/YYYY text <-> ISO yyyy-mm-dd. Native <input type="date">
// renders in the *browser's* locale (dd.mm.yyyy on a non-US Chrome) and there is
// no way to force US order, so dates are typed as masked text instead.
export function maskDate(v: string): string {
  const d = digitsOnly(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function isoToUs(iso?: string | null): string {
  const s = String(iso ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(5, 7)}/${s.slice(8, 10)}/${s.slice(0, 4)}` : '';
}

/** '' unless the text is a complete, real calendar date (rejects 02/31/2026). */
export function usToIso(us: string): string {
  const d = digitsOnly(us);
  if (d.length !== 8) return '';
  const [mm, dd, yyyy] = [+d.slice(0, 2), +d.slice(2, 4), +d.slice(4)];
  const t = new Date(Date.UTC(yyyy, mm - 1, dd)); // rolls over on impossible dates
  if (t.getUTCFullYear() !== yyyy || t.getUTCMonth() !== mm - 1 || t.getUTCDate() !== dd) return '';
  return `${d.slice(4)}-${d.slice(0, 2)}-${d.slice(2, 4)}`;
}

export function maskMmdd(v: string): string {
  const d = digitsOnly(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

// VIN: 17 chars, uppercase, letters+digits only. I/O/Q are not used in VINs.
export function maskVin(v: string): string {
  return String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
}
// Licence plate: uppercase alphanumerics, spaces and hyphens allowed.
export function maskPlate(v: string): string {
  return String(v ?? '').toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 10);
}

const maskDigitsMax = (n: number) => (v: string) => digitsOnly(v).slice(0, n);

export interface MaskSpec {
  mask: (v: string) => string;
  /** Returns true (valid) or an error message. Empty values pass — use the
   *  field's own `required` rule to enforce presence. */
  validate: (v: string) => true | string;
  placeholder: string;
  inputMode: InputMode;
}

const exactDigits = (n: number, msg: string) => (v: string) =>
  !v || digitsOnly(v).length === n || msg;
const rangeDigits = (min: number, max: number, msg: string) => (v: string) => {
  if (!v) return true;
  const len = digitsOnly(v).length;
  return (len >= min && len <= max) || msg;
};

export const MASKS = {
  phone: { mask: maskPhone, validate: exactDigits(10, 'Enter a 10-digit phone number'), placeholder: '(555) 123-4567', inputMode: 'tel' },
  ssn: { mask: maskSsn, validate: exactDigits(9, 'Enter a 9-digit SSN'), placeholder: 'XXX-XX-XXXX', inputMode: 'numeric' },
  ein: { mask: maskEin, validate: exactDigits(9, 'Enter a 9-digit EIN'), placeholder: 'XX-XXXXXXX', inputMode: 'numeric' },
  zip: {
    mask: maskZip,
    validate: (v: string) => { if (!v) return true; const l = digitsOnly(v).length; return l === 5 || l === 9 || 'Enter a 5-digit ZIP (or ZIP+4)'; },
    placeholder: '98101', inputMode: 'numeric',
  },
  state: { mask: maskState, validate: (v: string) => !v || /^[A-Za-z]{2}$/.test(v) || 'Use the 2-letter state code', placeholder: 'WA', inputMode: 'text' },
  vin: { mask: maskVin, validate: (v: string) => !v || /^[A-HJ-NPR-Z0-9]{17}$/.test(v) || 'VIN must be 17 characters (letters/digits, no I, O, Q)', placeholder: '1FUJGLDR3CSBM1234', inputMode: 'text' },
  plate: { mask: maskPlate, validate: (v: string) => !v || /^[A-Z0-9][A-Z0-9 -]{0,9}$/.test(v) || 'Letters, digits, spaces or hyphens only', placeholder: 'ABC1234', inputMode: 'text' },
  dot: { mask: maskDigitsMax(8), validate: rangeDigits(1, 8, 'DOT number is up to 8 digits'), placeholder: '1234567', inputMode: 'numeric' },
  mc: { mask: maskDigitsMax(8), validate: rangeDigits(1, 8, 'MC number is up to 8 digits'), placeholder: '987654', inputMode: 'numeric' },
  routing: { mask: maskDigitsMax(9), validate: exactDigits(9, 'Routing number is 9 digits'), placeholder: '123456789', inputMode: 'numeric' },
  account: { mask: maskDigitsMax(17), validate: rangeDigits(4, 17, 'Enter a 4–17 digit account number'), placeholder: '', inputMode: 'numeric' },
  mmdd: {
    mask: maskMmdd,
    validate: (v: string) => {
      if (!v) return true;
      const d = digitsOnly(v);
      if (d.length !== 4) return 'Enter date as MM/DD';
      const mm = +d.slice(0, 2), dd = +d.slice(2);
      return (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) || 'Invalid date';
    },
    placeholder: 'MM/DD', inputMode: 'numeric',
  },
} satisfies Record<string, MaskSpec>;

export type MaskKind = keyof typeof MASKS;

/**
 * Spread-able props for an uncontrolled RHF input that applies a live mask and
 * the mask's validator. Use in admin forms: `<TextInput {...maskedRegister(register, 'phone', 'phone')} />`.
 * Extra `rules` (e.g. `{ required: 'Required' }`) are merged; the mask owns `validate`.
 */
export function maskedRegister(
  register: UseFormRegister<any>,
  name: string,
  kind: MaskKind,
  rules: Omit<RegisterOptions, 'validate'> = {},
) {
  const spec = MASKS[kind];
  const reg = register(name, { ...rules, validate: spec.validate } as RegisterOptions);
  return {
    ...reg,
    inputMode: spec.inputMode,
    placeholder: spec.placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = spec.mask(e.target.value);
      return reg.onChange(e);
    },
  };
}
