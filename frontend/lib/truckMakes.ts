// Shared tractor makes — used by the driver equipment step and the admin Vehicles form.
// "Other" reveals a free-text box; the selected/typed name is the source of truth.
export const TRUCK_MAKES = [
  'FREIGHTLINER',
  'VOLVO',
  'KENWORTH',
  'INTERNATIONAL',
  'WESTERN STAR',
  'PETERBILT',
] as const;

// Equipment type — for owner-operators it's a tractor ("Truck") 99% of the time,
// occasionally their own trailer; "Other" reveals a free-text box for anything else.
export const TRUCK_TYPES = ['Truck', 'Trailer'] as const;
