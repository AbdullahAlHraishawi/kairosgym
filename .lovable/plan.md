## Root causes

**1. Splash text appears at middle-bottom, not center**
`SessionIntro` uses `fixed inset-0`. CSS spec: an ancestor with `will-change: transform` becomes the containing block for `fixed` descendants. `MobileShell`'s `<main>` has `will-change-transform` (used for swipe), so the splash is sized to the `<main>` element instead of the viewport. While the page is still loading (only a few skeletons rendered), `<main>` is short, so "Session Started" lands near the visible middle-bottom rather than the true viewport center.

**2. "Active session shows, disappears, then splash shows up"**
Order of events on Start Workout click:
1. Navigate to `/workout/log`.
2. `intro` state defaults to `false`, `loadingSession` is `true` → page renders the active-session header skeleton briefly.
3. After `openWorkout()` resolves, `setIntro(true)` finally fires → splash appears.
That ~200–500ms gap is exactly the "active session flash" the user is seeing.

## Fix

**A. Portal the splash to `document.body`** (`src/components/session-intro.tsx`)
- Wrap the returned JSX with `createPortal(..., document.body)` so it escapes any `will-change`/`transform` ancestor and is sized to the real viewport.
- Keep the existing fade and scroll-lock logic.

**B. Show the splash immediately, before data loads** (`src/routes/workout.log.tsx`)
- Initialize `intro` based on whether `sessionStorage.getItem("kairos_picked")` exists at mount (new session about to start). For a new session, `intro` starts `true` so the splash covers the page from the first paint after navigation — no skeleton flash.
- Don't auto-dismiss the splash until both: (a) the intro timer finished, and (b) `loadingSession` is `false`. Track timer-completion in a ref; call `onDone` only when both are ready. This guarantees the user never sees the half-built session before the splash fades.
- For the resume case (existing open workout), keep `intro = false` so refreshes resume silently as before.

**C. Minor: remove the lingering 300ms opacity transition fighting the splash**
The page wrapper already does `opacity-0` while `intro` is true. With (B), the splash sits on top from the first frame, so the wrapper's fade-in plays cleanly under it after the splash fades out. No change needed beyond ordering.

## Files touched
- `src/components/session-intro.tsx` — portal to body.
- `src/routes/workout.log.tsx` — initialize `intro` from sessionStorage; gate dismissal on data readiness.

No business-logic, DB, or styling-token changes.
