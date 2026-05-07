## Live XP feedback in active session

Keep all current KAIROS visuals. No redesign. Add live XP progress to the active workout session, with real persistence so the home/profile level reflects gains.

### 1. Real level math (100 XP / level)

Update `src/lib/xp.ts`:
- `levelFromXp(xp)` → `Math.floor(xp / 100)` (linear, matches "100 XP = next level").
- `xpForLevel(level)` → `level * 100`.
- `levelProgress` math stays the same shape (level, xpInLevel, span=100, progress).
- Keep `XP_PER_WORKOUT` / `XP_PER_SET` exports (still used by `finishWorkout` legacy path) but they will become unused after step 3 — leave for back-compat unless removal is trivial.

### 2. Per-set XP rule (single source of truth)

Add `xpForSet(reps)` in `src/lib/xp.ts`:
- `reps > 0` → `reps + 5`
- `reps <= 0 || empty` → `5`

### 3. Sticky session header in `src/routes/workout.log.tsx`

Wrap the top bar + hero (timer, subtitle) and a new XP block in a `sticky top-0 z-20` container with `bg-background/85 backdrop-blur` and a soft bottom border, so it stays pinned while exercises scroll.

New XP block under the timer:
- Line 1: `LEVEL {n}` (small uppercase tracked label, primary tint).
- `<XpBar progress={...} animateKey={liveXp} />` reused from existing component (already has red glow / animate-xp-fill).
- Line 2: `{xpInLevel} / 100 XP` tabular-nums, muted.
- On level-up: brief "LEVEL UP" pill (uses existing `animate-fade-up` + `shadow-glow` + `animate-glow` for red pulse) shown for ~1.6s inside the sticky header. No navigation.

### 4. Live XP state + animation

In `LogPage`:
- Track `sessionXp` (sum of XP from currently-completed sets) derived from `entries` via `useMemo` — guarantees toggling a set off subtracts XP automatically (idempotent, no double-award on re-tap).
- Track `baseXp` = the user's `profile.total_xp` snapshot taken once on mount (via `useProfile`).
- `liveTotalXp = baseXp + sessionXp` → feed into `levelProgress` for the sticky bar.
- Detect level-up by comparing previous vs current `levelFromXp(liveTotalXp)` in a `useEffect` → trigger the LEVEL UP pulse + a one-shot red glow class on the XP bar wrapper.

Floating "+XP" near the set:
- New tiny component `XpFloater` (or inline) rendered absolutely inside `SetRow`'s wrapper when a set transitions `done: false → true`. Uses existing tokens: `text-primary`, `font-black`, `drop-shadow-[0_0_12px_var(--primary-glow)]`, `animate-fade-up` rising ~28px and fading out over 900ms, then unmounts.
- Implementation: `SetRow` receives optional `floatXp?: number | null` prop and an `onFloatDone` callback; parent sets it when toggling done=true with the computed XP for that set, clears after animation.

### 5. Persist XP on session complete

`completeSession` currently just navigates home. Update it to:
- Call a new lightweight `persistSessionXp(sessionXp)` in `src/lib/workout.ts` (or inline in route) that:
  - Reads current profile `total_xp`, writes `total_xp = total_xp + sessionXp`, `level = levelFromXp(newTotal)`.
  - Updates `last_workout_date` + streak (reuse existing logic from `finishWorkout`).
  - Does NOT yet write `workouts` / `workout_exercises` / `workout_sets` rows or unlock achievements (out of scope per user — "no post-workout summary / achievements yet"). Existing `finishWorkout` stays available but we won't call it from this screen yet.
- Then navigate home so the home screen's level/XP bar reflects the new value.

This makes the live XP "real": what the user sees during the session is exactly what gets saved.

### 6. Out of scope (explicit)

- No post-workout summary screen.
- No achievements logic.
- No rest timer.
- No layout/color/typography changes anywhere else.
- No changes to `SessionIntro`, `XpBar`, or global styles beyond what's above.

### Files touched

- `src/lib/xp.ts` — linear level math + `xpForSet`.
- `src/lib/workout.ts` — add `persistSessionXp`.
- `src/routes/workout.log.tsx` — sticky header, XP state, level-up pulse, persist on complete.
- `src/components/set-row.tsx` — optional `+XP` floater overlay.
