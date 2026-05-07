// MET-based calorie estimate.
// Reference: ACSM Compendium of Physical Activities — resistance training,
// general/moderate effort ≈ 5.0 MET.
export const METS_STRENGTH = 5.0;

/**
 * Estimate kcal burned given bodyweight (kg) and duration (seconds).
 * Formula: kcal = MET × weight_kg × duration_hours
 */
export function estimateCalories(weightKg: number, durationSeconds: number): number {
  if (!weightKg || weightKg <= 0 || !durationSeconds || durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;
  return Math.round(METS_STRENGTH * weightKg * hours);
}

export const CAL_DISCLAIMER = "Estimate only — based on your weight & session duration.";
