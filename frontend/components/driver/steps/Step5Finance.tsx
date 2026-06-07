import React from 'react';
import { CheckboxField, FieldGroup, SelectField, TextField } from '../fields';
import FieldArrayList from '../FieldArrayList';

const Step5Finance: React.FC<{ isOwner: boolean }> = ({ isOwner }) => (
  <div>
    {isOwner && (
      <FieldGroup title="Equipment (your truck)">
        <FieldArrayList
          name="equipment"
          addLabel="Add equipment"
          emptyHint="Add the truck(s) you own and operate."
          newItem={() => ({ make: '', year: new Date().getFullYear(), type: '', vin: '', state: '', plate: '' })}
          renderItem={(i) => (
            <>
              <TextField name={`equipment.${i}.make`} label="Make" />
              <TextField name={`equipment.${i}.year`} label="Year" type="number" inputMode="numeric" valueAsNumber />
              <TextField name={`equipment.${i}.type`} label="Type" placeholder="e.g. Tractor" />
              <TextField name={`equipment.${i}.vin`} label="VIN" />
              <TextField name={`equipment.${i}.state`} label="Registered state" />
              <TextField name={`equipment.${i}.plate`} label="Plate number" />
            </>
          )}
        />
      </FieldGroup>
    )}

    {isOwner && (
      <FieldGroup title="IFTA (Fuel Tax) preference">
        <SelectField
          name="ifta_choice"
          label="Fuel tax filing"
          options={[
            { value: 'own', label: 'I will file my own quarterly fuel tax returns' },
            { value: 'carrier', label: "Use the carrier's fuel tax reporting service" },
          ]}
        />
      </FieldGroup>
    )}

    <FieldGroup title="W-9 — Taxpayer identification">
      <SelectField
        name="w9.type"
        label="Tax classification"
        required
        options={[
          { value: 'Individual', label: 'Individual / Sole proprietor' },
          { value: 'C Corp', label: 'C Corporation' },
          { value: 'S Corp', label: 'S Corporation' },
          { value: 'Partnership', label: 'Partnership' },
        ]}
      />
      <TextField name="w9.name" label="Name (as shown on tax return)" required />
      <TextField name="w9.business_name" label="Business name (if different)" />
      <TextField name="w9.address" label="Address" required />
      <TextField name="w9.city_state_zip" label="City, State, ZIP" required />
      <TextField name="w9.tin" label="Taxpayer ID (SSN/EIN)" required inputMode="numeric" />
    </FieldGroup>

    <FieldGroup title="Direct deposit — banking">
      <TextField name="banking.bank_name" label="Bank name" required />
      <TextField name="banking.routing_number" label="Routing number" required inputMode="numeric" />
      <TextField name="banking.account_number" label="Account number" required inputMode="numeric" />
      <SelectField
        name="banking.account_type"
        label="Account type"
        required
        options={[
          { value: 'Checking', label: 'Checking' },
          { value: 'Savings', label: 'Savings' },
        ]}
      />
    </FieldGroup>

    <FieldGroup title="Company policies">
      <p className="text-sm text-gray-500 mb-3">
        The full company policies, agreements and acknowledgements are included in your final document.
        Please confirm you have read and agree to them.
      </p>
      <CheckboxField
        name="_policies_ack"
        requiredTrue="You must accept the policies to continue"
        label="I have read and agree to all company policies and agreements."
      />
    </FieldGroup>
  </div>
);

export default Step5Finance;
