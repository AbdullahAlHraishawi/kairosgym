## Approach

I'll **generate a realistic anatomy body image sized to match the library's exact proportions** (viewBox `0 0 100 200`, so 1:2 aspect), then render the library's `<Model>` on top with `bodyColor="transparent"`. The result: photoreal body underneath, library's pixel-accurate muscle polygons glowing red on top.

This gets you the realistic look you want **with the library's full accuracy preserved** — no hand-tracing, no alignment guesswork. The library polygons were drawn to canonical anatomy positions, so a realistically proportioned body underneath will line up.

(Note: this is technically a refined version of "library polygons over realistic body" — but because I'll generate the body to match the library's exact viewBox and pose, the mismatch concern from my earlier question disappears.)

## Steps

1. **Generate two body images** with `imagegen` (premium tier) — `body-anatomy-front.png` and `body-anatomy-back.png`. Strict prompt: dark grey muscular anatomy reference figure, arms straight down at sides slightly out, feet together, perfectly symmetric, head included, transparent background, 1:2 portrait aspect, neutral pose matching anatomical reference posters. Same model, same pose, front then back.

2. **Update `MuscleMap.tsx`**:
   - Wrap each `<Model>` in a relative container.
   - Render the corresponding body PNG as `<img>` absolutely positioned, full size, behind the SVG.
   - Set `bodyColor="transparent"` and a subtle `svgStyle={{ position: "absolute", inset: 0 }}` so only the highlighted polygons paint over the body.
   - Untrained-when-focused gets `bodyColor="transparent"` too — the realistic body underneath naturally shows the dimmed state.

3. **Verify**: open `/progress` (after you log in), screenshot, confirm: body looks realistic, red highlights land on the right muscles, filters work.

## Out of scope

- Hand-traced custom polygons. The library's polygons are already accurate; tracing them by hand would only make it worse.
- Multiple body types/genders.

## Risk

If the generated body's proportions drift from the library's polygon positions (e.g., shoulders too wide), highlights will sit slightly off the muscle. Mitigation: I'll generate, screenshot, and iterate the body image if alignment is off — body is just a PNG swap, no code changes needed.
