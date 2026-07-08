import React, { useEffect, useState } from 'react';
import {
  downloadDocument,
  listDriverDocuments,
  listTruckDocuments,
  openDocumentInTab,
} from '../../lib/adminApi';
import type { ComplianceDocument } from '../../lib/adminTypes';
import { Spinner, StatusBadge } from './ui';

// Lists a driver's or truck's compliance documents with expiry status and a
// view/download link (files are JWT-gated, so opened via an object URL).
const DocumentList: React.FC<{ driverId?: number; truckId?: number }> = ({ driverId, truckId }) => {
  const [docs, setDocs] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetcher = driverId != null ? listDriverDocuments(driverId) : listTruckDocuments(truckId!);
    fetcher
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [driverId, truckId]);

  if (loading) return <Spinner className="h-5 w-5" />;
  if (docs.length === 0) return <p className="text-sm text-mfleet-gray">No documents yet.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {docs.map((d) => (
        <li key={d.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
          <div>
            <div className="text-sm font-medium text-mfleet-gray-dark">{d.document_type}</div>
            <div className="text-xs text-mfleet-gray">Expires {d.expiry_date}</div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge value={d.status} />
            {d.has_file ? (
              <>
                <button
                  type="button"
                  title="View"
                  onClick={() => openDocumentInTab(d.id)}
                  className="rounded-lg p-1.5 text-mfleet-gray transition-colors hover:bg-gray-100 hover:text-mfleet-blue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Download"
                  onClick={() => downloadDocument(d.id, d.document_type)}
                  className="rounded-lg p-1.5 text-mfleet-gray transition-colors hover:bg-gray-100 hover:text-mfleet-blue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </>
            ) : (
              <span className="text-xs text-mfleet-gray">no file</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default DocumentList;
