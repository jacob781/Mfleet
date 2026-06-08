import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import SignatureInput from '../SignatureInput';
import { SIGNATURE_SECTIONS } from '../../../lib/driverTypes';

const Step6Signatures: React.FC<{ isOwner: boolean }> = ({ isOwner }) => {
  const { control, watch } = useFormContext();
  const firstName = (watch('first_name') as string) || '';
  const sections = SIGNATURE_SECTIONS.filter((s) => !('ownerOnly' in s && s.ownerOnly) || isOwner);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Please sign each section below. Your signature, name and a timestamp are recorded for each.
      </p>
      {sections.map((s) => (
        <Controller
          key={s.key}
          control={control}
          name={`signatures.${s.key}` as never}
          rules={{ validate: (v: any) => (v && v.image_base64 ? true : 'Signature required') }}
          render={({ field, fieldState }) => (
            <div>
              <SignatureInput
                label={s.label}
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
      ))}
    </div>
  );
};

export default Step6Signatures;
