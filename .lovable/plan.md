# Fix swipe flicker by persistently mounting all tabs

## Root cause

Each tab route (`/`, `/workout`, `/progress`, `/leaderboard`, `/profile`) renders its own `MobileShell`. The current swipe handler in `mobile-shell.tsx` animates the *current* shell's `<main>` off-screen, then on `transitionend` calls `navigate({ to: nextTab })`. The next page is **not pre-rendered** — it doesn't exist in the DOM until navigation completes. So during the slide:

1. Current shell translates out → empty background visible behind it (the "next page begins to appear" is actually the background showing through).
2. `navigate()` unmounts the old shell and mounts the new shell.
3. New shell mounts with `transform: ""` (reset to 0), but for one frame React paints the previous URL's match + a flash before the new component takes over → the perceived "flashback".
4. Final paint of the new tab.

There is no shared, persistent container holding both the current and next tab simultaneously. Fix requires real persistent mounting.

## Architecture change

Introduce a single `TabsShell` that mounts **all 5 tab content components at once** in a horizontally stacked strip. The strip's `translateX` is driven by a *local* `activeIndex` state, not by router state. URL navigation happens **after** the slide animation finishes (via `replace`), so React never has to swap the page mid-transition.

Sub-routes that aren't tabs (`/workout/log`, `/workout/complete`, `/auth`, `/ranks`) bypass the tabs shell and render normally with their own `MobileShell`.

```text
__root
 └─ TabsShell (mounted whenever pathname ∈ tab paths)
     ├─ panel: HomeContent          (always mounted)
     ├─ panel: WorkoutContent       (always mounted)
     ├─ panel: ProgressContent      (always mounted)
     ├─ panel: LeaderboardContent   (always mounted)
     └─ panel: ProfileContent       (always mounted)
```

## Steps

### 1. Extract page bodies from `MobileShell` wrappers
For each of `index.tsx`, `workout.index.tsx`, `progress.tsx`, `leaderboard.tsx`, `profile.tsx`:
- Export a content-only component (e.g. `HomeContent`) that renders the page **without** wrapping in `<MobileShell>`. The route's `component` keeps its current behavior for direct URL hits but the TabsShell imports the content directly.
- Remove the per-tab `MobileShell` wrapper from these 5 pages — the shell becomes the parent.

### 2. Create `src/components/tabs-shell.tsx`
A single component that:
- Renders 5 absolutely-positioned panels side-by-side inside a horizontal strip (`width: 500%`, each panel `width: 20%`).
- Owns `activeIndex` local state, initialized from current pathname.
- Each panel wraps its content in an independently scrollable container (`overflow-y: auto`, `height: 100dvh`) so each tab preserves its own scroll position naturally (the DOM nodes are never unmounted).
- Strip transform: `translate3d(${-activeIndex * 100}vw + dragDx, 0, 0)` with `will-change: transform`.
- Touch handlers (lifted from `mobile-shell.tsx`, keeping the horizontal-scrollable conflict guard via `data-no-swipe` and overflow-x detection).
- On commit: animate strip to target index, then on `transitionend` call `navigate({ to: TAB_ORDER[next], replace: true })` — URL updates but no remount happens because all panels stay mounted.
- On URL change from external sources (back button, link click): sync `activeIndex` and animate the strip to that index.
- Renders `<BottomNav />` overlaid; bottom nav `<Link>` clicks call `setActiveIndex` first (instant slide) then update URL.

### 3. Wire `TabsShell` at the root
In `__root.tsx`'s `RootComponent`, switch between two render modes based on pathname:
- If pathname matches a tab path exactly → render `<TabsShell />` (which ignores `<Outlet />` because all tab content is imported directly).
- Otherwise → render `<Outlet />` as today.

This avoids creating a layout route (which would still cause unmounts when navigating to non-tab pages). The TabsShell instance persists across tab swipes because its position in the React tree is stable.

### 4. Bottom nav integration
- Update `BottomNav` to accept an optional `onTabChange(index)` callback. When inside `TabsShell`, taps trigger an immediate index change + animated slide rather than relying on router unmount/mount.
- Outside the tabs shell (sub-routes), the existing `<Link>` behavior is preserved.

### 5. Scroll preservation
Because tab DOM nodes are never unmounted, each panel's scroll position naturally persists. Disable router `scrollRestoration` for tab routes (or keep it — it won't fire because the tab DOM never re-renders).

### 6. Animation polish
- During drag: `transition: none`, `transform` follows finger.
- On release commit: `transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1)`.
- On release snap-back: same easing back to current index.
- Use `translate3d` for GPU layer.
- Edge resistance preserved via existing `rubber()` helper.

### 7. Preserve existing horizontal-scroll conflict guard
Keep `isHorizontallyScrollable` walk + `data-no-swipe` opt-out exactly as-is.

## Out of scope
- Visual styling unchanged.
- No removal of swipe.
- No business-logic changes in tab pages — only their wrapping shell moves up one level.
- Sub-routes (`/workout/log`, `/workout/complete`, `/auth`, `/ranks`) untouched.
