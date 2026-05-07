# Polish: XP bar continuity + cinematic LEVEL UP

Scope: visual/animation polish only. No layout, color, or business-logic changes. Files touched: `src/components/xp-bar.tsx`, `src/styles.css`, `src/routes/workout.log.tsx`.

## 1. XP bar — animate from current, not 0

**Problem:** `XpBar` uses `key={animateKey}` + `animate-xp-fill` keyframe, which remounts the fill on every XP change and replays a 0→target fill.

**Fix in `src/components/xp-bar.tsx`:**
- Remove `key` remount and `animate-xp-fill` class.
- Drive width purely from `progress` prop with a CSS `transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1)` so React state updates animate the bar smoothly from its current width to the new one.
- Keep existing premium gradient, inner glow, and shimmer sweep.

**Level-up handling (workout.log.tsx):**
- Track `prevLevel` via ref. When a level-up is detected:
  1. First, briefly force progress to `1` (full bar) for ~450ms with a glow pulse — so the eye sees it complete.
  2. Then disable transition for one frame and snap to `0`.
  3. Re-enable transition and set the real new `lp.progress` so it animates smoothly from 0 to remainder.
- Implementation: a small `useEffect` on `lp.level` that toggles a `levelTransition` state with three phases (`fill` → `reset` → `settle`), and a `displayProgress` value passed to `XpBar` based on phase. `XpBar` accepts an optional `disableTransition` prop to allow the snap-to-0 step.

This guarantees: normal gains animate 35→52 smoothly; on level-up the bar visibly fills, flashes, resets, and continues filling to the remainder.

## 2. LEVEL UP overlay — large, cinematic, ~2.4s

Replace the small pill currently inside the sticky header.

**New overlay (rendered inside `LogPage`, absolutely positioned over the sticky session area, non-blocking):**
- Position: `absolute inset-x-0 top-16` within the sticky header container, `pointer-events-none`, `z-30`.
- Content: stacked
  - tiny eyebrow: `LEVEL` in muted tracking
  - giant number: the new level, font-black, `text-7xl`, tabular-nums
  - subline: `LEVEL UP` in primary, `text-xl font-black tracking-[0.4em]`
- Effects:
  - Red radial energy flare behind text (`radial-gradient(circle, primary-glow 0%, transparent 70%)`) at ~220px, blurred, animated scale-pulse.
  - Layered text-shadow glow on the number and label using `--primary-glow` / `--primary` (3-stop blur).
  - Entry: fade + scale from 0.85 → 1.05 → 1.0 with cubic-bezier easing over 600ms.
  - Hold ~1.4s.
  - Exit: fade + slight scale down + slight upward drift over 500ms.
  - Total visible duration ≈ 2.4–2.5s.

**New keyframes in `src/styles.css`:**
- `@keyframes level-up-in` (0% opacity 0, scale 0.85; 60% opacity 1, scale 1.06; 100% scale 1)
- `@keyframes level-up-out` (0% opacity 1; 100% opacity 0, translateY(-12px), scale 0.98)
- `@keyframes level-flare` (scale + opacity pulse on the radial backdrop)
- Utility classes: `.animate-level-up-in`, `.animate-level-up-out`, `.animate-level-flare`.

**workout.log.tsx changes:**
- Replace existing `showLevelUp` pill with the new overlay component (kept inline for simplicity).
- Bump timeout from 1800ms → 2400ms.
- Track `levelUpValue` (the new level number to display) so it stays correct during exit animation.
- Drive `levelTransition` phases (see XP bar section) from the same level-up detection.

## Out of scope
- No changes to set rows, floaters, persistence, navigation, colors, or typography beyond the new overlay sizing/glow.
- No new dependencies.
