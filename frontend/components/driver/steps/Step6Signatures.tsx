import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import SignatureInput from '../SignatureInput';
import { CheckboxField } from '../fields';
import { FormError, getPreviewObjectUrl } from '../../../lib/driverApi';

// Single-signature step: the driver first reviews the full assembled contract
// (preview), then signs once — that signature, name and timestamp are applied
// to every agreement in the package (stored under signatures.applicant).
const Step6Signatures: React.FC<{ isOwner: boolean; token: string }> = ({ token }) => {
  const { control, watch } = useFormContext();
  const firstName = (watch('first_name') as string) || '';

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Release the blob URL when it changes / on unmount.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const loadPreview = async () => {
    setPreviewError(null);
    setLoadingPreview(true);
    try {
      setPreviewUrl(await getPreviewObjectUrl(token));
    } catch (e) {
      setPreviewError(
        e instanceof FormError && e.status === 422
          ? 'Please complete all previous steps before previewing your document.'
          : 'Could not load the document. Please try again.',
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div>
      {/* Full assembled contract — see exactly what you're signing, before signing */}
      <div className="mb-5 rounded-lg border border-gray-200 bg-mfleet-gray-light p-4">
        <p className="text-sm font-semibold text-mfleet-gray-dark">Review your full document</p>
        <p className="mb-3 mt-1 text-xs text-mfleet-gray">
          This is the complete agreement you are about to sign. Signature lines stay blank until you sign below.
        </p>
        {!previewUrl ? (
          <button
            type="button"
            onClick={loadPreview}
            disabled={loadingPreview}
            className="min-h-11 w-full rounded-lg border border-mfleet-blue px-4 font-semibold text-mfleet-blue disabled:opacity-60"
          >
            {loadingPreview ? 'Preparing document…' : 'Show my full document'}
          </button>
        ) : (
          <div>
            <iframe
              title="Full document preview"
              src={previewUrl}
              className="h-[55vh] w-full rounded border border-gray-300 bg-white"
            />
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-mfleet-blue underline"
            >
              Open in new tab ↗
            </a>
          </div>
        )}
        {previewError && <p className="mt-2 text-sm text-red-600">{previewError}</p>}
      </div>

      <p className="mb-4 text-sm text-gray-500">
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
