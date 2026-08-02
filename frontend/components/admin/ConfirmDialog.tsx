import React from 'react';
import { Button, TextInput } from './ui';

// Lightweight confirmation modal — a plain overlay + card, no dependencies, so it
// stays snappy on weak devices. Replaces window.confirm with an in-style dialog.
const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  /** When set, the manager must type this exactly before the button unlocks —
   *  for deletes that take other records down with them. */
  confirmPhrase?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, confirmLabel = 'Delete', confirmPhrase, busy, onConfirm, onCancel }) => {
  const [typed, setTyped] = React.useState('');
  React.useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const locked = !!confirmPhrase && typed.trim().toLowerCase() !== confirmPhrase.trim().toLowerCase();
  return (
    // data-overlay-open stops type-to-search from grabbing keys behind the dialog.
    <div
      data-overlay-open
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-mfleet-gray-dark">{title}</h3>
        {message && <p className="mt-2 whitespace-pre-line text-sm text-mfleet-gray">{message}</p>}
        {confirmPhrase && (
          <label className="mt-4 block">
            <span className="text-xs text-mfleet-gray">
              Type <span className="font-semibold text-mfleet-gray-dark">{confirmPhrase}</span> to confirm
            </span>
            <TextInput
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-1"
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy || locked}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
