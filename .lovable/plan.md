## Fixes for workout flow

### 1. "Start workout" CTA appears off to the right

**Root cause:** the CTA uses `fixed bottom-20 left-1/2 -translate-x-1/2`, but its containing block ends up being the swipeable tabs strip in `TabsShell`, which has a `transform` applied. CSS spec: any ancestor with `transform`/`will-change: transform` becomes the containing block for `fixed` descendants. So `left-1/2` is 50% of the 5×viewport-wide strip (translated by -100% on the Workout panel), pushing the button hundreds of pixels to the right.

**Fix:** in `src/components/tabs/workout-content.tsx`, replace the `fixed` overlay with a `sticky bottom-4` block placed at the end of the panel content. Add bottom padding to the exercise list so the sticky CTA never covers the last card. The button stays glued to the bottom of the visible scroll area without depending on viewport-fixed positioning.

### 2. Session-start transition is glitchy and lets the page scroll

**Root cause:** `SessionIntro` is a translucent overlay (`bg-background/70 backdrop-blur-sm`) but the underlying `/workout/log` content is mounted, scrollable, and toggled via `opacity-0 → opacity-100`. During the 2.85s splash the user can scroll the partially-visible content, and the abrupt show/hide with no easing creates the "glitchy" feel.

**Fix:** in `src/routes/workout.log.tsx` and `src/components/session-intro.tsx`:
- While `intro` is true, lock scrolling on the document (toggle `overflow: hidden` on `<html>`/`<body>` and disable touch on the page wrapper).
- Make the splash a fully opaque solid panel (no peeking through) and crossfade it with `transition-opacity duration-500 ease-out` instead of an instant unmount. The log content fades up only once the splash is fully gone.
- Slightly shorten the splash (≈1.6s) and stagger the headline/subtitle entry so the handoff to the session UI feels intentional.

### 3. Active session and summary do not survive a page refresh

**Root cause:** the timer's `startedAt` is a `useRef`, the picked exercises live in `sessionStorage`, and set rows live in component state. Reload wipes all of that. The summary page (`/workout/complete?id=…`) does refetch from DB, but only after the workout has been finalised — there is no persisted "in-progress" session to resume.

**Fix — persist the live session server-side (no schema changes needed; existing tables support it):**

- On entering `/workout/log`:
  - Look up an existing open workout for this user (`finished_at IS NULL`, most recent). If found, resume it: load its `started_at`, `workout_exercises` (joined to exercise name/muscle), and `workout_sets` to rebuild `entries`. Skip the intro splash on resume.
  - Otherwise, read picked IDs from `sessionStorage`, create a `workouts` row with `started_at = now()` and `finished_at = null`, insert `workout_exercises` for each picked exercise, and seed 3 placeholder `workout_sets` per exercise (`completed=false`, weight 0, reps 0). Clear the `sessionStorage` key.
- Drive `SessionTimer` from the persisted `started_at` (ISO string) instead of an in-memory ref so refresh keeps counting from the real start.
- When the user edits a set or toggles "done", debounce-update that `workout_sets` row (weight/reps/completed). When the user adds a set, insert a new `workout_sets` row.
- "Complete Session" updates the existing workout: set `finished_at = now()` and `xp_earned`, then run the existing post-finish logic (XP/streak/achievements). Refactor `finishWorkout` in `src/lib/workout.ts` into:
  - `openWorkout(pickedIds)` — creates draft workout + exercises + placeholder sets; returns the loaded shape.
  - `loadOpenWorkout()` — returns the current draft (or null) with exercises and sets.
  - `updateDraftSet(setId, patch)` and `addDraftSet(workoutExerciseId)` — persist edits live.
  - `finalizeWorkout(workoutId)` — re-reads completed sets from DB, computes XP/streak/achievements, sets `finished_at`, updates `profiles`, returns the existing `FinishResult`.
- The "Cancel"/back arrow does not delete the draft, so navigating away and back resumes the same session. (Optional follow-up: add a small "Discard session" action; not part of this change unless requested.)

**Summary page survives refresh:** because the workout row + sets now exist from session start, `/workout/complete?id=…` will keep working after refresh exactly as today. Verify the page does not redirect away when `useAuth` is still loading — guard the `if (!loading && !user)` redirect so it does not fire while auth is hydrating, and only navigate to `/` if the workout truly doesn't belong to the user.

### Files touched

- `src/components/tabs/workout-content.tsx` — sticky CTA, layout padding.
- `src/components/session-intro.tsx` — opaque background, smoother fade, scroll lock helper.
- `src/routes/workout.log.tsx` — resume/open draft on mount, drive timer from DB `started_at`, persist set edits, scroll lock during intro, skip intro on resume.
- `src/routes/workout.complete.tsx` — tighten auth-loading guard so refresh never bounces to `/`.
- `src/lib/workout.ts` — split into `openWorkout` / `loadOpenWorkout` / `updateDraftSet` / `addDraftSet` / `finalizeWorkout`; keep `FinishResult` shape.

### Out of scope (won't change unless asked)

- No DB migrations: existing `workouts.finished_at` nullable + `workout_sets.completed` already supports drafts. RLS already restricts to the owning user.
- No change to XP formula, achievements, or the complete-page UI.
