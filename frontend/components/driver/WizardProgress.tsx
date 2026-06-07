import React from 'react';

interface Props {
  steps: string[];
  current: number; // 0-based
}

const WizardProgress: React.FC<Props> = ({ steps, current }) => {
  const pct = Math.round(((current + 1) / steps.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-mfleet-blue">{steps[current]}</span>
        <span className="text-xs text-gray-500">Step {current + 1} of {steps.length}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-mfleet-blue transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default WizardProgress;
