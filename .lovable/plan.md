## Changes

**1. Extend SESSION STARTED overlay duration**
- `src/components/session-intro.tsx`: change auto-dismiss timeout from `850ms` → `2850ms` (2s longer).

**2. Replace rectangular box-shadow glow with per-letter text glow**
- `src/components/session-intro.tsx`:
  - Remove `animate-glow` from the title (this is `glow-pulse` animating `box-shadow`, which causes the red rectangle around the text seen in the screenshot).
  - Replace static `textShadow` with a layered text-shadow that hugs each letter (e.g. `0 0 8px var(--primary-glow), 0 0 18px var(--primary-glow), 0 0 32px var(--primary)`), so the glow follows the letterforms instead of a block.
  - Add a subtle pulse via a new lightweight keyframe `text-glow-pulse` (animating `text-shadow` intensity only) defined inline or in `src/styles.css` under the existing animation block, applied to the title only. No box-shadow involved.

**3. Remove muscle-group day title from active session header**
- `src/routes/workout.log.tsx`:
  - Remove the `{title}` heading (ARM DAY / BACK DAY / etc.) from the hero block.
  - Keep the "ACTIVE SESSION" top label, the `SessionTimer`, and the italic subtitle.
  - Delete the now-unused `deriveTitle` function, `MUSCLE_TO_TITLE` map, and the `title` variable.

No other layout, spacing, color, or behavior changes.