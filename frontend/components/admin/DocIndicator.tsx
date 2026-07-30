import React from 'react';
import type { DocFlag } from '../../lib/adminTypes';

// Short badge labels — the column is narrow, so "Registration (cab card)" and
// "Annual Inspection" are shown as the words managers actually say.
const SHORT: Record<string, string> = {
  registration: 'cabcard',
  annual_inspection: 'inspection',
  cdl: 'CDL',
  medical_cert: 'medical',
};

// Missing and expired are one and the same for the manager — the document is not
// usable today, so both are red. Amber is only the 30-day heads-up.
const STYLES: Record<string, string> = {
  missing: 'bg-red-100 text-red-700',
  expired: 'bg-red-100 text-red-700',
  expiring: 'bg-amber-100 text-amber-800',
};

const TIP: Record<string, string> = {
  missing: 'no file on record',
  expired: 'expired',
  expiring: 'expires within 30 days',
};

/** Per-document badges for the list tables; a green check when nothing is wrong. */
export const DocIndicator: React.FC<{ flags?: DocFlag[] }> = ({ flags }) => {
  if (!flags || flags.length === 0) {
    return <span title="All documents valid" className="text-base font-bold text-green-600">✓</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-1">
      {flags.map((f) => {
        const label = SHORT[f.doc] ?? f.doc;
        return (
          <span
            key={f.doc}
            title={`${label} — ${TIP[f.state] ?? f.state}`}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[f.state] ?? STYLES.missing}`}
          >
            {label}
          </span>
        );
      })}
    </span>
  );
};
