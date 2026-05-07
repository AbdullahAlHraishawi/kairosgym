## Two bugs in the post-session summary

### 1. Duration shows `00:00`

Cause: `finishWorkout` inserts a new `workouts` row without passing the actual session start time. The DB column `started_at` defaults to `now()`, and `finished_at` is also set to `now()` in the same call — so end − start ≈ 0 ms.

Fix:
- `src/lib/workout.ts` — add an optional `startedAt: Date` parameter to `finishWorkout` and include `started_at: startedAt.toISOString()` in the `workouts` insert payload.
- `src/routes/workout.log.tsx` — pass `new Date(startedAtRef.current)` to `finishWorkout(logged, startedAt)`. (`startedAtRef` is already captured at session mount.)

### 2. XP shows 130 instead of ~45

Cause: two different XP formulas are in use.

- Live session bar / floaters use `xpForSet(reps) = reps + 5` (from `src/lib/xp.ts`).
- `finishWorkout` (server save) uses `XP_PER_WORKOUT (100) + totalSets * XP_PER_SET (10)` — completely ignores reps. For 3 sets that's `100 + 30 = 130`, exactly what you saw.

The summary screen reads `workouts.xp_earned`, so the persisted (wrong) value wins.

Fix: make `finishWorkout` use the same per-set formula the live UI uses, so what the user sees during the session matches what is stored and shown on the complete screen.

- `src/lib/workout.ts`:
  - Replace `const xpEarned = XP_PER_WORKOUT + totalSets * XP_PER_SET;`
  - With: sum of `xpForSet(set.reps)` across all completed sets in `validEx`.
  - Drop the unused `XP_PER_WORKOUT` / `XP_PER_SET` imports.

This makes the three sets at 12/10/8 reps award `17 + 15 + 13 = 45 XP`, matching the in-session preview.

### Out of scope
No UI redesign, no changes to the active session layout, level-up animation, bottom nav, or summary card visuals. Logic-only fix in `workout.ts` plus a one-line argument in `workout.log.tsx`.
