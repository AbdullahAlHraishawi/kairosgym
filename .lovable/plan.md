## Active Workout Session — Phase 1

Replace the current spreadsheet-style `/workout/log` screen with a cinematic, card-based ACTIVE SESSION UI. Add a brief "SESSION STARTED" intro overlay when entering the session. Keep all existing KAIROS tokens, shadows, glow utilities, and mobile shell.

No XP, no achievements, no rest timers, no DB writes in this phase.

---

### Flow

1. User picks exercises on `/workout` and presses **START WORKOUT** (existing button — unchanged behavior, still navigates to `/workout/log`).
2. `/workout/log` mounts → plays **SESSION STARTED** overlay (~1s) with fade + red glow pulse, then reveals the session screen.
3. Session timer starts at `00:00` and counts up.
4. User fills weight/reps and taps **COMPLETE** per set; completed sets get a persistent red-glow state.
5. Sticky bottom button **COMPLETE SESSION** → fades out, navigates back to `/` (no save logic this phase).

---

### Screen layout (`/workout/log`, full rewrite, mobile-only)

**Top section**
- Small back chevron (top-left), kept minimal
- Workout name in display type, derived from dominant muscle group of picked exercises (e.g. "ARM DAY", "LEG DAY", "CHEST DAY", fallback "TRAINING DAY")
- Session timer `MM:SS` in large tabular-nums, red-glow accent
- Rotating motivational subtitle (picked once per session from a small list: "Forge your limits.", "Stay disciplined.", "Earn every rep.")

**Exercise session cards** (one per picked exercise)
- `card-premium` style with red edge glow
- Exercise name (bold, uppercase tracked) + muscle group label
- Vertical stack of SET rows (no grid headers, no table feel):
  - "SET 1" label chip on the left
  - Weight input (large, pill-shaped, kg suffix)
  - Reps input (large, pill-shaped, reps suffix)
  - **COMPLETE** pill button on the right
- Tapping COMPLETE: button morphs to a filled red state with check icon + glow; row gets a subtle red tint and a left red accent bar; tap again to undo
- "+ ADD SET" ghost button at the bottom of each card

**Sticky bottom action**
- Full-width **COMPLETE SESSION** button with strong red glow + `animate-glow` pulse
- For now: navigates to `/` on tap (no save, no overlay)

---

### Components & files

- `src/routes/workout.log.tsx` — full rewrite for new session UI; remove finishWorkout call, XpGainOverlay, achievements/streak toasts
- `src/components/session-intro.tsx` (new) — fullscreen overlay showing "SESSION STARTED" with fade-in/out + red pulse, auto-dismisses after ~1s
- `src/components/session-timer.tsx` (new) — small hook+component returning live `MM:SS` since mount
- `src/components/set-row.tsx` (new) — single set row with weight/reps inputs and COMPLETE toggle
- `src/styles.css` — add (only if missing) a `set-row-complete` accent class and a `session-intro` keyframe; reuse existing `card-premium`, `shadow-glow`, `animate-glow`, `animate-fade-up`

State is local to the route (`useState`) — no persistence. `sessionStorage.kairos_picked` continues to feed the picked exercise IDs into the session.

---

### Out of scope (explicit)

- Saving the workout to Supabase
- XP gain overlay, level-up, streaks, achievements
- Rest timers, set timers, supersets
- Editing exercises mid-session beyond add-set / complete-set
- Any change to `/workout` (selection screen) or to `finishWorkout` in `src/lib/workout.ts`
