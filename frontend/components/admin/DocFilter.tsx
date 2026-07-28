import React from 'react';
import { SelectInput } from './ui';
import type { DocFilter } from '../../lib/adminApi';

/** Parse the select's value ("cdl:yes") into the API filter. '' = no filter. */
export function parseDocFilter(value: string): DocFilter | undefined {
  if (!value) return undefined;
  const [type, has] = value.split(':');
  return { type, has: has === 'yes' };
}

/**
 * "Has / hasn't this document" list filter — one dropdown covering every
 * document type of the page (annual inspection + cab card, CDL + medical cert).
 */
export const DocFilterSelect: React.FC<{
  docs: ReadonlyArray<{ key: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}> = ({ docs, value, onChange }) => (
  <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">All documents</option>
    {docs.map((d) => (
      <React.Fragment key={d.key}>
        <option value={`${d.key}:yes`}>{d.label}: on file</option>
        <option value={`${d.key}:no`}>{d.label}: missing</option>
      </React.Fragment>
    ))}
  </SelectInput>
);
