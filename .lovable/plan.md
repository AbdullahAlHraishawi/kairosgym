## Goal

Replace the current "press Complete Session → fade → home" behavior with a cinematic post-workout summary screen, and persist the workout properly so Home and Progress reflect the new totals.

## Flow

```text
Active session  ──press COMPLETE──▶  fade + red glow pulse
        │
        ▼
   Save workout (finishWorkout) — completed sets only
        │
        ▼
  /workout/complete?id=<workoutId>   (cinematic SESSION COMPLETE screen)
        │
        ▼
   RETURN HOME → /
```

## 1. Persist the workout on completion

In `src/routes/workout.log.tsx → completeSession`:
- Build a `LoggedExercise[]` from `entries`, including only sets where `done === true` AND `reps > 0`.
- If there are zero completed sets, just navigate home (nothing to save).
- Replace `persistSessionXp(sessionXp)` with `finishWorkout(loggedExercises)`. `finishWorkout` already inserts the workout, exercises, sets, updates XP/level/streak, and returns `xpEarned`, `newTotalXp`, `newLevel`, `leveledUp`, `newStreak`. It also returns the inserted workout id — we'll extend it to return that.
- Guard against double-submit with a `submittingRef` so the button can't fire twice (also covers "do not allow same session completed twice").
- Clear `kairos_picked` from sessionStorage after success.
- Navigate to `/workout/complete` with the new `workoutId` in search params; the summary screen fetches everything from the DB so values are authoritative.

Small change to `src/lib/workout.ts`:
- Add `workoutId: string` to `FinishResult` and return `workout.id` from `finishWorkout`.
- No other logic changes (we still skip achievements per scope; the existing achievement code already runs but no new UI is added).

## 2. New route: `src/routes/workout.complete.tsx`

Mobile-only screen, KAIROS dark + red glow style, no bottom nav (`<MobileShell hideNav>`), full cinematic entry.

Loader/data:
- Read `?id=<workoutId>` via `Route.useSearch()`.
- Fetch in parallel:
  - `workouts` row (started_at, finished_at, xp_earned)
  - `workout_exercises` (count) joined to `workout_sets` (weight, reps, completed=true) for that workout
  - current `profiles` row (level, total_xp)
- If `id` missing or workout not found → redirect to `/`.

Computed values (from completed sets only — `completed = true`):
- Duration = `finished_at − started_at`, formatted `MM:SS` (or `HH:MM:SS` if ≥1h).
- Exercises = number of `workout_exercises` rows that have ≥1 completed set.
- Sets = count of completed sets.
- Reps = sum of `reps`.
- Volume = sum of `weight * reps`, formatted with thousands separators + " kg".
- XP earned = `workouts.xp_earned`.
- Level progress = `levelProgress(profile.total_xp)` from existing `@/lib/xp`.

Layout (top → bottom):

1. **Header band** — small "SESSION COMPLETE" eyebrow + rotating subtitle.
   - Subtitles array (cycled deterministically per completion using `workoutId` hash so it's stable on re-render but varies per workout):
     - "Discipline logged. Progress earned."
     - "Reps counted. Limits pushed."
     - "Another step. Another rep. Another rank."
     - "The work is done. The gain remains."
     - "Strength compounds. Today counted."
     - "Sweat banked. Story written."
2. **XP reward block** — large centered `+{xp} XP`, glowing red, count-up animation from 0 → xp over ~900ms (`requestAnimationFrame`, ease-out). Reuses existing primary-glow text-shadow + `animate-glow` style.
3. **Summary card** — `card-premium` rounded-2xl. Five rows, each: small uppercase label left, tabular-num value right. NOT a table — just spaced flex rows with subtle dividers via `border-border/40`.
   - Duration / Exercises / Sets / Reps / Volume
4. **Level progress block** — same look as in active session header:
   - "LEVEL {n}" eyebrow + `xpInLevel / span XP` on the right.
   - `<XpBar progress={lp.progress} />` animating from 0 → real progress on mount (one-shot).
5. **Bottom CTA** — sticky-style primary button "RETURN HOME" with the same `bg-primary shadow-glow animate-glow` styling as Complete Session. Uses `<Link to="/">`.

Animations:
- Container `animate-fade-up` on mount.
- Background red radial flare behind the XP number using the existing `animate-level-flare` keyframe (subtle, lower opacity).
- XP number count-up via local `useEffect` + rAF.
- XP bar fills smoothly from 0 to current progress on mount (uses existing 700ms transition in `XpBar`).

## 3. Home + Progress data refresh

`finishWorkout` already writes `total_xp`, `level`, `streak`, `last_workout_date` on `profiles` and inserts rows into `workouts` / `workout_exercises` / `workout_sets`. So Home and Progress will reflect new values as soon as their queries re-run on mount.

Verify the read paths and add anything missing:
- `src/routes/index.tsx` (Home): re-check the queries that drive total workouts, weekly XP, today's progress, streak. They should query `workouts` + `profiles`. If any are currently driven by hard-coded stubs, swap to live queries:
  - total workouts: `count(*) from workouts where user_id = me and finished_at not null`
  - weekly XP: `sum(xp_earned) from workouts where user_id = me and finished_at >= start_of_week`
  - today's progress: same but `finished_at::date = today`
  - streak: read `profiles.streak`
- `src/routes/progress.tsx`:
  - weekly XP chart: group `workouts` by day for the last 7 days, sum `xp_earned`.
  - lifetime stats: workouts count + sum of sets/reps/volume by joining `workout_exercises` → `workout_sets` where `completed = true`. If "sets / reps / volume" rows are not currently shown, add them to the existing lifetime stats list using the same card style — no redesign.

I'll inspect both files during implementation and only patch the data sources / add missing rows. No layout redesign of Home or Progress.

## 4. Active-session button transition

Keep the existing `setExiting(true)` fade. After `finishWorkout` resolves, navigate to `/workout/complete?id=…` instead of `/`. On error, show a console error and navigate home as a fallback (current behavior).

## Out of scope
- Achievements UI (server still records them silently via existing logic).
- PR detection.
- Social / share.
- Rest timer.
- Any redesign of XP bar, set rows, bottom nav, colors, fonts, or active session layout.

## Files touched

- `src/lib/workout.ts` — add `workoutId` to `FinishResult`, return `workout.id`.
- `src/routes/workout.log.tsx` — swap `persistSessionXp` for `finishWorkout`, double-submit guard, navigate to `/workout/complete?id=…`.
- `src/routes/workout.complete.tsx` — NEW cinematic summary screen.
- `src/routes/index.tsx` — verify/wire live workout stats (only if currently stubbed).
- `src/routes/progress.tsx` — verify weekly XP chart sources from `workouts.xp_earned`; add lifetime sets/reps/volume rows if missing.
