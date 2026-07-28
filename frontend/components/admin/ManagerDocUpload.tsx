import React, { useState } from 'react';
import { Button, Spinner, StatusBadge, cn, inputBase } from './ui';
import { DateInput } from '../DateInput';
import { useFileDrop } from '../../lib/useFileDrop';

// One card per manager-side document: shows the current file's status + view/
// download on top, and a replace-file + expiry row below. Used for truck
// documents and the company owner's license.
const ManagerDocUpload: React.FC<{
  label: string;
  currentExpiry?: string | null;
  hasFile?: boolean;
  status?: string;
  requireExpiry?: boolean;
  onView?: () => void;
  onDownload?: () => void;
  onSave: (file: File | null, expiry: string) => Promise<void>;
}> = ({ label, currentExpiry, hasFile, status, requireExpiry, onView, onDownload, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState(currentExpiry ?? '');
  const [busy, setBusy] = useState(false);
  const drop = useFileDrop(setFile);

  // Show Save once something changed; keep it visible but disabled with a hint
  // when it can't save (never hide it). A doc needs a file — either just picked
  // or already on record; a date alone must not create a fileless record.
  const dirty = !!file || expiry !== (currentExpiry ?? '');
  const willHaveFile = !!file || !!hasFile;
  const missingExpiry = requireExpiry && !expiry;
  const canSave = dirty && !missingExpiry && willHaveFile;
  const hint = !willHaveFile ? 'Attach a file to save' : missingExpiry ? 'Set expiry to save' : null;

  const save = async () => {
    setBusy(true);
    try {
      await onSave(file, expiry);
      setFile(null);
    } catch {
      // The API layer already toasted the reason; keep the picked file so the
      // manager can just hit Save again.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
      {/* Current state */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-mfleet-gray-dark">{label}</span>
          {hasFile && status && <StatusBadge value={status} />}
        </div>
        {hasFile ? (
          <div className="flex items-center gap-1">
            {onView && (
              <button type="button" title="View" onClick={onView} className="rounded-lg p-1.5 text-mfleet-gray transition-colors hover:bg-gray-100 hover:text-mfleet-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}
            {onDownload && (
              <button type="button" title="Download" onClick={onDownload} className="rounded-lg p-1.5 text-mfleet-gray transition-colors hover:bg-gray-100 hover:text-mfleet-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-mfleet-gray">No file yet</span>
        )}
      </div>

      {/* Replace / upload */}
      <div className="flex flex-wrap items-center gap-2">
        <label
          {...drop.props}
          className={cn(
            'min-w-[180px] flex-1 cursor-pointer truncate rounded-md border border-dashed px-3 py-2 text-xs',
            drop.over ? 'border-mfleet-blue bg-mfleet-blue/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100',
          )}
        >
          {file ? (
            <span className="font-medium text-mfleet-gray-dark">{file.name}</span>
          ) : (
            <span className="text-gray-500">
              {drop.over ? 'Drop to attach' : hasFile ? 'Replace file — drop or click…' : 'Drop PDF/image here or click…'}
            </span>
          )}
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Expires</span>
          <DateInput
            value={expiry}
            onChange={setExpiry}
            className={cn(inputBase, 'w-36')}
          />
        </div>
        {dirty && (
          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={busy || !canSave}>
              {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
            </Button>
            {hint && <span className="text-xs text-amber-600">{hint}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDocUpload;
