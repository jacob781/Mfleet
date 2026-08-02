import React from 'react';

type Msg = { id: number; text: string; kind: 'error' | 'success' };

let emit: ((m: Msg) => void) | null = null;
let seq = 0;

/**
 * Fire a toast from anywhere — components, event handlers, or the API layer.
 * ponytail: module-level emitter instead of a context/provider, so non-React
 * code (lib/adminApi.ts) can report failures without prop-drilling a hook.
 */
export function toast(text: string, kind: Msg['kind'] = 'error'): void {
  emit?.({ id: ++seq, text, kind });
}

/** Human-readable one-liner for a failed response. Bodies from nginx (413) or a
 *  crashed proxy are HTML, not JSON — never show those raw. */
export function errorText(status: number, detail: any): string {
  if (status === 413) return 'That file is too large to upload (max 15 MB).';
  if (status === 401) return 'Your session expired — please sign in again.';
  if (Array.isArray(detail)) return detail.map((d: any) => d?.msg || d?.detail || String(d)).join('; ');
  if (typeof detail === 'string' && detail && !detail.trimStart().startsWith('<')) return detail;
  return `Request failed (${status}). Please try again.`;
}

/** Mount once at the app root. */
export const Toaster: React.FC = () => {
  const [msgs, setMsgs] = React.useState<Msg[]>([]);

  React.useEffect(() => {
    emit = (m) => {
      setMsgs((cur) => [...cur, m]);
      setTimeout(() => setMsgs((cur) => cur.filter((x) => x.id !== m.id)), 7000);
    };
    return () => { emit = null; };
  }, []);

  const dismiss = (id: number) => setMsgs((cur) => cur.filter((x) => x.id !== id));

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {/* New toasts land at the bottom. The wrapper grows from nothing (toast-enter),
          which lifts the older ones instead of teleporting them. */}
      {msgs.map((m) => (
        <div key={m.id} className="toast-enter">
          <div className="overflow-hidden">
            <div
              role="alert"
              onClick={() => dismiss(m.id)}
              className={
                'pointer-events-auto flex cursor-pointer items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ' +
                (m.kind === 'error' ? 'bg-red-600' : 'bg-green-600')
              }
            >
              <span className="flex-1">{m.text}</span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={(e) => { e.stopPropagation(); dismiss(m.id); }}
                className="-mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
