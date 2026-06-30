import React from 'react';
import { CheckboxField, FieldGroup, TextField } from '../fields';
import DocumentUpload from '../DocumentUpload';
import type { FormMeta } from '../../../lib/driverTypes';

type Penalties = Pick<FormMeta, 'include_penalties' | 'include_fees' | 'fine_schedule' | 'fees_schedule'> | null;

/**
 * Pre-signing step: the driver reviews the manager-selected fine table(s), accepts them,
 * then uploads their required documents. Placed right before Signatures on purpose — so a
 * driver who declines at the end hasn't already handed their documents over.
 */
const StepDocuments: React.FC<{ isOwner: boolean; token: string; penalties: Penalties }> = ({
  isOwner,
  token,
  penalties,
}) => {
  const showFine = penalties?.include_penalties && penalties.fine_schedule;
  const showFees = penalties?.include_fees && penalties.fees_schedule;
  return (
  <div>
    <FieldGroup title="Fines & penalties">
      <p className="text-sm text-gray-500 mb-3">
        Review the fines &amp; penalties below (also part of the full agreement you'll sign
        next), then confirm you accept them.
      </p>

      {showFine && penalties!.fine_schedule && (
        <div className="mb-4 max-h-72 overflow-auto rounded-lg border border-gray-200 p-3">
          <p className="mb-2 text-sm font-semibold text-mfleet-gray-dark">
            {`Schedule A — Penalties ($${penalties!.fine_schedule.rate_per_point} per point)`}
          </p>
          {penalties!.fine_schedule.sections.map((sec, si) => (
            <div key={si} className="mb-2">
              <p className="text-xs font-semibold uppercase text-gray-500">{sec.title}</p>
              <ul className="text-xs text-gray-700">
                {sec.rows.map((r, ri) => (
                  <li key={ri} className="flex flex-col gap-0.5 border-b border-gray-100 py-1 sm:flex-row sm:justify-between sm:gap-2 sm:py-0.5">
                    <span>{r.violation}</span>
                    <span className="text-gray-500 sm:whitespace-nowrap sm:text-right sm:text-gray-700">{r.points && `${r.points} pts · `}{r.first}{r.second && ` / ${r.second}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showFees && penalties!.fees_schedule && (
        <div className="mb-4 max-h-72 overflow-auto rounded-lg border border-gray-200 p-3">
          <p className="mb-2 text-sm font-semibold text-mfleet-gray-dark">{penalties!.fees_schedule.title}</p>
          <ul className="text-xs text-gray-700">
            {penalties!.fees_schedule.rows.map((r, i) => (
              <li key={i} className="flex flex-col gap-0.5 border-b border-gray-100 py-1 sm:flex-row sm:justify-between sm:gap-2 sm:py-0.5">
                <span>{r.violation}</span>
                <span className="font-medium text-gray-600 sm:whitespace-nowrap sm:text-right sm:text-gray-700">{r.fee}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CheckboxField
        name="_fines_ack"
        requiredTrue="You must accept the fines & penalties schedule to continue"
        label="I have read and agree to the fines & penalties schedule."
      />
    </FieldGroup>

    <FieldGroup title="Required documents">
      <p className="text-sm text-gray-500 mb-3">
        Upload a clear photo or PDF of each document. They're attached to your application
        and included in your signed agreement.
      </p>
      <DocumentUpload token={token} docType="medical_cert" label="Medical examiner's certificate" required />
      <DocumentUpload token={token} docType="cdl" label="Driver license (CDL)" required />
    </FieldGroup>

    {isOwner && (
      <FieldGroup title="Owner-operator documents">
        <DocumentUpload token={token} docType="annual_inspection" label="DOT annual inspection report" required />
        <TextField name="document_expiries.annual_inspection" label="Annual inspection expiry date" type="date" />
        <DocumentUpload token={token} docType="registration" label="Registration (cab card)" required />
        <TextField name="document_expiries.registration" label="Registration expiry date" type="date" />
      </FieldGroup>
    )}
  </div>
  );
};

export default StepDocuments;
