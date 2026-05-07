## Problem

When "Complete Session" is tapped, the inner session content (header, timer, exercises) fades to black via `transition-opacity duration-300` on the wrapper at line 210, but the fixed CTA container at line 371 sits outside that wrapper and stays at full opacity. Result: content fades → black screen with the button still hovering → ~350ms later the route navigates and the button finally disappears, then the summary appears.

## Fix

In `src/routes/workout.log.tsx`, tie the fixed CTA's opacity and interactivity to the same `exiting` state so it fades in lockstep with the rest of the screen.

Update the sticky CTA wrapper (around line 371):

- Add `transition-opacity duration-300` to the wrapper.
- When `exiting` is true: apply `opacity-0` and keep `pointer-events-none` (already there); when false: `opacity-100`.
- Also disable the button itself while exiting (`disabled={exiting}`) so a second tap during the fade can't re-trigger `completeSession`.

No changes to navigation timing, the fade wrapper at line 210, or the completion logic — just making the CTA participate in the existing 300ms fade.

### Out of scope

- Summary screen, navigation logic, XP/streak persistence, or any other route.
