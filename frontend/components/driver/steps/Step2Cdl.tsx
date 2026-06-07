import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckboxField, FieldGroup, TextField } from '../fields';

const ExperienceRow: React.FC<{ base: string; title: string }> = ({ base, title }) => (
  <FieldGroup title={title}>
    <TextField name={`${base}.type`} label="Equipment type" placeholder="e.g. Tractor-trailer" />
    <TextField name={`${base}.dates`} label="Dates" placeholder="e.g. 2020–2023" />
    <TextField name={`${base}.miles`} label="Approx. miles" inputMode="numeric" />
  </FieldGroup>
);

const Step2Cdl: React.FC = () => {
  const { watch } = useFormContext();
  const denied = watch('license_history.denied');
  const suspended = watch('license_history.suspended');
  return (
    <div>
      <FieldGroup title="Commercial Driver's License (CDL)">
        <TextField name="cdl.state" label="Issuing state" required />
        <TextField name="cdl.number" label="License number" required />
        <TextField name="cdl.type" label="Class / type" required placeholder="e.g. Class A" />
        <TextField name="cdl.expiration" label="Expiration date" required type="date" />
      </FieldGroup>

      <FieldGroup title="Medical examiner's certificate">
        <TextField name="medical.examiner_name" label="Examiner name" required />
        <TextField name="medical.registry_number" label="National Registry number" required />
        <TextField name="medical.expiration_date" label="Expiration date" required type="date" />
        <CheckboxField name="medical.waiver" label="I have a medical waiver / exemption" />
      </FieldGroup>

      <FieldGroup title="Driving experience">
        <ExperienceRow base="experience.straight" title="Straight truck" />
        <ExperienceRow base="experience.tractor" title="Tractor and semi-trailer" />
        <ExperienceRow base="experience.doubles" title="Doubles / triples" />
      </FieldGroup>

      <FieldGroup title="License history">
        <CheckboxField name="license_history.denied" label="Have you ever been denied a license, permit or privilege?" />
        {denied && <TextField name="license_history.denied_reason" label="If yes, explain" required />}
        <CheckboxField name="license_history.suspended" label="Has any license, permit or privilege ever been suspended or revoked?" />
        {suspended && <TextField name="license_history.suspended_reason" label="If yes, explain" required />}
      </FieldGroup>
    </div>
  );
};

export default Step2Cdl;
