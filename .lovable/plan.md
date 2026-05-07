# Accurate Calorie Estimate

Replace the placeholder `workouts × 285 kcal` with a real MET-based estimate that uses the user's bodyweight and actual session duration.

## 1. Database

Add a `weight_kg` column to `profiles` (nullable numeric). No default — null means "not entered yet" so the UI can prompt the user.

## 2. Calorie formula

Standard MET formula:

```text
kcal = MET × weight_kg × duration_hours
```

- MET = **5.0** (resistance training, moderate effort — ACSM Compendium of Physical Activities reference value)
- `duration_hours` = `(finished_at − started_at) / 3600` per workout, summed across the relevant range
- Only count workouts that have a `finished_at`

Helper lives in `src/lib/calories.ts`:
- `estimateCalories(weightKg, durationSeconds): number`
- `METS_STRENGTH = 5.0` constant (single source of truth)

## 3. Profile page — weight input

Add a new "Body weight" row in the Profile menu section (above Stats):
- Shows current weight in kg, or "Not set" if null
- Tapping opens a small dialog/sheet to enter weight (numeric input, kg, range 30–300)
- Saves to `profiles.weight_kg` via `supabase.from('profiles').update(...)`
- `useProfile` hook returns the new field automatically once types regenerate

## 4. Where calories appear

Replace the placeholder in three places. Behavior in each:

**a. Home (`src/routes/index.tsx`)** — third stat tile
- If `profile.weight_kg` is null: tile shows "Set weight in profile" (small text, tappable, links to `/profile`)
- If set: shows total lifetime kcal from all completed workouts, with a tiny "*est." caption under the number

**b. Progress (`src/routes/progress.tsx`)** — Calories Tile
- Same behavior. Compute from the lifetime workout durations already fetched (we already sum `totalSecs`).
- If weight set: `kcal = 5 × weight_kg × (totalSecs / 3600)`
- If not: tile renders "Add weight in profile →" linking to `/profile`

**c. Workout summary (`src/routes/workout.complete.tsx`)** — add a new "Calories" row in the Summary card, between Volume and the level bar
- If weight set: `≈ N kcal` for that one session's duration
- If not: row reads "Set weight in profile to track" with a small link

## 5. Disclaimer

A single small caption is added once on each screen near the calorie value:
> *Estimate only — based on your weight & session duration.*

Styled as `text-[10px] text-muted-foreground italic`. Not repeated per tile if multiple are visible.

## Files touched

- migration: add `weight_kg numeric` to `profiles`
- new: `src/lib/calories.ts`
- edit: `src/routes/profile.tsx` (weight editor row + dialog)
- edit: `src/routes/index.tsx` (Calories StatCard logic)
- edit: `src/routes/progress.tsx` (Calories Tile logic + use durations)
- edit: `src/routes/workout.complete.tsx` (Calories summary row)

## Out of scope

- No per-exercise MET tuning (cardio vs strength) — single MET=5.0 for now
- No height / age / sex / heart-rate inputs
- No unit toggle (lb/kg) — kg only
- No redesign of any screen; only the calorie tile/row content changes
