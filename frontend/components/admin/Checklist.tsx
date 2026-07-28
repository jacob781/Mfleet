import React from 'react';
import { Field } from './ui';
import { DateInput } from '../DateInput';

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-US') : null);

/** Read-only checklist badge for tables and drawer view mode. */
export const ChecklistCell: React.FC<{ checked?: boolean; date?: string | null }> = ({ checked, date }) => (
  checked ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      ✓ Done{fmt(date) ? ` · ${fmt(date)}` : ''}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-mfleet-gray">
      Pending
    </span>
  )
);

/** Checkbox + date inputs for edit mode. Ticking the box defaults the date to today. */
export const ChecklistFields: React.FC<{
  checked?: boolean;
  date?: string | null;
  onChange: (checked: boolean, date: string | null) => void;
}> = ({ checked, date, onChange }) => (
  <Field label="Onboarding checklist">
    <label className="flex items-center gap-2 text-sm text-mfleet-gray-dark">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked, e.target.checked ? (date || new Date().toISOString().slice(0, 10)) : null)}
      />
      Checked (docs & tools verified)
    </label>
    {checked && (
      <DateInput
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={date ? date.slice(0, 10) : ''}
        onChange={(iso) => onChange(true, iso || null)}
      />
    )}
  </Field>
);
