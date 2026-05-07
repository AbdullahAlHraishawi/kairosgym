## What you're seeing

My hand-authored SVG paths look amateur — that's on me. Trying to draw an anatomically credible body silhouette + 20 muscle regions by hand in path commands was the wrong approach. The result is the cartoonish blobs in your screenshot.

## Fix: use `react-body-highlighter`

A small (~15KB, zero-dep) library purpose-built for exactly this. It ships proven anterior + posterior SVG polygons for every muscle group, takes a `data` array of "exercises → muscles" and a `highlightedColors` array, and renders a clean professional body diagram. Used by other fitness apps. MIT licensed.

### What I'll do

1. **Install** `react-body-highlighter`.
2. **Rewrite `src/components/MuscleMap.tsx`** to wrap two `<Model />` instances (one `type="anterior"`, one `type="posterior"`). Same props as today: `trainedMuscles`, `focusedMuscle`, `view`, `className`. Internally I map our 5 high-level groups to the library's fine-grained muscle keys:
   - `Chest` → `chest`
   - `Back` → `trapezius`, `upper-back`, `lower-back`
   - `Shoulders` → `front-deltoids`, `back-deltoids`
   - `Arms` → `biceps`, `triceps`, `forearm`
   - `Legs` → `quadriceps`, `hamstring`, `calves`, `gluteal`
3. **Drive colors via `data` + `highlightedColors`**:
   - Build a `data` array where each trained group contributes an entry with its mapped muscles.
   - When `focusedMuscle` is set, only the focused group's muscles get the bright `var(--primary)` color; trained-but-not-focused get a dim red; untrained stay at `bodyColor` (a muted neutral).
   - When no focus, all trained groups render at the standard red.
4. **Style**: pass `bodyColor` as a muted dark-surface token (resolved from the CSS var at runtime via `getComputedStyle`) so the unhighlighted body matches the card. SVG style: `width: 100%`, no padding.
5. **No more PNGs, no more hand-drawn paths.** The component stays a drop-in for anywhere else in the app.

### Verification

After implementing, open `/progress` in the browser tool and screenshot:
- Default view: trained muscles (Chest, Back, Shoulders, Arms, Legs from current mock) glow red on the right anatomy positions.
- Tap each filter → only that group brightens, others dim.
- Anatomy looks credible (real pecs/lats/quads, not blobs).

### Out of scope

- Wiring the component into other tabs (you said "later").
- Click-on-muscle interaction (library supports it; not requested).

### Risk note

`react-body-highlighter` is React-only and pure SVG with zero deps — safe for the TanStack Start SSR/Worker runtime (no `window`, no native modules). If for any reason it choked on SSR, fallback is dynamic-import behind a client-only guard.
