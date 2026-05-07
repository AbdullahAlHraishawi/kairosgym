## Root cause

`src/routes/workout.tsx` and `src/routes/workout.log.tsx` use TanStack Router's flat dot-routing convention. That makes `workout` the **parent layout** of `workout.log`. A layout route MUST render `<Outlet />` for its children to appear. Our `workout.tsx` does not — it renders the full exercise-picker page directly.

Result: pressing **Start workout** correctly navigates to `/workout/log`, the URL changes, the document title updates to "Active session — KAIROS"… but the on-screen content stays as the parent's picker UI because the child has nowhere to mount. From the user's perspective: "nothing happens."

This is also exactly what I saw earlier when I opened `/workout/log` directly in the browser tool and got the picker screen — I misread it as a fast redirect; it was actually the parent route swallowing the child.

## Fix

Rename the picker route so `/workout` and `/workout/log` become independent sibling routes, with no parent/child relationship and no Outlet needed.

- Rename `src/routes/workout.tsx` → `src/routes/workout.index.tsx`
- No code changes inside the file required (the `createFileRoute("/workout")` path string stays the same — TanStack's plugin re-generates `routeTree.gen.ts` from the new filename).
- `src/routes/workout.log.tsx` stays as-is and now mounts on its own.

## Verification

After the rename:
1. Restart-free: dev server picks up the new file and regenerates the route tree.
2. Manually navigate the browser to `/workout/log` and confirm the active-session screen (SESSION STARTED overlay → timer → exercise cards) renders instead of the picker.
3. Click Start workout from `/workout` and confirm transition to the session screen.

## Out of scope

No changes to `workout.log.tsx` content, the picker UI, or any styling. This is purely a routing-structure fix.
