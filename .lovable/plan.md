## Problem

The body-weight dialog renders partially off-screen (corner visible without keyboard, shifted left when keyboard opens). Root cause: the current fix mixes Radix's absolute centering (`left-[50%] top-[50%] translate(-50%,-50%)` from `DialogContent`) with our inline `top: vvHeight/2` + `transform`. On Android, the layout viewport already resizes when the keyboard opens, so the inline `top` double-shifts. The animation classes (`slide-in-from-left-1/2`) also fight with our overridden transform, leaving the dialog off-center.

## Fix

Stop trying to override Radix's positioning. Instead, render the body-weight modal as a custom centered overlay (Radix `Dialog.Root` + `Dialog.Portal` + `Dialog.Overlay` + a flex-centered `Dialog.Content`) so the browser keeps it centered inside whatever the visible viewport currently is — no `visualViewport` math, no inline `top`/`transform`.

### Changes in `src/routes/profile.tsx`

1. Remove `vvHeight` state, the `useEffect` that subscribes to `visualViewport`, and the `inputRef.scrollIntoView` focus handler (no longer needed).
2. Replace the `<Dialog>...<DialogContent>...` block with a direct Radix usage:
   - `Dialog.Root` (open/onOpenChange)
   - `Dialog.Portal`
   - `Dialog.Overlay` — `fixed inset-0 z-50 bg-black/80`
   - A `fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none` wrapper
   - `Dialog.Content` inside the wrapper with `pointer-events-auto card-premium w-full max-w-sm rounded-2xl p-5 max-h-[calc(100dvh-2rem)] overflow-auto` and no absolute positioning classes
3. Keep the existing inputs, label, helper text, Cancel/Save buttons; drop the `ref={inputRef}` and `onFocus` handler.
4. Keep `autoFocus` on the `Input` so the keyboard opens immediately.

### Why this works

- `100dvh` (dynamic viewport height) and the flex wrapper let the browser recompute centering as the keyboard pushes the layout viewport — no manual math.
- `pointer-events-none` on the wrapper + `pointer-events-auto` on the content keeps the overlay click-to-close behavior intact.
- Removing the inline `transform` lets Radix's open/close animations run cleanly without leaving the dialog stuck off-axis.

### Out of scope

- The shared `DialogContent` in `src/components/ui/dialog.tsx` is unchanged (other dialogs work fine on desktop).
- No changes to calorie logic, save flow, or any other component.