## Fix: Complete Session button appears before timer/exercises

**Problem**: In `src/routes/workout.log.tsx`, the sticky "Complete Session" CTA (line 427) renders as soon as `entries.length > 0`, with no entrance animation. The header timer and exercise cards both use `animate-fade-up` (cards staggered by `ei * 60ms`), so the CTA visually "beats" them onto the screen — obvious now that you're testing with a single exercise where the CTA isn't pushed off-screen.

**Fix** (presentation-only, single file):

1. Add a `ctaReady` state in `LogPage`, initialized to `false`.
2. In an effect, when `!intro && !loadingSession && entries.length > 0`, start a `setTimeout` (~450ms — after the header fade-up plus the first card's stagger) that sets `ctaReady = true`. Clear the timeout on cleanup; reset to `false` if the conditions become false again (e.g. exiting).
3. On the sticky CTA wrapper (line 428), use `ctaReady` to drive opacity + a small upward translate:
   - Base: `opacity-0 translate-y-2`
   - When `ctaReady && !exiting`: `opacity-100 translate-y-0`
   - Keep existing `transition-opacity duration-300`, extend to `transition-all duration-500 ease-out`.
4. Keep the existing `exiting` opacity-out behavior intact (overrides `ctaReady`).

No changes to layout, business logic, or other components.