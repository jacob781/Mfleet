import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckboxField, FieldGroup, TextAreaField, TextField } from '../fields';
import FieldArrayList from '../FieldArrayList';

const Step3History: React.FC = () => {
  const { watch } = useFormContext();
  const sap = watch('drug_alcohol_history.sap_evaluation');
  return (
    <div>
      <FieldGroup title="Accident record (last 3 years)">
        <FieldArrayList
          name="accidents"
          addLabel="Add accident"
          emptyHint="Add any accidents from the last 3 years (leave empty if none)."
          newItem={() => ({ date: '', nature: '', fatalities: 0, injuries: 0, chemical_spill: false })}
          renderItem={(i) => (
            <>
              <TextField name={`accidents.${i}.date`} label="Date" type="date" />
              <TextField name={`accidents.${i}.nature`} label="Nature of accident" placeholder="e.g. Rear-end" />
              <TextField name={`accidents.${i}.fatalities`} label="Fatalities" type="number" inputMode="numeric" valueAsNumber />
              <TextField name={`accidents.${i}.injuries`} label="Injuries" type="number" inputMode="numeric" valueAsNumber />
              <CheckboxField name={`accidents.${i}.chemical_spill`} label="Hazmat / chemical spill" />
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup title="Traffic violations (last 3 years)">
        <FieldArrayList
          name="violations"
          addLabel="Add violation"
          emptyHint="Add any traffic convictions from the last 3 years (leave empty if none)."
          newItem={() => ({ date: '', location: '', charge: '', penalty: '' })}
          renderItem={(i) => (
            <>
              <TextField name={`violations.${i}.date`} label="Date" type="date" />
              <TextField name={`violations.${i}.location`} label="Location" />
              <TextField name={`violations.${i}.charge`} label="Charge" />
              <TextField name={`violations.${i}.penalty`} label="Penalty" />
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup title="Drug & alcohol history">
        <CheckboxField name="drug_alcohol_history.tested_positive_3yrs" label="Tested positive in the last 3 years" />
        <CheckboxField name="drug_alcohol_history.breath_alcohol_04_3yrs" label="Breath alcohol 0.04+ in the last 3 years" />
        <CheckboxField name="drug_alcohol_history.refused_test_3yrs" label="Refused a test in the last 3 years" />
        <CheckboxField name="drug_alcohol_history.violated_dot_regulations" label="Violated DOT drug/alcohol regulations" />
        <CheckboxField name="drug_alcohol_history.sap_evaluation" label="Completed a SAP (Substance Abuse Professional) evaluation" />
        {sap && <TextAreaField name="drug_alcohol_history.sap_details" label="SAP details" />}
      </FieldGroup>
    </div>
  );
};

export default Step3History;
