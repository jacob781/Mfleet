import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckboxField, FieldGroup, TextField } from '../fields';
import type { DriverFormValues } from '../../../lib/driverTypes';
import { getEmploymentGaps } from '../../../lib/driverApi';
import { gapKey, type Gap } from '../../../lib/employmentGaps';

/**
 * Dedicated step after employment history: the SERVER computes the gaps (single source of
 * truth — no recomputation here), and the driver explains each one plus the two
 * attestations. Fetched on entry from the current history, so editing dates earlier and
 * coming back always shows a fresh, correct list.
 */
const StepEmploymentGaps: React.FC<{ token: string }> = ({ token }) => {
  const { getValues } = useFormContext<DriverFormValues>();
  const [gaps, setGaps] = useState<Gap[] | null>(null);

  useEffect(() => {
    let alive = true;
    getEmploymentGaps(token, getValues('employment_history') || [], getValues('application_date'))
      .then((g) => alive && setGaps(g))
      .catch(() => alive && setGaps([]));
    return () => { alive = false; };
  }, [token, getValues]);

  return (
    <div>
      <FieldGroup title="Employment gaps">
        {gaps === null ? (
          <p className="text-sm text-gray-500">Checking your employment history…</p>
        ) : gaps.length === 0 ? (
          <p className="text-sm text-gray-500">
            No employment gaps longer than one month were found in your history.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              We found the gaps below in your employment history. Briefly explain what you were
              doing during each.
            </p>
            {gaps.map((g) => (
              <TextField
                key={gapKey(g)}
                name={`employment_declaration.gap_explanations.${gapKey(g)}`}
                label={`${g.from} → ${g.to}`}
                placeholder="e.g. school, self-employed, unemployed"
              />
            ))}
          </>
        )}
      </FieldGroup>

      <FieldGroup title="Declaration">
        <CheckboxField
          name="employment_declaration.not_employed_affirm"
          label="I was not employed by any company or individual during these gaps."
        />
        <CheckboxField
          name="employment_declaration.not_convicted_affirm"
          label="I was not convicted of any criminal act involving the use of a commercial motor vehicle."
        />
      </FieldGroup>
    </div>
  );
};

export default StepEmploymentGaps;
