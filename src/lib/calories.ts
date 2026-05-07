// MET-based calorie estimate.
// Reference: ACSM Compendium of Physical Activities — resistance training.
// Heavy strength (low reps) ≈ 6.0 MET, moderate hypertrophy ≈ 5.0 MET,
// light/endurance (high reps, circuits) ≈ 3.5 MET.
export const METS_STRENGTH = 5.0;

export function metForAvgReps(avgReps: number | null | undefined): number {
  if (!avgReps || !Number.isFinite(avgReps) || avgReps <= 0) return 5.0;
  if (avgReps < 6) return 6.0;
  if (avgReps <= 12) return 5.0;
  return 3.5;
}

export function intensityLabel(met: number): string {
  if (met >= 6.0) return "Heavy";
  if (met >= 5.0) return "Moderate";
  return "Light";
}

/** kcal = MET × weight_kg × hours. Defaults to MET 5.0. */
export function estimateCalories(weightKg: number, durationSeconds: number): number {
  return estimateCaloriesWithMet(weightKg, durationSeconds, METS_STRENGTH);
}

export function estimateCaloriesWithMet(
  weightKg: number,
  durationSeconds: number,
  met: number,
): number {
  if (!weightKg || weightKg <= 0 || !durationSeconds || durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours);
}

export function estimateCaloriesFromSession(
  weightKg: number,
  durationSeconds: number,
  avgReps: number | null,
): { kcal: number; met: number } {
  const met = metForAvgReps(avgReps);
  return { kcal: estimateCaloriesWithMet(weightKg, durationSeconds, met), met };
}

export interface WorkoutForCalories {
  started_at: string;
  finished_at: string | null;
  totalReps: number;
  setsCount: number;
}

/** Sum kcal across many workouts, choosing MET per-workout from rep ranges. */
export function sumWorkoutCalories(rows: WorkoutForCalories[], weightKg: number): number {
  if (!weightKg || weightKg <= 0) return 0;
  let total = 0;
  for (const w of rows) {
    if (!w.finished_at) continue;
    const secs = Math.max(
      0,
      (new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 1000,
    );
    if (secs <= 0) continue;
    const avgReps = w.setsCount > 0 ? w.totalReps / w.setsCount : null;
    total += estimateCaloriesWithMet(weightKg, secs, metForAvgReps(avgReps));
  }
  return total;
}

export const CAL_DISCLAIMER = "Estimate only — based on your weight & session duration.";
