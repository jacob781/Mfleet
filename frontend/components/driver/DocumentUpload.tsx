import React, { useEffect, useRef, useState } from 'react';
import { documentUrl, uploadDocument, truckDocumentUrl, uploadTruckDocument, FormError } from '../../lib/driverApi';
import { useFileDrop } from '../../lib/useFileDrop';

type Status = 'idle' | 'uploading' | 'done' | 'error';

/**
 * Reusable required-document uploader. Sends the file to the server (stored by id,
 * folded into the final contract) and shows the uploaded state with a view link.
 * When `truckIndex` is set, it targets that owner-operator truck's per-truck endpoint.
 * ponytail: probes the serve endpoint once on mount to recover "already uploaded"
 * state after a reload — small files, one GET; swap for a HEAD if it ever matters.
 */
const DocumentUpload: React.FC<{
  token: string;
  docType: string;
  label: string;
  required?: boolean;
  truckIndex?: number;
}> = ({ token, docType, label, required, truckIndex }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const drop = useFileDrop((f) => void upload(f));

  const viewUrl = truckIndex != null ? truckDocumentUrl(token, truckIndex, docType) : documentUrl(token, docType);

  useEffect(() => {
    let alive = true;
    fetch(viewUrl).then((r) => {
      if (alive && r.ok) setStatus('done');
    }).catch(() => {});
    return () => { alive = false; };
  }, [viewUrl]);

  async function upload(file: File) {
    setStatus('uploading');
    setError('');
    try {
      if (truckIndex != null) await uploadTruckDocument(token, truckIndex, docType, file);
      else await uploadDocument(token, docType, file);
      setStatus('done');
    } catch (err) {
      const detail = err instanceof FormError ? err.detail : 'Upload failed';
      setError(typeof detail === 'string' ? detail : 'Upload failed');
      setStatus('error');
    }
  }

  return (
    <label
      {...drop.props}
      className={'block mb-4 rounded-lg border-2 border-dashed p-3 transition-colors ' +
        (drop.over ? 'border-mfleet-blue bg-mfleet-blue/5' : 'border-transparent')}
    >
      <span className="block text-sm font-medium text-mfleet-gray-dark mb-1">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0
          file:bg-mfleet-blue file:px-4 file:py-2 file:text-white file:cursor-pointer"
      />
      <span className="block text-xs text-gray-400 mt-1">or drag &amp; drop the file here</span>
      {status === 'uploading' && <span className="block text-sm text-gray-500 mt-1">Uploading…</span>}
      {status === 'done' && (
        <span className="block text-sm text-green-700 mt-1">
          Uploaded ✓{' '}
          <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="underline">
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
