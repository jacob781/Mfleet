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

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {msgs.map((m) => (
        <div
          key={m.id}
          role="alert"
          onClick={() => setMsgs((cur) => cur.filter((x) => x.id !== m.id))}
          className={
            'pointer-events-auto cursor-pointer rounded-lg px-4 py-3 text-sm text-white shadow-lg ' +
            (m.kind === 'error' ? 'bg-red-600' : 'bg-green-600')
          }
        >
          {m.text}
        </div>
      ))}
    </div>
  );
};
