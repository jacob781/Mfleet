import React from 'react';
import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import type { ApplicationSettings, FeesSchedule, FineSchedule } from '../../lib/adminTypes';
import { Card, Field, SelectInput, TextInput, Toggle } from './ui';
import FineScheduleEditor from './FineScheduleEditor';
import FeesScheduleEditor from './FeesScheduleEditor';

const COMPENSATION_OPTIONS = [
  { value: 'percentage', label: 'Percentage of gross' },
  { value: 'weekly_flat', label: 'Weekly flat' },
  { value: 'per_mile', label: 'Per mile' },
  { value: 'hourly', label: 'Hourly' },
] as const;

// The contract-settings section of the application form, shared by create and edit.
// The parent owns the per-application fine/fees override state + drafts; these props
// only describe whether to offer them and what to render.
interface Props {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  customizeFines: boolean;
  fineDraft: FineSchedule | null;
  canCustomizeFines: boolean;
  onCustomizeFinesChange: (on: boolean) => void;
  fineEditorKey: string | number;
  customizeFees: boolean;
  feesDraft: FeesSchedule | null;
  canCustomizeFees: boolean;
  onCustomizeFeesChange: (on: boolean) => void;
  feesEditorKey: string | number;
}

const ContractSettingsFields: React.FC<Props> = ({
  register,
  watch,
  errors,
  customizeFines,
  fineDraft,
  canCustomizeFines,
  onCustomizeFinesChange,
  fineEditorKey,
  customizeFees,
  feesDraft,
  canCustomizeFees,
  onCustomizeFeesChange,
  feesEditorKey,
}) => {
  const compType = watch('settings.compensation_type') as ApplicationSettings['compensation_type'];

  const num = (name: keyof ApplicationSettings, label: string, step?: string) => (
    <Field label={label} error={(errors.settings as any)?.[name]?.message}>
      <TextInput
        type="number"
        step={step}
        {...register(`settings.${name}` as const, { valueAsNumber: true })}
      />
    </Field>
  );

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Contract settings</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {num('min_age', 'Minimum age')}
        {num('min_years_history', 'Min. years experience')}
        {num('deposit_amount', 'Deposit amount ($)')}
        {num('deposit_weeks', 'Deposit weeks')}
        {num('trailer_maintenance_monthly', 'Trailer maintenance / month ($)')}
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
        Compensation
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Pay type">
          <SelectInput {...register('settings.compensation_type')}>
            {COMPENSATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        {compType === 'percentage' && (
          <>
            {num('percentage_rate_non_amazon', 'Non-Amazon loads (%)')}
            {num('percentage_rate_amazon', 'Amazon loads (%) — if different')}
          </>
        )}
        {compType === 'weekly_flat' && num('weekly_amount', 'Weekly amount ($)', '0.01')}
        {compType === 'per_mile' && (
          <>
            {num('loaded_rate', 'Loaded rate ($/mi)', '0.01')}
            {num('empty_rate', 'Empty rate ($/mi)', '0.01')}
          </>
        )}
        {compType === 'hourly' && num('hourly_rate', 'Hourly rate ($)', '0.01')}
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
        Insurance
      </h3>
      <div className="flex flex-col gap-3">
        <Toggle label="Include Auto Liability" {...register('settings.include_auto_liability')} />
        <Toggle label="Include Cargo" {...register('settings.include_cargo')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {num('insurance_cargo_liability', 'Auto liability and cargo ($)')}
        </div>
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
        Weekly / monthly fees
      </h3>
      {/* Labels relabeled per company request; field keys unchanged
          (eld_device_weekly→Service, tablet_weekly→Tablet/month, prepass_monthly→IFTA). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {num('eld_device_weekly', 'Service / week ($)')}
        {num('tablet_weekly', 'Tablet / month ($)')}
        {num('prepass_monthly', 'IFTA / week ($)')}
        {num('administration_fee_weekly', 'Administration fee / week ($)')}
      </div>
      <p className="mt-2 text-xs text-mfleet-gray">
        Prepass is billed monthly according to toll-road usage.
      </p>

      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-mfleet-gray">
        Penalties
      </h3>
      <div className="flex flex-col gap-3">
        <Toggle
          label="Include Schedule A penalties page"
          {...register('settings.include_penalties')}
        />
        <p className="text-xs text-mfleet-gray">
          Uses this company&apos;s fine schedule. Edit the amounts on the company&apos;s page,
          or customize them just for this driver below.
        </p>
        {canCustomizeFines && (
          <Toggle
            label="Customize fine schedule for this application"
            checked={customizeFines}
            onChange={(e) => onCustomizeFinesChange(e.target.checked)}
          />
        )}
        {customizeFines && fineDraft && (
          <div className="mt-2 rounded-lg border border-gray-200 p-3">
            <FineScheduleEditor key={fineEditorKey} draft={fineDraft} />
          </div>
        )}

        <Toggle
          label="Include compact FINES & FEES schedule page"
          {...register('settings.include_fees')}
        />
        {canCustomizeFees && (
          <Toggle
            label="Customize fines & fees for this application"
            checked={customizeFees}
            onChange={(e) => onCustomizeFeesChange(e.target.checked)}
          />
        )}
        {customizeFees && feesDraft && (
          <div className="mt-2 rounded-lg border border-gray-200 p-3">
            <FeesScheduleEditor key={feesEditorKey} draft={feesDraft} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default ContractSettingsFields;
