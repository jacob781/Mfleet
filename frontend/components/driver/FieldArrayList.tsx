import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

interface Props {
  name: string;
  title?: string;
  addLabel: string;
  newItem: () => any;
  renderItem: (index: number) => React.ReactNode;
  emptyHint?: string;
}

const FieldArrayList: React.FC<Props> = ({ name, title, addLabel, newItem, renderItem, emptyHint }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: name as never });

  return (
    <div className="mb-6">
      {title && <h3 className="text-base font-semibold text-mfleet-gray-dark mb-2">{title}</h3>}
      {fields.length === 0 && emptyHint && (
        <p className="text-sm text-gray-400 mb-3">{emptyHint}</p>
      )}
      {fields.map((f, i) => (
        <div key={f.id} className="rounded-lg border border-gray-200 p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-sm text-red-600 underline min-h-8"
            >
              Remove
            </button>
          </div>
          {renderItem(i)}
        </div>
      ))}
      <button
        type="button"
        onClick={() => append(newItem())}
        className="w-full min-h-12 rounded-lg border-2 border-dashed border-mfleet-blue text-mfleet-blue font-medium"
      >
        + {addLabel}
      </button>
    </div>
  );
};

export default FieldArrayList;
