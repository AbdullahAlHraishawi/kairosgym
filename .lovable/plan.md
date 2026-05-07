## Goal
Replace the simplistic SVG body in `src/routes/progress.tsx` (`BodyMap`) with a premium anatomical muscle-diagram component matching KAIROS's dark/red aesthetic, showing front + back views side by side inside the existing "Muscles Trained" card.

## Approach

### 1. Generate anatomy art (premium AI)
Generate two transparent PNGs in the KAIROS style — dark gray base muscles, clean black outlines, no head detail clutter, no background:
- `src/assets/body-front.png`
- `src/assets/body-back.png`

Prompt direction: stylized anatomical fitness chart, full body, clearly delineated muscle groups (chest, shoulders, arms, abs, quads, calves on front; traps, lats, rear delts, triceps, glutes, hamstrings, calves on back), neutral standing pose, dark gray (#3a3a3a-ish) muscles with crisp black separation lines, no color highlights baked in, transparent background, premium editorial fitness-app look.

If a single generation pass doesn't deliver the quality bar, iterate (regenerate / edit_image) until both views are clean and symmetrical. QA each image visually before wiring in.

### 2. New `MuscleDiagram` component
New file `src/components/MuscleDiagram.tsx`.

Props:
```ts
{
  trainedMuscles: Set<string>;   // muscles trained in last 30d (base red tint)
  focusedMuscle?: string | null; // pill tap → emphasize one, dim others
  frontBodyImage?: string;       // override default asset
  backBodyImage?: string;
}
```

Rendering strategy (CSS-overlay, no manual SVG anatomy):
- Two stacked containers side-by-side (front | back), each `relative`.
- Base layer: `<img>` of the anatomy asset (dark gray muscles).
- Overlay layer per muscle group: an absolutely-positioned `<div>` whose shape is defined by a CSS `mask-image` cut from a small companion SVG/PNG mask OR by a hand-tuned `clip-path` polygon. Each overlay is filled with `var(--primary)` (red) for trained muscles, `oklch(... / 0.5)` muted orange for secondary, transparent otherwise.
- Smooth `transition-opacity duration-300` on overlays for filter changes.
- Dim non-focused muscles by lowering opacity of their overlay (and applying a subtle dark scrim over the base image) when `focusedMuscle` is set.

Muscle → region map (front/back, normalized % coords) covers: Chest, Shoulders, Arms, Abs (decorative), Legs (front quads + back hamstrings/glutes), Back (lats/traps).

If clip-path tuning proves fragile against the generated art, fall back to lightweight hand-authored SVG region overlays sized to match the asset's anatomical landmarks. Both approaches keep the asset swappable via props.

### 3. Wire into `progress.tsx`
- Replace `<BodyMap activeMuscles={muscles} />` with `<MuscleDiagram trainedMuscles={muscles} focusedMuscle={focused} />`.
- Add `const [focused, setFocused] = useState<string | null>(null);`
- Convert the pill row from `<span>` to `<button>`:
  - Tap = toggle focus on that muscle.
  - Visual states unchanged (trained = red pill, untrained = muted, focused = red ring).
- Delete the old `BodyMap` function.
- Keep card chrome (`card-premium rounded-2xl p-5`), heading copy, spacing.

### 4. Layered filter behavior
- No filter focused → trained muscles glow red, untrained stay dark gray.
- Filter focused → focused group becomes brighter red with subtle glow, all other overlays fade to ~25% opacity, base body slightly dims via a scrim. 300ms transitions.

## Out of scope
- Data source for `muscles` (unchanged).
- Other progress-page sections.
- Workout logging flows.

## Technical notes
- Assets imported as ES6: `import frontBody from "@/assets/body-front.png"`.
- All colors via tokens (`var(--primary)`, `var(--secondary)`, `var(--muted-foreground)`); no hardcoded hex in component.
- Mobile-first: side-by-side layout uses `grid grid-cols-2 gap-3`; each body fills its column with `w-full h-auto object-contain`.
- Accessibility: each pill is a `button` with `aria-pressed`; images get descriptive `alt`.
