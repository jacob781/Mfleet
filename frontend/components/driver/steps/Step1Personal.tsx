import React from 'react';
import { FieldGroup, TextField } from '../fields';
import FieldArrayList from '../FieldArrayList';

const Step1Personal: React.FC = () => (
  <div>
    <FieldGroup title="Personal information">
      <TextField name="first_name" label="First name" required autoComplete="given-name" />
      <TextField name="middle_name" label="Middle name" />
      <TextField name="last_name" label="Last name" required autoComplete="family-name" />
      <TextField name="ssn" label="SSN" required format="ssn" />
      <TextField name="dob" label="Date of birth" required type="date" />
      <TextField name="phone" label="Phone" required format="phone" autoComplete="tel" />
      <TextField name="email" label="Email" required type="email" inputMode="email" autoComplete="email" />
    </FieldGroup>

    <FieldGroup title="Current address">
      <TextField name="address.street" label="Street" required autoComplete="address-line1" />
      <TextField name="address.city" label="City" required autoComplete="address-level2" />
      <TextField name="address.state" label="State" required format="state" autoComplete="address-level1" />
      <TextField name="address.zip" label="ZIP" required inputMode="numeric" autoComplete="postal-code" />
    </FieldGroup>

    <FieldGroup title="Address history (last 3 years)">
      <FieldArrayList
        name="residency_history"
        addLabel="Add previous address"
        emptyHint="Add any previous addresses from the last 3 years."
        newItem={() => ({ street: '', city: '', state: '', zip: '', years: '' })}
        renderItem={(i) => (
          <>
            <TextField name={`residency_history.${i}.street`} label="Street" />
            <TextField name={`residency_history.${i}.city`} label="City" />
            <TextField name={`residency_history.${i}.state`} label="State" format="state" />
            <TextField name={`residency_history.${i}.zip`} label="ZIP" inputMode="numeric" />
            <TextField name={`residency_history.${i}.years`} label="Years at this address" placeholder="e.g. 2019–2021" />
          </>
        )}
      />
    </FieldGroup>

    <FieldGroup title="Emergency contact">
      <TextField name="emergency.name" label="Name" required />
      <TextField name="emergency.phone" label="Phone" required format="phone" />
      <TextField name="emergency.relation" label="Relationship" required />
    </FieldGroup>
  </div>
);

export default Step1Personal;
