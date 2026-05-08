## Problem

The Workout bottom-nav tab is rendered by `src/components/tabs-shell.tsx`, which directly mounts `WorkoutContent` in its `PANELS` array. The segmented Quick/Planned switch I added lives in the route file `src/routes/workout.index.tsx`, but that route component is never reached when the user taps the Workout tab — `TabsShell` swipes between content components and bypasses the route's component entirely.

That's why the Workout tab still looks untouched: only `WorkoutContent` (Quick) is shown, and `PlannedWorkoutsContent` is unreachable.

## Fix

Move the segmented switch into a panel-level component that `TabsShell` can mount, so it renders inside the same swipe strip as the other tabs.

### Steps

1. Create `src/components/tabs/workout-tabs-panel.tsx` containing the segmented Quick/Planned switch + both `WorkoutContent` and `PlannedWorkoutsContent` mounted (current logic moved over verbatim from `workout.index.tsx`).
2. In `src/components/tabs-shell.tsx`, swap the `/workout` panel render from `<WorkoutContent />` to `<WorkoutTabsPanel />`.
3. Simplify `src/routes/workout.index.tsx` to also render `<WorkoutTabsPanel />` so direct `/workout` URL visits still work and stay consistent.

No DB or business-logic changes. Quick Workout and Planned Workouts behavior remain exactly as built; this only fixes the mount point so the segmented control actually appears.