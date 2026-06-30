import React, { useReducer } from 'react';
import type { FineSchedule } from '../../lib/adminTypes';

/**
 * Editor for a company's (or application's) Schedule A fine table. Values are uncontrolled
 * inputs mutating `draft` in place (no per-keystroke re-render — the table is ~120 rows).
 * Add/remove mutate the draft arrays then force a re-render; everything is keyed by
 * `${version}-...` so inputs remount with fresh defaultValues from the mutated draft.
 * The parent owns `draft` (a deep clone) and reads it back on save.
 */
const inputCls = 'w-full rounded border border-gray-300 px-2 py-1 text-sm';

const FineScheduleEditor: React.FC<{ draft: FineSchedule }> = ({ draft }) => {
  const [version, bump] = useReducer((v) => v + 1, 0);
  if (!draft) return <p className="text-sm text-mfleet-gray">This company has no fine schedule.</p>;

  const addRow = (si: number) => { draft.sections[si].rows.push({ violation: '', points: '', first: '', second: '' }); bump(); };
  const removeRow = (si: number, ri: number) => { draft.sections[si].rows.splice(ri, 1); bump(); };
  const addSection = () => { draft.sections.push({ title: 'NEW SECTION', rows: [] }); bump(); };
  const removeSection = (si: number) => { draft.sections.splice(si, 1); bump(); };

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-center gap-2 text-sm">
        <span className="font-medium text-mfleet-gray-dark">Chargeback rate ($ per point)</span>
        <input
          type="number"
          defaultValue={draft.rate_per_point}
          onChange={(e) => { draft.rate_per_point = Number(e.target.value); }}
          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      <fieldset className="rounded-lg border border-gray-200 p-3">
        <legend className="px-1 text-sm font-semibold text-mfleet-gray-dark">Rewards — clean DOT inspections</legend>
        <input
          defaultValue={draft.rewards.title}
          onChange={(e) => { draft.rewards.title = e.target.value; }}
          className={`${inputCls} mb-2`}
          placeholder="Title"
        />
        <textarea
          defaultValue={draft.rewards.intro}
          onChange={(e) => { draft.rewards.intro = e.target.value; }}
          className={`${inputCls} mb-2`}
          rows={2}
          placeholder="Intro text"
        />
        {draft.rewards.rows.map((row, i) => (
          <div key={`${version}-rw-${i}`} className="mb-2 flex gap-2">
            <input defaultValue={row.label} onChange={(e) => { row.label = e.target.value; }} className={inputCls} placeholder="Inspection level" />
            <input defaultValue={row.amount} onChange={(e) => { row.amount = e.target.value; }} className="w-28 rounded border border-gray-300 px-2 py-1 text-sm" placeholder="Reward" />
          </div>
        ))}
      </fieldset>

      {draft.sections.map((section, si) => (
        <fieldset key={`${version}-s-${si}`} className="rounded-lg border border-gray-200 p-3">
          <legend className="flex items-center gap-2 px-1">
            <input
              defaultValue={section.title}
              onChange={(e) => { section.title = e.target.value; }}
              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold uppercase text-mfleet-gray-dark"
            />
            <button type="button" onClick={() => removeSection(si)} className="text-xs text-red-600 underline">Remove section</button>
          </legend>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-mfleet-gray">
                <th className="px-1 py-1">Violation</th>
                <th className="w-16 px-1 py-1">Points</th>
                <th className="w-32 px-1 py-1">1st offense</th>
                <th className="w-32 px-1 py-1">2nd offense</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => (
                <tr key={`${version}-r-${si}-${ri}`}>
                  <td className="px-1 py-0.5"><input defaultValue={row.violation} onChange={(e) => { row.violation = e.target.value; }} className={inputCls} /></td>
                  <td className="px-1 py-0.5"><input defaultValue={row.points} onChange={(e) => { row.points = e.target.value; }} className={inputCls} /></td>
                  <td className="px-1 py-0.5"><input defaultValue={row.first} onChange={(e) => { row.first = e.target.value; }} className={inputCls} /></td>
                  <td className="px-1 py-0.5"><input defaultValue={row.second} onChange={(e) => { row.second = e.target.value; }} className={inputCls} /></td>
                  <td className="px-1 py-0.5 text-center"><button type="button" onClick={() => removeRow(si, ri)} className="text-red-600" title="Remove row">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addRow(si)} className="mt-2 text-sm font-medium text-mfleet-blue underline">
            + Add row
          </button>
        </fieldset>
      ))}

      <button type="button" onClick={addSection} className="self-start text-sm font-medium text-mfleet-blue underline">
        + Add section
      </button>
    </div>
  );
};

export default FineScheduleEditor;
