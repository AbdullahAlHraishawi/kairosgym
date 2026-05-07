## Root cause

The AI-generated "mask" PNGs aren't real masks. Looking at the actual files:

- `mask-front-chest.png` — full anatomy line-art with a small white blob on the pecs. Works *by accident* because everything outside the white pecs is either transparent or thin black lines, both of which luminance-mode treats as "clear".
- `mask-back-back.png`, `mask-back-shoulders.png`, `mask-back-legs.png` — almost entirely near-white. As a luminance mask, white means "show red here", so they flood the whole back body in red. That's exactly what your screenshots show.
- `mask-back-arms.png` — basically empty, so Arms-back never highlights.
- The unfiltered view layers all four trained masks at 0.85, so on the back, three near-white masks stack into a solid red silhouette.

The whole AI-generated-mask approach is too fragile for something you want to reuse across the app. We need a deterministic source of truth for muscle regions.

## Fix: replace PNG masks with a hand-authored SVG muscle map

Build one reusable component, `<MuscleMap />`, that owns everything: body art + muscle regions + highlight logic. Drop it anywhere — Progress page now, other tabs later — by passing `trainedMuscles` and optional `focusedMuscle`.

### What it renders

A single SVG per view (front/back) with a fixed `viewBox` (e.g. `0 0 200 300`):
1. Background body silhouette + muscle line-art, drawn as SVG paths in `stroke: var(--foreground) / 0.4`, no fill. This replaces the PNGs entirely — no more alignment guesswork.
2. Muscle-region paths layered on top, one per group: `chest`, `shoulders-front`, `arms-front`, `abs`, `legs-front` (front view); `traps`, `lats`, `shoulders-back`, `arms-back`, `glutes`, `legs-back` (back view). Each gets `fill: var(--primary)`, `mix-blend-mode: hard-light`, and an `opacity` driven by the same focus/trained logic we already have.
3. Smooth `transition: opacity 300ms`.

Because everything lives inside one SVG with a shared viewBox, regions are guaranteed to line up with the body — no more "is the mask the right size?".

### Region paths

I'll hand-author compact SVG paths approximating each muscle group (pecs, delts, biceps+forearms, quads, etc.). Eight to ten paths per view, each ~6–10 coordinates. Stylized, not anatomically perfect — matches the "fitness app chart" look the original brief asked for and is what a premium app would actually ship.

### Component API (unchanged from current)

```tsx
<MuscleMap
  trainedMuscles={Set<MuscleGroup>}
  focusedMuscle={MuscleGroup | null}
  view="both" | "front" | "back"   // new — lets you embed just one side elsewhere
  className?: string
/>
```

`MuscleGroup` becomes a typed union: `"Chest" | "Back" | "Legs" | "Shoulders" | "Arms"`. Internally the component maps each filter to the relevant front/back region paths (e.g. `Shoulders` → both front delts + rear delts).

### Cleanup

- Delete all 8 `mask-*.png` files and the 2 `body-front.png` / `body-back.png` files (no longer used).
- Delete the current `MuscleDiagram.tsx` and replace with the new SVG-based `MuscleMap.tsx`.
- Update `src/routes/progress.tsx` import + tag name. Same props, no other changes.

### Verification

After implementation, open `/progress` in the browser tool and screenshot:
- No filter → both bodies show subtle red on trained groups only, no flooding.
- Tap each filter (Chest, Back, Legs, Shoulders, Arms) → only the matching region(s) glow, rest dims.
- Confirm component renders cleanly when dropped on a second test mount with different `view`.

## Out of scope

- Photoreal anatomy art. The new SVG will be clean stylized line-art in the KAIROS style, not a render. If you want photoreal later, we can swap the background paths for an SVG illustration without touching the region/highlight system.
- Any non-progress page wiring — the component will be reusable, but I won't add it elsewhere unless you ask.
