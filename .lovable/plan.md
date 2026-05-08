## Planned Workouts — Full System

Adds a second mode to the Workout tab without touching the Quick Workout flow, the active session screen, XP, or any existing visual language.

### 1. Database (Supabase migration)

Four new tables, all RLS-scoped to the owner via `plans.user_id`:

- `plans` — `id`, `user_id`, `name`, `created_at`, `updated_at`
- `plan_days` — `id`, `plan_id` (FK), `day_index`, `name` (nullable; null = use default "Day N")
- `plan_exercises` — `id`, `day_id` (FK), `exercise_id` (FK→exercises), `order_idx`
- `plan_sets` — `id`, `plan_exercise_id` (FK), `set_idx`, `weight` numeric, `reps` int

RLS: SELECT/INSERT/UPDATE/DELETE allowed only when the parent `plans.user_id = auth.uid()` (EXISTS subquery on each child table, mirroring the pattern already used for `workout_exercises`/`workout_sets`). `updated_at` trigger on `plans` reusing the existing `touch_updated_at()` function. Cascade deletes top-down.

### 2. Workout tab restructure

`src/routes/workout.index.tsx` becomes a shell that renders a segmented control + the active sub-tab. Two new components:

- `src/components/tabs/quick-workout-content.tsx` — the **current** `WorkoutContent` moved verbatim, no logic changes. Existing file `workout-content.tsx` re-exports for safety.
- `src/components/tabs/planned-workouts-content.tsx` — new list view.

Tab state lives in the parent and is preserved across switches (both children stay mounted with `hidden` toggling, so scroll position + search/filter state survive). Smooth crossfade via existing `animate-fade-up` / opacity transition. Default = Quick Workout.

Segmented control matches existing pill-button styling (border + `bg-primary` active state, same as muscle filters).

### 3. Planned Workouts list

Empty state: card with title "Build your training path.", subtitle, and a primary "Create Plan" CTA — uses the same `card-premium` + radial glow pattern as the "Forge today's battle" card.

Populated state: vertical list of plan cards. Each shows plan name, "X Days · Y Exercises", "Updated <relative date>", and two actions: **Start** (opens day picker sheet → launches session) and **Edit** (opens plan editor route). Card uses `card-premium` with subtle accent bar.

### 4. Routes

```
src/routes/workout.plans.new.tsx          # Create plan (name + day count)
src/routes/workout.plans.$planId.tsx       # Plan editor (days list)
src/routes/workout.plans.$planId.day.$dayId.tsx  # Day editor (exercises + sets)
```

All gated by auth redirect (same pattern as existing pages). Each renders inside `MobileShell`.

### 5. Create Plan flow

Single screen: text input for plan name (default "My Plan"), then "How many training days?" with chips `2 / 3 / 4 / 5 / 6 / Custom` (custom opens a number stepper 1–14). On confirm: insert `plans` + N `plan_days` rows with `day_index = i`, `name = null`. Navigate to plan editor.

### 6. Plan editor (`/workout/plans/$planId`)

- Editable plan name (inline, autosaves on blur).
- Vertical list of day cards: shows display name (custom or "Day N"), exercise count, tap → day editor.
- Each day card has overflow menu: **Rename**, **Duplicate Day** (copies exercises + sets to a new day at end), **Delete Day**.
- "Add Day" button at bottom — appends `day_index = max+1`, name null.
- Sticky bottom CTA: "Delete Plan" (with confirm) on a secondary action; primary CTA "Done" returns to list.

### 7. Day editor (`/workout/plans/$planId/day/$dayId`)

Top: editable day name (placeholder = "Day N"). Below: list of added exercises, each as a card with:

- Exercise name + muscle group badge.
- Sets table rows: `Set N | KG input | Reps input | × delete`.
- "Add set" button (defaults to copy of previous set or 0/0).
- Reorder handles (long-press / up-down arrows — keep simple: up/down chevrons to swap `order_idx`).
- Delete exercise button.

Default: 3 empty sets when an exercise is first added.

Below the list: a search bar + muscle filter chips + filtered exercise grid identical in look to Quick Workout. Tapping an exercise **adds** it to the day (idempotent: tap toggles add/remove just like Quick Workout, but here it persists immediately and seeds 3 sets).

Plus an action: **Copy exercises from another day** (sheet listing other days in this plan; copies exercises + sets).

All edits autosave (debounced ~400ms for KG/reps inputs; immediate for add/remove/reorder). Small "Saved" indicator near the header.

### 8. Starting a planned session

From plan card "Start" → bottom sheet listing days → pick day → calls a new `openWorkoutFromPlanDay(dayId)` in `src/lib/workout.ts`:

1. Reads `plan_exercises` + `plan_sets` for that day.
2. Inserts a new `workouts` row (same as `openWorkout`).
3. Inserts `workout_exercises` mirroring order.
4. Inserts `workout_sets` pre-filled with planned weight/reps, `completed = false`. If a planned exercise has zero sets, falls back to 3 blank sets (same as today).
5. Returns the draft and we navigate to `/workout/log`.

The active session screen, XP, timer, persistence, finalize flow, and summary tab are **unchanged**. The only difference is the seeded values.

### 9. Data layer

New file `src/lib/plans.ts` exporting:

```
listPlans, getPlan, createPlan, renamePlan, deletePlan,
addDay, renameDay, duplicateDay, deleteDay, reorderDays,
addPlanExercise, removePlanExercise, reorderPlanExercises, copyExercisesToDay,
addPlanSet, updatePlanSet, removePlanSet
openWorkoutFromPlanDay  // re-exported via workout.ts
```

All queries are direct Supabase calls from the client (matches the existing pattern in `workout.ts`); RLS enforces ownership.

### 10. Visual + UX guardrails

- Reuse existing tokens (`card-premium`, `shadow-glow`, `animate-fade-up`, primary/border/muted-foreground). No new colors.
- Mobile-first: same 360-width layout, sticky CTAs at bottom with the existing background-fade gradient.
- Tab switch: keep both panels mounted, fade between them (200ms). No router navigation, no scroll loss.
- All destructive actions go through a small confirm modal (reuse `alert-dialog` from shadcn).
- Nothing in Quick Workout, `/workout/log`, `/workout/complete`, profile, leaderboard, or progress is touched.

### 11. Order of work

1. Migration + types regen.
2. `src/lib/plans.ts` + `openWorkoutFromPlanDay`.
3. Tab shell + move existing content into Quick Workout sub-tab (verify nothing regresses).
4. Planned list + empty state + create flow.
5. Plan editor.
6. Day editor (with reused search/filters extracted into a small shared `<ExercisePicker>` component to avoid duplication).
7. Start-from-plan sheet wiring into existing session screen.
8. Smoke test: create plan → add days → add exercises + sets → start session → finish → confirm XP/achievements still work; refresh during planned session resumes correctly (existing persistence already handles this since it just reads the `workouts` row).

No edits to the active session, XP system, summary, or design tokens.