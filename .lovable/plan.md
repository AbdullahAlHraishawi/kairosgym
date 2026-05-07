## Problem
The whole card renders as a solid red square covering the body. Cause: some generated mask PNGs have an opaque **black background** instead of a transparent one (visible in `mask-back-shoulders.png` and `mask-back-arms.png`). CSS `mask-image` defaults to `mask-mode: match-source`, which uses the image's **alpha** channel — an opaque black background = fully visible everywhere, so red floods the entire body.

There's also a "lag" — stacking 8 large blurred mask layers per page is heavy.

## Fix

### 1. Switch mask mode to luminance
In `src/components/MuscleDiagram.tsx`, add `maskMode: "luminance"` and `WebkitMaskMode: "luminance"` to the mask style. White pixels become opaque, black/transparent become clear — works regardless of whether the source PNG has a transparent or black background.

### 2. Regenerate the broken masks cleanly
Re-run image generation for any mask whose background is opaque black:
- `mask-back-shoulders.png`
- `mask-back-arms.png`
- `mask-back-back.png` (also had odd shape)
- `mask-back-legs.png` (only calves, missing glutes/hams)

Even with luminance mode, these need better silhouettes to match the reference look.

### 3. Reduce render cost (fix the lag)
- Drop `filter: blur(10px)` on the halo layer (expensive on 4 layers × 2 bodies = 8 blurred layers, recomputed on every focus change). Replace with a single subtler `box-shadow`-style glow via a second mask layer at lower opacity — or just remove the halo and rely on the solid tint + brightness on the body image.
- Memoize layer arrays (already static at module scope, fine).
- Use `will-change: opacity` only on the focused layer, not all of them.

### 4. Verify in the browser
After the edit, open `/progress` in the browser tool, screenshot, and confirm: body is visible, only muscle silhouettes glow red, pill taps focus the right group, no full-card red flood.

## Out of scope
- Re-generating the base body PNGs.
- Other progress sections.
