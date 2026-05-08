## What is wrong

The plan editor does have a day editor route, but the current UX makes it feel like nothing changed:

- New plans correctly create empty days, but there is no strong inline exercise setup flow on the plan screen.
- Tapping a day depends on route navigation, and if that route does not visibly present the picker or is blocked by the day menu overlay, the user sees no practical way to add exercises.
- Empty days are expected after plan creation, but they should immediately invite exercise selection, not feel like a broken state.

## Fix plan

1. Make each day row in the plan editor directly actionable
   - Keep the existing premium KAIROS design.
   - Make the whole day card clearly open exercise setup.
   - Add an explicit inline CTA for empty days: `Add exercises`.
   - Keep the three-dot day menu working separately for Rename, Duplicate, Delete.

2. Add an exercise picker directly inside the plan editor flow
   - When tapping an empty day, open a bottom sheet or focused setup panel for that day instead of leaving the user guessing.
   - The sheet will list exercises with search and muscle filters, matching the existing Quick Workout exercise selection style.
   - Tapping an exercise adds it to that day with default sets.
   - Added exercises immediately appear under that day without a page reload.

3. Keep the existing full day editor route as the advanced editor
   - The `/workout/plans/$planId/day/$dayId` page remains available for editing sets, reps, weight, reordering, copying from other days, and removing exercises.
   - After exercises are added from the quick sheet, the user can still tap into the full editor for detailed set work.

4. Refresh plan state after mutations
   - After adding/removing exercises, update the local plan state so the day count changes from `0 exercises` to the real count immediately.
   - Ensure newly created plans show empty days as expected, but with a clear way to fill them.

5. Do not change unrelated systems
   - No redesign.
   - No Quick Workout changes.
   - No database schema changes unless a runtime issue proves the existing tables/policies are blocking inserts.
   - Keep mobile-first, cinematic, clean, premium styling.

## Technical details

Files to update:

- `src/routes/workout.plans.$planId.tsx`
  - Add plan-editor exercise setup state.
  - Load available exercises from Supabase.
  - Add search/filter UI in a bottom sheet.
  - Call existing `addPlanExercise(dayId, exerciseId)` from `src/lib/plans.ts`.
  - Refresh the plan after adding exercises.

- `src/lib/plans.ts`
  - Reuse existing helpers where possible.
  - Only adjust if needed for better return data or safe refresh behavior.

- `src/components/tabs/planned-workouts-content.tsx`
  - Keep current Quick/Planned integration.
  - Only adjust if the plan card needs a clearer `Set up` path after the editor improvement.

Expected result:

```text
Create plan
  -> Plan opens with Day 1, Day 2, Day 3
  -> Tap Day 1 / Add exercises
  -> Exercise picker opens immediately
  -> Tap Bench Press
  -> Day 1 now shows 1 exercise
  -> Open full day editor to edit sets/reps/weight
```