import React, { useState } from 'react';
import { Button, Spinner, StatusBadge, cn, inputBase } from './ui';
import { DateInput } from '../DateInput';
import { useFileDrop } from '../../lib/useFileDrop';
import { isoToUs } from '../../lib/masks';
import { toast } from '../Toast';

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
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Clearing has to reset the input too, or picking the same file again fires no
  // change event and the card looks stuck on empty.
  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Attach whatever image is on the clipboard — a screenshot or a photo copied
  // from a chat — without saving it to disk first. The zone itself stays a plain
  // label so one click still opens the picker and dragging a file in still works.
  // ponytail: images only; the clipboard API never hands over a copied PDF, and
  // for those the drop zone is the shorter path anyway.
  const pasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      toast('This browser cannot read the clipboard — drop the file here instead.');
      return;
    }
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          setFile(new File([blob], `pasted.${type.split('/')[1] || 'png'}`, { type }));
          return;
        }
      }
      toast('No image in the clipboard — copy a photo first, or drop the file here.');
    } catch {
      toast('Clipboard access was blocked — allow it in the address bar, or drop the file here.');
    }
  };

  // Preview what is attached before it goes anywhere: images as a thumbnail,
  // anything else by name. Nothing uploads until Save, so this is the check.
  const preview = React.useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file],
  );
  React.useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Show Save once something changed; keep it visible but disabled with a hint
  // when it can't save (never hide it). A doc needs a file — either just picked
  // or already on record; a date alone must not create a fileless record.
  const dirty = !!file || expiry !== (currentExpiry ?? '');
  const willHaveFile = !!file || !!hasFile;
  const missingExpiry = requireExpiry && !expiry;
  const canSave = dirty && !missingExpiry && willHaveFile;
  // A half-typed date reads as empty, so on a document that already has one the
  // hint must say "finish typing", not "you forgot to set it".
  const hint = !willHaveFile ? 'Attach a file to save'
    : missingExpiry ? (currentExpiry ? 'Finish the date (MM/DD/YYYY) to save' : 'Set expiry to save')
    : null;

  const save = async () => {
    setBusy(true);
    try {
      await onSave(file, expiry);
      clearFile();
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
          {hasFile && currentExpiry && (
            <span className="text-xs text-mfleet-gray">exp. {isoToUs(currentExpiry)}</span>
          )}
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
            // No `truncate` here: it clips overflow, and the clear button sits on
            // the corner of this border. The file name truncates on its own span.
            'relative min-w-[180px] flex-1 cursor-pointer rounded-md border border-dashed px-3 py-2 text-xs',
            drop.over ? 'border-mfleet-blue bg-mfleet-blue/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100',
          )}
        >
          {file ? (
            <span className="flex items-center gap-2">
              {preview && <img src={preview} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />}
              <span className="truncate font-medium text-mfleet-gray-dark">{file.name}</span>
              {/* Drop the attachment without saving. preventDefault stops the click
                  from reaching the label, which would reopen the file picker. */}
              <button
                type="button"
                title="Remove"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearFile(); }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-sm leading-none text-mfleet-gray shadow-sm hover:bg-gray-100 hover:text-mfleet-gray-dark"
              >
                ×
              </button>
            </span>
          ) : (
            <span className="text-gray-500">
              {drop.over ? 'Drop to attach' : hasFile ? 'Replace current file…' : 'Drop PDF/image here or click…'}
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={pasteFromClipboard}
          title="Attach the image currently in the clipboard"
          className="shrink-0 rounded-md border border-gray-300 px-2 py-2 text-xs text-mfleet-gray transition-colors hover:bg-gray-100 hover:text-mfleet-gray-dark"
        >
          Paste
        </button>
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
