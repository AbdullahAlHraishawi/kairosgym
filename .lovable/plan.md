# Center the body-weight prompt + keep it above the keyboard

Revert to a centered modal (not a bottom drawer) and fix the original problem — the on-screen keyboard covering the input — by anchoring the modal to the visible viewport instead of the full screen.

## Approach

Keep using shadcn `Dialog` (centered), but add two small behaviors:

1. **Track the visible viewport.** Use `window.visualViewport` to detect when the keyboard opens. When it does, the visual viewport height shrinks. Apply that height as a CSS variable and translate the dialog so its center sits in the middle of the *visible* area, not the full screen.

2. **Compact dialog.** Keep the dialog content short (title + single input + 2 buttons, no extra padding) so it always fits inside the reduced viewport above the keyboard.

3. **Scroll input into view on focus** as a fallback for browsers without `visualViewport` support.

## Changes

**`src/routes/profile.tsx`**
- Revert: switch back from `Drawer` to `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogFooter`.
- Wrap the dialog content in a small inline component that:
  - subscribes to `window.visualViewport` resize/scroll
  - sets `style={{ maxHeight: visualViewport.height - 32 }}` on the content
  - calls `inputRef.current?.scrollIntoView({ block: "center" })` on focus
- Tighten padding so the whole modal is ~260px tall.

**No changes** to the calorie logic, the body-weight save flow, or anything else.

## Out of scope

- Changing other dialogs in the app
- Adding viewport handling globally (only this dialog needs it for now)

## Files touched

- edit `src/routes/profile.tsx` — switch back to Dialog, add visualViewport-aware sizing
