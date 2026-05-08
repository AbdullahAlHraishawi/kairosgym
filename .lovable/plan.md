## Problem

Tapping a day "does nothing" because of the Start flow on plans with empty days:

- On the Planned tab, each plan card has two CTAs: a primary `Start` button and a secondary `Edit` button.
- Tapping `Start` opens a bottom sheet listing the plan's days.
- Each day in that sheet is rendered as a `<button>` that is **`disabled` whenever `exerciseCount === 0`**.
- A freshly created plan has all empty days, so every day in the sheet is unresponsive — exactly the "nothing happens" symptom.

The day rows inside the actual plan editor (`/workout/plans/$planId`) already work correctly as `<Link>`s to the day editor. The bug is only in the Start sheet UX, which doesn't give users a way to reach the day editor from there.

## Fix

In `src/components/tabs/planned-workouts-content.tsx`, make the Start sheet handle empty days gracefully instead of silently disabling them:

1. Keep days with exercises as "Start" buttons (current behavior, launches the session).
2. For days with `exerciseCount === 0`, render the row as a `<Link>` to `/workout/plans/$planId/day/$dayId` with a clear "Add exercises" label and a pencil icon (instead of a disabled play button). Tapping navigates to the day editor and closes the sheet.
3. Drop the blanket `disabled` state so every day row is always actionable.

Optional small polish (same file, no design change):
- When the user has a plan but it has zero exercises across all days, change the primary CTA on the plan card from `Start` to `Set up` that links straight to the plan editor — this prevents the dead-end Start sheet for brand-new plans.

No DB or business-logic changes. No changes to the Quick Workout flow, the plan editor, or the day editor.

## Files touched

- `src/components/tabs/planned-workouts-content.tsx` — update Start-sheet day rows + (optional) plan-card CTA logic for empty plans.
