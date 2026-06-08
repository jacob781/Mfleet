import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { DriverFormValues } from '../../../lib/driverTypes';

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-3 py-1 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-mfleet-gray-dark text-right font-medium break-words">{value || '—'}</span>
  </div>
);

const Section: React.FC<{ title: string; step: number; goToStep: (s: number) => void; children: React.ReactNode }> = ({
  title, step, goToStep, children,
}) => (
  <div className="rounded-lg border border-gray-200 p-3 mb-3">
    <div className="flex justify-between items-center mb-1">
      <h3 className="text-base font-semibold text-mfleet-gray-dark">{title}</h3>
      <button type="button" onClick={() => goToStep(step)} className="text-sm text-mfleet-blue underline">Edit</button>
    </div>
    {children}
  </div>
);

const StepReview: React.FC<{ goToStep: (s: number) => void; isOwner: boolean }> = ({ goToStep, isOwner }) => {
  const { getValues } = useFormContext<DriverFormValues>();
  const v = getValues();

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Please review your information before signing. Tap <span className="text-mfleet-blue">Edit</span> to change a section.
      </p>

      <Section title="Personal" step={0} goToStep={goToStep}>
        <Row label="Name" value={[v.first_name, v.middle_name, v.last_name].filter(Boolean).join(' ')} />
        <Row label="SSN" value={v.ssn ? '•••-••-' + v.ssn.slice(-4) : ''} />
        <Row label="Date of birth" value={v.dob} />
        <Row label="Phone" value={v.phone} />
        <Row label="Email" value={v.email} />
        <Row label="Address" value={[v.address?.street, v.address?.city, v.address?.state, v.address?.zip].filter(Boolean).join(', ')} />
        <Row label="Emergency contact" value={v.emergency?.name ? `${v.emergency.name} (${v.emergency.relation})` : ''} />
      </Section>

      <Section title="License & Medical" step={1} goToStep={goToStep}>
        <Row label="CDL" value={v.cdl?.number ? `${v.cdl.type} · ${v.cdl.state} · exp ${v.cdl.expiration}` : ''} />
        <Row label="Medical exp." value={v.medical?.expiration_date} />
      </Section>

      <Section title="History" step={2} goToStep={goToStep}>
        <Row label="Accidents" value={`${v.accidents?.length || 0} listed`} />
        <Row label="Violations" value={`${v.violations?.length || 0} listed`} />
      </Section>

      <Section title="Work & Logs" step={3} goToStep={goToStep}>
        <Row label="Employers" value={`${v.employment_history?.length || 0} listed`} />
        <Row label="7-day log" value={`${(v.seven_day_log || []).filter((d) => d.date).length}/7 days`} />
      </Section>

      <Section title="Agreements & Finance" step={4} goToStep={goToStep}>
        {isOwner && <Row label="Equipment" value={`${v.equipment?.length || 0} listed`} />}
        {isOwner && <Row label="IFTA" value={v.ifta_choice || ''} />}
        <Row label="W-9 type" value={v.w9?.type} />
        <Row label="Bank" value={v.banking?.bank_name} />
        <Row label="Account" value={v.banking?.account_number ? '••••' + v.banking.account_number.slice(-4) : ''} />
      </Section>
    </div>
  );
};

export default StepReview;
