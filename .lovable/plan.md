# Auto-derived calorie intensity from sets/reps

Upgrade the calorie estimate so MET is chosen per-session based on how the user actually trained (rep ranges), instead of a flat 5.0.

## Intensity rule

For each completed session, compute the **average reps per completed set** across all exercises:

- avg reps **< 6** → heavy strength → **MET 6.0**
- avg reps **6–12** → hypertrophy / moderate → **MET 5.0**
- avg reps **> 12** → endurance / light → **MET 3.5**
- no completed sets → fall back to **MET 5.0**

Formula stays:
```text
kcal = MET × weight_kg × duration_hours
```

This uses data we already store (`workout_sets.reps`, `completed`) — no new columns, no extra UI taps.

## Code changes

**`src/lib/calories.ts`**
- Add `metForAvgReps(avgReps: number | null): number` returning 6.0 / 5.0 / 3.5 / 5.0.
- Add `estimateCaloriesFromSession(weightKg, durationSeconds, avgReps)` that picks MET then calls the existing math.
- Keep existing `estimateCalories(weight, secs)` (defaults to MET 5.0) for places where we don't have set data.

**`src/routes/workout.complete.tsx`**
- Already fetches completed sets. Compute `avgReps = totalReps / setsCount` and pass to `estimateCaloriesFromSession`.
- Add a small label under the calorie value: `Heavy · MET 6.0` / `Moderate · MET 5.0` / `Light · MET 3.5` so the user understands why the number is what it is. Styled `text-[10px] text-muted-foreground tracking-widest`.

**`src/routes/progress.tsx` (lifetime Calories tile)**
- Currently sums total seconds only. Switch to summing **per-workout kcal**:
  - Fetch each workout's `started_at`, `finished_at`, plus its completed sets' `reps`.
  - For each workout: compute its own avg reps → its own MET → its own kcal. Sum across all workouts.
- Same conditional "Set weight" prompt when `weight_kg` is null.

**`src/routes/index.tsx` (home Calories stat)**
- Same per-workout aggregation as Progress. Reuse the same query shape.
- Extract the per-workout-kcal aggregation into a small helper in `src/lib/calories.ts` (`sumWorkoutCalories(rows, weightKg)`) so Home and Progress share it.

## What stays the same

- Profile body-weight editor and gating logic — unchanged.
- Disclaimer text — unchanged.
- DB schema — unchanged. No migration.
- All other UI (level card, summary card layout, bottom nav, etc.) — untouched.

## Out of scope

- Per-exercise MET (cardio vs compound vs isolation).
- Volume bonus / mechanical work term — declined per choice.
- Heart rate, RPE, rest-time tracking.
- Unit toggle (kg only).

## Files touched

- edit `src/lib/calories.ts` — add intensity helper + per-workout aggregator
- edit `src/routes/workout.complete.tsx` — pass avg reps, show intensity tag
- edit `src/routes/progress.tsx` — per-workout kcal aggregation
- edit `src/routes/index.tsx` — per-workout kcal aggregation
