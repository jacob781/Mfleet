import React, { useEffect, useRef, useState } from 'react';
import { documentUrl, uploadDocument, FormError } from '../../lib/driverApi';

type Status = 'idle' | 'uploading' | 'done' | 'error';

/**
 * Reusable required-document uploader. Sends the file to the server (stored by id,
 * folded into the final contract) and shows the uploaded state with a view link.
 * ponytail: probes the serve endpoint once on mount to recover "already uploaded"
 * state after a reload — small files, one GET; swap for a HEAD if it ever matters.
 */
const DocumentUpload: React.FC<{
  token: string;
  docType: string;
  label: string;
  required?: boolean;
}> = ({ token, docType, label, required }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(documentUrl(token, docType)).then((r) => {
      if (alive && r.ok) setStatus('done');
    }).catch(() => {});
    return () => { alive = false; };
  }, [token, docType]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    setError('');
    try {
      await uploadDocument(token, docType, file);
      setStatus('done');
    } catch (err) {
      const detail = err instanceof FormError ? err.detail : 'Upload failed';
      setError(typeof detail === 'string' ? detail : 'Upload failed');
      setStatus('error');
    }
  }

  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-mfleet-gray-dark mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={onPick}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0
          file:bg-mfleet-blue file:px-4 file:py-2 file:text-white file:cursor-pointer"
      />
      {status === 'uploading' && <span className="block text-sm text-gray-500 mt-1">Uploading…</span>}
      {status === 'done' && (
        <span className="block text-sm text-green-700 mt-1">
          Uploaded ✓{' '}
          <a href={documentUrl(token, docType)} target="_blank" rel="noopener noreferrer" className="underline">
            View
          </a>{' '}
          — pick a file to replace.
        </span>
      )}
      {status === 'error' && <span className="block text-sm text-red-600 mt-1">{error}</span>}
    </label>
  );
};

export default DocumentUpload;
