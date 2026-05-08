# Fix runtime 500: route code-splitter strips `HomePage` reference

## Root cause

The TanStack Router Vite plugin code-splits each route's `component` into a separate chunk. After the split, the route's main module no longer contains the component function — only the route definition. So lines like:

```ts
export const HomeContent = HomePage; // ReferenceError at runtime
```

throw `ReferenceError: HomePage is not defined` during SSR, which surfaces as a 500 on every page (preview and published).

Affects all 5 tab route files: `index.tsx`, `workout.index.tsx`, `progress.tsx`, `leaderboard.tsx`, `profile.tsx`.

## Fix

Stop aliasing the route component. Instead, in each of the 5 tab route files:

1. Rename the page function to its `*Content` name (`HomeContent`, `WorkoutContent`, `ProgressContent`, `LeaderboardContent`, `ProfileContent`).
2. Export it directly: `export function HomeContent() { ... }`.
3. Reference it from the route definition: `component: HomeContent`.

This keeps a single function declaration that is both exported (for `tabs-shell.tsx` to import) and referenced by the route. The code-splitter handles a directly-referenced exported function correctly — the import from `tabs-shell.tsx` keeps it in the main chunk.

## Out of scope
- No other behavior changes.
- TabsShell, BottomNav, and styles untouched.
