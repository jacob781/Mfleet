import React, { useState } from 'react';
import { Button, Spinner, StatusBadge, cn, inputBase } from './ui';
import { DateInput } from '../DateInput';
import { useFileDrop } from '../../lib/useFileDrop';
import { isoToUs } from '../../lib/masks';
import { documentBlob, rotateDocument } from '../../lib/adminApi';
import ImageEditor from './ImageEditor';
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
  /** Compliance document id + photo flag — turns on the stored-photo preview and rotation. */
  docId?: number;
  isImage?: boolean;
  onView?: () => void;
  onDownload?: () => void;
  onSave: (file: File | null, expiry: string) => Promise<void>;
}> = ({ label, currentExpiry, hasFile, status, requireExpiry, docId, isImage, onView, onDownload, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState(currentExpiry ?? '');
  const [busy, setBusy] = useState(false);
  const [cropping, setCropping] = useState(false);
  const drop = useFileDrop(setFile);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Stored photo: shown small so a sideways scan is obvious, and re-fetched after
  // each rotation (`spin` bumps) because the server replaced the file in place.
  const [spin, setSpin] = useState(0);
  const [stored, setStored] = useState<string | null>(null);
  React.useEffect(() => {
    if (!docId || !isImage || !hasFile) { setStored(null); return; }
    let url = '';
    let alive = true;
    documentBlob(docId)
      .then((b) => {
        url = URL.createObjectURL(b);
        if (alive) setStored(url); else URL.revokeObjectURL(url);
      })
      .catch(() => {});
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [docId, isImage, hasFile, spin]);

  const rotate = async (deg: number) => {
    if (!docId) return;
    setBusy(true);
    try {
      await rotateDocument(docId, deg);
      setSpin((n) => n + 1);
      // Say it out loud: this one action does not go through Save.
      toast('Photo rotated and saved.');
    } catch {
      // adminApi already toasted the reason
    } finally {
      setBusy(false);
    }
  };

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

  // Save is always on screen, disabled with a hint when there is nothing to do —
  // a button that comes and goes as a date is typed reads like a silent autosave.
  // A doc needs a file (just picked or already on record); a date alone must not
  // create a fileless record.
  const dirty = !!file || expiry !== (currentExpiry ?? '');
  const willHaveFile = !!file || !!hasFile;
  const missingExpiry = requireExpiry && !expiry;
  const canSave = dirty && !missingExpiry && willHaveFile;
  // A half-typed date reads as empty, so on a document that already has one the
  // hint must say "finish typing", not "you forgot to set it".
  const hint = !willHaveFile ? 'Attach a file to save'
    : missingExpiry ? (currentExpiry ? 'Finish the date (MM/DD/YYYY) to save' : 'Set expiry to save')
    : !dirty ? 'No changes'
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

      {/* Stored photo — click opens the full-size view. The rotate buttons sit on the
          photo itself: they act on it alone and take effect immediately, unlike the
          file/expiry row below, which waits for Save. */}
      {stored && (
        <div className="relative w-fit">
          <img
            src={stored}
            alt={label}
            onClick={onView}
            className={cn('max-h-40 rounded border border-gray-200 object-contain', onView && 'cursor-zoom-in')}
          />
          {docId && isImage && (
            <div className="absolute right-1 top-1 flex gap-1">
              <button type="button" title="Rotate left (saved right away)" disabled={busy} onClick={() => rotate(-90)} className="rounded-md bg-white/85 p-1 text-mfleet-gray-dark shadow-sm hover:bg-white disabled:opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8a9 9 0 1 1 0 8" /><polyline points="3 3 3 8 8 8" />
                </svg>
              </button>
              <button type="button" title="Rotate right (saved right away)" disabled={busy} onClick={() => rotate(90)} className="rounded-md bg-white/85 p-1 text-mfleet-gray-dark shadow-sm hover:bg-white disabled:opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a9 9 0 1 0 0 8" /><polyline points="21 3 21 8 16 8" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

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
              {/* Crop/rotate the picked photo before it is uploaded — sits under the
                  clear button, on the same corner. */}
              {preview && (
                <button
                  type="button"
                  title="Crop & rotate"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCropping(true); }}
                  className="absolute -right-2 top-4 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-mfleet-gray shadow-sm hover:bg-gray-100 hover:text-mfleet-gray-dark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              )}
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
        {cropping && file && (
          <ImageEditor
            file={file}
            onCancel={() => setCropping(false)}
            onApply={(f) => { setFile(f); setCropping(false); }}
          />
        )}
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={busy || !canSave}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
          </Button>
          {hint && (
            <span className={cn('text-xs', dirty ? 'text-amber-600' : 'text-gray-400')}>{hint}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDocUpload;
