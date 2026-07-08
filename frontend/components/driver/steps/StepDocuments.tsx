import React from 'react';
import { useWatch } from 'react-hook-form';
import { FieldGroup, TextField } from '../fields';
import DocumentUpload from '../DocumentUpload';

/**
 * Document upload step: required driver documents (medical, CDL) plus, for
 * owner-operators, per-truck documents. Fines acceptance is now its own prior step.
 */
const StepDocuments: React.FC<{ isOwner: boolean; token: string }> = ({ isOwner, token }) => {
  // Per-truck documents: one upload set per equipment entry the owner-operator listed.
  const equipment = (useWatch({ name: 'equipment' }) as
    Array<{ make?: string; year?: number | string; type?: string; vin?: string; plate?: string }>
    | undefined) || [];
  return (
  <div>
    <FieldGroup title="Required documents">
      <p className="text-sm text-gray-500 mb-3">
        Upload a clear photo or PDF of each document. They're attached to your application
        and included in your signed agreement.
      </p>
      <DocumentUpload token={token} docType="medical_cert" label="Medical examiner's certificate" required />
      <DocumentUpload token={token} docType="cdl" label="Driver license (CDL)" required />
    </FieldGroup>

    {isOwner && (
      <FieldGroup title="Truck documents">
        {equipment.length === 0 ? (
          <p className="text-sm text-gray-500">
            Add your truck(s) in the Equipment step first, then upload each truck's documents here.
          </p>
        ) : (
          equipment.map((eq, i) => {
            const desc = [eq?.year, eq?.make, eq?.type].filter(Boolean).join(' ');
            const idParts = [eq?.plate ? `Plate ${eq.plate}` : '', eq?.vin ? `VIN ${eq.vin}` : ''].filter(Boolean);
            return (
            <div key={i} className="mb-4 rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-semibold text-mfleet-gray-dark">
                Truck {i + 1}{desc ? ` — ${desc}` : ''}
              </p>
              {idParts.length > 0 && (
                <p className="mb-2 text-xs text-gray-500">{idParts.join(' · ')}</p>
              )}
              <DocumentUpload token={token} truckIndex={i} docType="annual_inspection" label="DOT annual inspection report" required />
              <TextField name={`truck_document_expiries.${i}.annual_inspection`} label="Annual inspection expiry date" type="date" required />
              <DocumentUpload token={token} truckIndex={i} docType="registration" label="Registration (cab card)" required />
              <TextField name={`truck_document_expiries.${i}.registration`} label="Registration expiry date" type="date" required />
            </div>
            );
          })
        )}
      </FieldGroup>
    )}
  </div>
  );
};

export default StepDocuments;
