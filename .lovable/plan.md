## Changes

**1. Level-up overlay (`src/routes/workout.log.tsx`)**
- Extend total visible duration by ~1s: bump the `levelUpPhase` timeout from 2400ms → 3400ms (and adjust the inner hold so entry/exit animations stay intact).
- Wrap the overlay content in a frosted-glass panel: add `backdrop-blur-xl bg-background/40 border border-primary/30` with rounded corners and inner padding, so the giant "LEVEL / number / LEVEL UP" text sits on a readable blurred plate. Keep the radial red flare behind it; keep existing `animate-level-up-in` / `animate-level-up-out` and glow text-shadows untouched.

**2. Bottom nav (`src/components/bottom-nav.tsx`)**
- Replace `bg-card/95 backdrop-blur-md` with a true frosted look: `bg-background/40 backdrop-blur-xl backdrop-saturate-150` and soften the top border (`border-border/50`). This makes the underlying screen visible through the bar while keeping legibility for icons/labels.

## Out of scope
- No changes to XP bar, set rows, persistence, colors, fonts, or animation easings beyond the timing bump above.
