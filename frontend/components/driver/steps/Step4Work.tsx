import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckboxField, FieldGroup, TextField } from '../fields';
import FieldArrayList from '../FieldArrayList';

const Step4Work: React.FC = () => {
  const { watch } = useFormContext();
  const log = watch('seven_day_log') || [];
  return (
    <div>
      <FieldGroup title="Employment history (last 10 years)">
        <FieldArrayList
          name="employment_history"
          addLabel="Add employer"
          emptyHint="Add your previous employers (most recent first)."
          newItem={() => ({
            employer_name: '', employer_address: '', employer_city: '', employer_state: '',
            employer_zip: '', employer_phone: '', employer_fax: '', start_date: '', end_date: '',
            position: '', salary: '', reason_for_leaving: '', subject_to_fmcsr: false,
            safety_sensitive: false, was_driver_subject_to_testing: false,
          })}
          renderItem={(i) => (
            <>
              <TextField name={`employment_history.${i}.employer_name`} label="Employer name" />
              <TextField name={`employment_history.${i}.employer_address`} label="Address" />
              <TextField name={`employment_history.${i}.employer_city`} label="City" />
              <TextField name={`employment_history.${i}.employer_state`} label="State" />
              <TextField name={`employment_history.${i}.employer_zip`} label="ZIP" inputMode="numeric" />
              <TextField name={`employment_history.${i}.employer_phone`} label="Phone" format="phone" />
              <TextField name={`employment_history.${i}.employer_fax`} label="Fax" />
              <TextField name={`employment_history.${i}.start_date`} label="Start date" type="date" />
              <TextField name={`employment_history.${i}.end_date`} label="End date" type="date" />
              <TextField name={`employment_history.${i}.position`} label="Position" />
              <TextField name={`employment_history.${i}.salary`} label="Salary" />
              <TextField name={`employment_history.${i}.reason_for_leaving`} label="Reason for leaving" />
              <CheckboxField name={`employment_history.${i}.subject_to_fmcsr`} label="Was this job subject to FMCSRs?" />
              <CheckboxField name={`employment_history.${i}.safety_sensitive`} label="Was this a safety-sensitive function (DOT)?" />
              <CheckboxField name={`employment_history.${i}.was_driver_subject_to_testing`} label="Were you subject to drug/alcohol testing?" />
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup title="Record of duty — last 7 days">
        {log.map((_: unknown, i: number) => (
          <div key={i} className="rounded-lg border border-gray-200 p-3 mb-3">
            <span className="text-sm font-medium text-gray-500">Day {i + 1}</span>
            <TextField name={`seven_day_log.${i}.date`} label="Date" type="date" />
            <TextField name={`seven_day_log.${i}.hours`} label="Total hours on duty" inputMode="numeric" />
            <TextField name={`seven_day_log.${i}.relieved_time`} label="Time relieved" placeholder="e.g. 6:00 PM" />
          </div>
        ))}
      </FieldGroup>

      <FieldGroup title="Last relieved from duty">
        <TextField name="last_relieved_date" label="Date" type="date" />
        <TextField name="last_relieved_time" label="Time" placeholder="e.g. 6:00 PM" />
        <TextField name="last_relieved_location" label="Location" />
      </FieldGroup>
    </div>
  );
};

export default Step4Work;
