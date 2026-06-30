// Employment gaps are computed in ONE place — the backend (pdf_service.employment_gaps,
// exposed via POST /api/form/{token}/employment-gaps). The frontend never recomputes them,
// so there's no chance of the UI and the PDF disagreeing.

export interface Gap {
  from: string; // ISO YYYY-MM-DD
  to: string;
}

// Stable key tying a gap to its explanation, identical to the backend's f"{from}_{to}".
export const gapKey = (g: Gap) => `${g.from}_${g.to}`;
