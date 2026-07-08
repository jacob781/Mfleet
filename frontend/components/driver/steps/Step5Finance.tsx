import React, { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CheckboxField, FieldGroup, SelectField, TextField, inputCls } from '../fields';
import FieldArrayList from '../FieldArrayList';
import type { Compensation } from '../../../lib/driverTypes';
import { TRUCK_MAKES, TRUCK_TYPES } from '../../../lib/truckMakes';

// Dropdown of preset values with an "Other" escape that reveals a free-text box.
// Used for both Make and Type — the selected/typed string is the source of truth.
const PresetOrOtherField: React.FC<{
  name: string;
  label: string;
  options: readonly string[];
}> = ({ name, label, options }) => {
  const { register, setValue } = useFormContext();
  const value = (useWatch({ name }) as string | undefined) ?? '';
  const preset = options.find((o) => o.toLowerCase() === value.toLowerCase());
  const [other, setOther] = useState(!preset && value !== '');
  const selectVal = preset ?? (other ? 'OTHER' : '');
  return (
    <div className="mb-4">
      <span className="block text-sm font-medium text-mfleet-gray-dark mb-1">{label}</span>
      <select
        className={inputCls}
        value={selectVal}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'OTHER') {
            setOther(true);
            setValue(name, '', { shouldDirty: true });
          } else {
            setOther(false);
            setValue(name, v, { shouldDirty: true });
          }
        }}
      >
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value="OTHER">Other</option>
      </select>
      {other && (
        <input {...register(name)} placeholder={`Enter ${label.toLowerCase()}`} className={inputCls + ' mt-2'} />
      )}
    </div>
  );
};

// Read-only summary of the carrier-set compensation (Supplement B). Returns label/value
// rows; the rate line depends on the manager's compensation_type.
function compensationRows(c: Compensation): [string, string][] {
  const money = (n: number | null | undefined) => (n != null ? `$${n}` : '—');
  let rate = '—';
  if (c.compensation_type === 'percentage') {
    rate = `${c.percentage_rate_non_amazon ?? 0}% of gross`;
    if (c.percentage_rate_amazon) rate += `, ${c.percentage_rate_amazon}% on Amazon loads`;
  } else if (c.compensation_type === 'weekly_flat') {
    rate = `${money(c.weekly_amount)} / week`;
  } else if (c.compensation_type === 'per_mile') {
    rate = `${money(c.loaded_rate)} / loaded mi · ${money(c.empty_rate)} / empty mi`;
  } else if (c.compensation_type === 'hourly') {
    rate = `${money(c.hourly_rate)} / hour`;
  }
  return [
    ['Pay rate', rate],
    ['Insurance (cargo, liability)', `${money(c.insurance_cargo_liability)} / week`],
    ['Service', `${money(c.eld_device_weekly)} / week`],
    ['Tablet', `${money(c.tablet_weekly)} / month`],
    ['IFTA', `${money(c.prepass_monthly)} / week`],
    ['Administration fee', `${money(c.administration_fee_weekly)} / week`],
    ['Prepass', 'Billed monthly per toll-road usage'],
  ];
}

const Step5Finance: React.FC<{ isOwner: boolean; compensation?: Compensation | null }> = ({ isOwner, compensation }) => {
  // The W-9 TIN is an SSN for individuals and an EIN otherwise — both 9 digits
  // but formatted differently. Switch the mask on the selected tax class.
  const w9Type = useWatch({ name: 'w9.type' });
  const tinFormat = w9Type === 'Individual' ? 'ssn' : 'ein';

  // Form "memory": seed the W-9 from the personal info already entered on Step 1
  // so the driver doesn't retype their name/address. Only fills blanks, so any
  // manual edit here is never clobbered.
  // ponytail: re-runs on each entry to this step; refills only empty fields, fine.
  const { getValues, setValue } = useFormContext();
  useEffect(() => {
    const v = getValues();
    const fullName = [v.first_name, v.middle_name, v.last_name].filter(Boolean).join(' ').trim();
    if (fullName && !getValues('w9.name')) setValue('w9.name', fullName);
    const a = v.address || {};
    if (a.street && !getValues('w9.address')) setValue('w9.address', a.street);
    if (a.city && !getValues('w9.city_state_zip'))
      setValue('w9.city_state_zip', `${a.city}, ${a.state || ''} ${a.zip || ''}`.replace(/\s+/g, ' ').trim());
  }, [getValues, setValue]);

  // TIN equals the SSN for individuals — seed it once the class is set to Individual.
  useEffect(() => {
    const ssn = getValues('ssn');
    if (w9Type === 'Individual' && ssn && !getValues('w9.tin')) setValue('w9.tin', ssn);
  }, [w9Type, getValues, setValue]);
  return (
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
              <PresetOrOtherField name={`equipment.${i}.make`} label="Make" options={TRUCK_MAKES} />
              <TextField name={`equipment.${i}.year`} label="Year" type="number" inputMode="numeric" valueAsNumber />
              <PresetOrOtherField name={`equipment.${i}.type`} label="Type" options={TRUCK_TYPES} />
              <TextField name={`equipment.${i}.vin`} label="VIN" format="vin" />
              <TextField name={`equipment.${i}.state`} label="Registered state" format="state" />
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

    {isOwner && compensation && (
      <FieldGroup title="Compensation (set by your carrier)">
        <p className="text-sm text-gray-500 mb-3">
          These rates and fees were set by your carrier and appear in Supplement B of the
          agreement you&apos;ll sign. Shown here for your reference.
        </p>
        <dl className="overflow-hidden rounded-lg border border-gray-200 text-sm">
          {compensationRows(compensation).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-gray-100 px-3 py-1.5 last:border-b-0">
              <dt className="text-gray-600">{label}</dt>
              <dd className="text-right font-medium text-mfleet-gray-dark">{value}</dd>
            </div>
          ))}
        </dl>
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
          { value: 'LLC', label: 'LLC' },
          { value: 'Trust/estate', label: 'Trust / Estate' },
          { value: 'Other', label: 'Other' },
        ]}
      />
      {w9Type === 'LLC' && (
        <SelectField
          name="w9.llc_classification"
          label="LLC tax classification"
          required
          options={[
            { value: 'C', label: 'C — C corporation' },
            { value: 'S', label: 'S — S corporation' },
            { value: 'P', label: 'P — Partnership' },
          ]}
        />
      )}
      {w9Type === 'Other' && (
        <TextField name="w9.other_classification" label="Classification (describe)" required />
      )}
      <TextField name="w9.name" label="Name (as shown on tax return)" required />
      <TextField name="w9.business_name" label="Business name (if different)" />
      <TextField name="w9.address" label="Address" required />
      <TextField name="w9.city_state_zip" label="City, State, ZIP" required />
      <TextField name="w9.tin" label="Taxpayer ID (SSN/EIN)" required format={tinFormat} />
      {/* W-9 line 4 exemption codes apply to entities, not individual drivers — hide for Individual. */}
      {w9Type && w9Type !== 'Individual' && (
        <>
          <TextField name="w9.exempt_payee_code" label="Exempt payee code (if any)" />
          <TextField name="w9.fatca_exemption_code" label="FATCA exemption code (if any)" />
        </>
      )}
    </FieldGroup>

    <FieldGroup title="Direct deposit — banking">
      <TextField name="banking.bank_name" label="Bank name" required />
      <TextField name="banking.routing_number" label="Routing number" required format="routing" />
      <TextField name="banking.account_number" label="Account number" required format="account" />
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
};

export default Step5Finance;
