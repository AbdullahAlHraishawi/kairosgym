## Goal
Make the highlight follow the actual muscle shapes (like the reference image) instead of soft red ellipses floating over the body.

## Why the current version looks "off"
`MuscleDiagram.tsx` paints `<ellipse>` blobs with `mixBlendMode: screen`. The blobs don't match the muscle silhouettes in the generated anatomy PNG, so the glow looks like stickers, not lit-up muscles.

## Approach: per-muscle mask overlays

For each body view, generate a set of **transparent PNG masks** that are pixel-aligned to the existing `body-front.png` / `body-back.png`. Each mask is white where its muscle group lives, transparent elsewhere. We then render a red-tinted `<div>` per muscle group whose visible shape is cut out by `mask-image: url(mask.png)`. Result: only the actual muscle silhouettes glow red, exactly like the reference photo.

### 1. Generate aligned masks (premium AI, transparent PNG, same 1024x1536 frame as the body assets)

Front:
- `src/assets/mask-front-chest.png` — both pectorals
- `src/assets/mask-front-shoulders.png` — front delts
- `src/assets/mask-front-arms.png` — biceps + forearms (both sides)
- `src/assets/mask-front-legs.png` — quads + calves (both sides)

Back:
- `src/assets/mask-back-back.png` — traps + lats
- `src/assets/mask-back-shoulders.png` — rear delts
- `src/assets/mask-back-arms.png` — triceps + forearms
- `src/assets/mask-back-legs.png` — glutes + hamstrings + calves

Each generated as a white silhouette on transparent background, traced to the same body proportions as the existing assets. QA each visually before wiring in; regenerate any that drift.

### 2. Rewrite `MuscleDiagram.tsx`

Replace the SVG ellipse system with a stack of mask layers:

```text
[ body image (dimmed when a filter is focused) ]
[ red layer masked by chest    ]  ← visible only if trained or focused
[ red layer masked by shoulders ]
[ red layer masked by arms      ]
[ red layer masked by legs/back ]
[ optional soft red blur layer behind, also masked, for the glow halo ]
```

Per layer:
- `background: var(--primary)` for the solid red tint, plus a second behind-layer with `filter: blur(8px)` and lower opacity for the outer glow.
- `mask-image: url(...); mask-size: 100% 100%; mask-repeat: no-repeat;` (with `-webkit-mask-*` fallbacks).
- `mix-blend-mode: multiply` on the solid layer so it tints the underlying muscle shading instead of flat-painting it; `screen` on the blur layer for the halo.
- Opacity logic stays the same as today:
  - no focus + trained → full glow
  - focused muscle → full glow + stronger blur halo
  - other muscles when something is focused → fade to ~0.15
  - untrained + nothing focused → 0

### 3. No changes elsewhere
`progress.tsx` keeps the same `<MuscleDiagram trainedMuscles focusedMuscle />` API. Pills, card chrome, data source untouched.

## Out of scope
- Re-generating the base body PNGs.
- Workout/session logic.
- Other progress sections.

## Technical notes
- All masks share the body's aspect ratio so they line up automatically inside the existing `aspect-[2/3]` container — no per-region coords to maintain.
- Colors stay token-based (`var(--primary)`); no hardcoded hex.
- Masks are static assets, imported via ES6 (`import chestMask from "@/assets/mask-front-chest.png"`).
- If a generated mask is slightly misaligned, we can nudge it with `transform: scale()/translate()` per layer rather than regenerating.
