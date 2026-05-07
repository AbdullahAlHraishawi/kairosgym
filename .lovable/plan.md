## Three issues in `src/routes/workout.log.tsx`

### 1. Session starts behind the intro animation

`SessionIntro` covers the screen for ~2850ms, but `startedAtRef` is initialized to `Date.now()` at mount and exercises are fetched immediately, so the timer is already counting and work happens behind the splash.

**Fix:**
- Add `intro` state (`true` initially). `SessionIntro` calls `onDone` → `setIntro(false)`.
- Don't set `startedAtRef.current` at mount. Set it inside the `onDone` handler so the clock starts when the intro finishes.
- Gate the exercise-fetch `useEffect` on `!intro` (or kick it off inside `onDone`) so loading happens during/after the splash without affecting the visible timer.
- Render the session content (header/timer/exercises/CTA) only once `intro` is false to avoid the timer flashing 00:00 behind the overlay.

### 2. Level-up animation fires on session start

`prevLevelRef` is seeded with `lp.level` computed from `liveTotalXp = (baseXp ?? profile?.total_xp ?? 0) + sessionXp`. On first render `baseXp` is null and `profile` is undefined, so `prevLevelRef` starts at 0. When `profile` then loads with the user's real XP, `lp.level` jumps from 0 → real level and the level-up effect triggers (bar fill + LEVEL UP overlay) even though no XP was earned.

**Fix:**
- Initialize `prevLevelRef` lazily: leave it `null` until `baseXp` is set, then seed it to the level computed from `baseXp`.
- In the level-up `useEffect`, bail out if `prevLevelRef.current === null` (just record the current level and return).
- This guarantees the overlay only fires for level transitions caused by completed sets in this session.

### 3. Black screen between Complete Session tap and summary

`completeSession` sets `exiting=true` (fades content + CTA to `opacity-0` over 300ms), then awaits `finishWorkout`, then waits 350ms before navigating. If `finishWorkout` takes a noticeable amount of time, the user stares at a black `MobileShell` because everything inside is faded out and nothing else is rendered.

**Fix:**
- While `exiting` is true, render a centered loading overlay inside `MobileShell` (above the faded content): a pulsing/spinning Flame or ring with "Saving session…" caption, using existing primary color and glow tokens.
- Remove the artificial `setTimeout(..., 350)` delays — navigate as soon as `finishWorkout` resolves (the destination route mounts immediately; the fade is no longer load-bearing). Keep the short delay only on the empty-session early return so the fade still feels intentional there.
- Net effect: if save is fast, user sees a brief fade → summary. If save is slow, user sees the loading indicator instead of a blank screen.

### Out of scope

Summary route, XP math, set/rep logic, navigation targets, intro animation visuals.
