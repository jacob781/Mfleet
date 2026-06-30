import React, { useReducer } from 'react';
import type { FeesSchedule } from '../../lib/adminTypes';

/**
 * Editor for the compact FINES AND FEES SCHEDULE (flat violation -> fee). Values are
 * uncontrolled inputs mutating `draft` in place (no per-keystroke re-render). Add/remove
 * mutate draft.rows then force a re-render; rows are keyed by `${version}-${i}` so they
 * remount with fresh defaultValues from the (already-mutated) draft.
 */
const inputCls = 'w-full rounded border border-gray-300 px-2 py-1 text-sm';

const FeesScheduleEditor: React.FC<{ draft: FeesSchedule }> = ({ draft }) => {
  const [version, bump] = useReducer((v) => v + 1, 0);
  if (!draft) return <p className="text-sm text-mfleet-gray">This company has no fees schedule.</p>;

  const addRow = () => { draft.rows.push({ violation: '', fee: '' }); bump(); };
  const removeRow = (i: number) => { draft.rows.splice(i, 1); bump(); };

  return (
    <div className="flex flex-col gap-3">
      <input
        defaultValue={draft.title}
        onChange={(e) => { draft.title = e.target.value; }}
        className={`${inputCls} font-semibold`}
        placeholder="Title"
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-mfleet-gray">
            <th className="px-1 py-1">Penalty</th>
            <th className="w-48 px-1 py-1">Fee</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {draft.rows.map((row, i) => (
            <tr key={`${version}-${i}`}>
              <td className="px-1 py-0.5">
                <input defaultValue={row.violation} onChange={(e) => { row.violation = e.target.value; }} className={inputCls} />
              </td>
              <td className="px-1 py-0.5">
                <input defaultValue={row.fee} onChange={(e) => { row.fee = e.target.value; }} className={inputCls} />
              </td>
              <td className="px-1 py-0.5 text-center">
                <button type="button" onClick={() => removeRow(i)} className="text-red-600" title="Remove row">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} className="self-start text-sm font-medium text-mfleet-blue underline">
        + Add row
      </button>
    </div>
  );
};

export default FeesScheduleEditor;
