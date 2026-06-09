import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import SignatureInput from '../SignatureInput';
import { CheckboxField } from '../fields';

// Single-signature step: the driver signs once and that signature, name and
// timestamp are applied to every agreement/authorization in the package
// (stored under signatures.applicant; the PDF template reuses it everywhere).
const Step6Signatures: React.FC<{ isOwner: boolean }> = () => {
  const { control, watch } = useFormContext();
  const firstName = (watch('first_name') as string) || '';

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Sign once below. Your signature, name and a timestamp will be applied to every
        agreement, authorization and acknowledgement in this application package.
      </p>

      <Controller
        control={control}
        name={'signatures.applicant' as never}
        rules={{ validate: (v: any) => (v && v.image_base64 ? true : 'Signature required') }}
        render={({ field, fieldState }) => (
          <div>
            <SignatureInput
              label="Your signature"
              signerFirstName={firstName}
              value={field.value}
              onChange={field.onChange}
            />
            {fieldState.error && (
              <span className="block text-sm text-red-600 -mt-4 mb-4">{fieldState.error.message}</span>
            )}
          </div>
        )}
      />

      <CheckboxField
        name="_signature_consent"
        requiredTrue="You must agree before submitting"
        label="I agree that this signature applies to all agreements, authorizations and acknowledgements in this application package and has the same legal effect as my handwritten signature."
      />
    </div>
  );
};

export default Step6Signatures;
