import React from 'react';
import type { ComplianceDocument } from '../../lib/adminTypes';
import { downloadDocument, openDocumentInTab } from '../../lib/adminApi';
import { isoToUs } from '../../lib/masks';
import { Spinner } from './ui';

/**
 * Every version of one document, newest first. Ordered by the date printed on the
 * document rather than by expiry, because a licence is often replaced before the old
 * one runs out — see the history endpoints.
 */
const DocHistory: React.FC<{
  title: string;
  load: () => Promise<ComplianceDocument[]>;
  onClose: () => void;
}> = ({ title, load, onClose }) => {
  const [rows, setRows] = React.useState<ComplianceDocument[] | null>(null);

  React.useEffect(() => {
    let alive = true;
    load().then((r) => alive && setRows(r)).catch(() => alive && setRows([]));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // data-overlay-open stops type-to-search from grabbing keys behind the dialog.
    <div
      data-overlay-open
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-mfleet-gray-dark">{title} — history</h3>

        {rows === null ? (
          <div className="flex justify-center py-8"><Spinner className="h-5 w-5" /></div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-sm text-mfleet-gray">Nothing on record yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {rows.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-200 p-2.5 text-sm"
              >
                <span className="font-medium text-mfleet-gray-dark">
                  {d.issue_date ? isoToUs(d.issue_date) : 'issue date unknown'}
                </span>
                <span className="text-xs text-mfleet-gray">exp. {isoToUs(d.expiry_date)}</span>
                {d.document_number && (
                  <span className="text-xs text-mfleet-gray">no. {d.document_number}</span>
                )}
                {d.superseded_at ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-mfleet-gray">
                    replaced
                  </span>
                ) : (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    current
                  </span>
                )}
                {d.has_file && (
                  <span className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => openDocumentInTab(d.id)}
                      className="text-xs text-mfleet-blue hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadDocument(d.id, `${d.document_type}_${d.id}`)}
                      className="text-xs text-mfleet-blue hover:underline"
                    >
                      Download
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-mfleet-gray-dark hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocHistory;
