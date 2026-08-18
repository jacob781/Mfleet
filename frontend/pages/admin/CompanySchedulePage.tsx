import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCompany, updateCompany } from '../../lib/adminApi';
import type { CompanyResponse, FeesSchedule, FineSchedule } from '../../lib/adminTypes';
import FineScheduleEditor from '../../components/admin/FineScheduleEditor';
import FeesScheduleEditor from '../../components/admin/FeesScheduleEditor';
import { Button, Card, Spinner } from '../../components/admin/ui';

/**
 * One company's contract schedule, on a page of its own.
 *
 * It used to unfold above the companies table, which meant editing a hundred rows
 * while the list you came from sat underneath. A page instead of a dialog because the
 * standard fine table runs to ~100 rows across six sections: a modal would nest one
 * scrollbar inside another, and closing it by accident would take the edits with it.
 * Here the browser's own Back button is the way out, and nothing is stacked.
 */
const CompanySchedulePage: React.FC = () => {
  const { id, kind } = useParams<{ id: string; kind: string }>();
  const navigate = useNavigate();
  const isFines = kind !== 'fees';

  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // The editors mutate a deep clone in place and the parent reads it back on save —
  // see FineScheduleEditor. A ref, not state: re-rendering per keystroke is exactly
  // what that design avoids.
  const draft = useRef<FineSchedule | FeesSchedule | null>(null);

  useEffect(() => {
    if (!id) return;
    getCompany(Number(id))
      .then((c) => {
        setCompany(c);
        const source = isFines ? c.fine_schedule : c.fees_schedule;
        draft.current = source ? JSON.parse(JSON.stringify(source)) : null;
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [id, isFines]);

  const save = async () => {
    if (!company || !draft.current) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateCompany(company.id, isFines
        ? { fine_schedule: draft.current as FineSchedule }
        : { fees_schedule: draft.current as FeesSchedule });
      // Stay put after saving: this is a long table, and a manager usually has more
      // to change. The banner is the receipt.
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>;
  }
  if (!company) {
    return (
      <Card className="p-6">
        <p className="text-sm text-mfleet-gray">Company not found.</p>
      </Card>
    );
  }

  const title = isFines ? 'Fine schedule (Schedule A)' : 'Fines & fees schedule';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-mfleet-gray-dark">{title}</h1>
          <p className="text-sm text-mfleet-gray">{company.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-700">Saved</span>}
          <Button variant="ghost" onClick={() => navigate('/admin/companies')}>
            Back to companies
          </Button>
          <Button onClick={save} disabled={saving || !draft.current}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {!draft.current ? (
          <p className="text-sm text-mfleet-gray">
            This company has no {isFines ? 'fine' : 'fees'} schedule yet.
          </p>
        ) : isFines ? (
          <FineScheduleEditor draft={draft.current as FineSchedule} />
        ) : (
          <FeesScheduleEditor draft={draft.current as FeesSchedule} />
        )}
      </Card>

      {/* The table is long enough that the header's Save is off-screen by the bottom. */}
      {draft.current && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate('/admin/companies')}>
            Back to companies
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompanySchedulePage;
