## Fix login page hero & logo

Three small tweaks to make the auth screen match the mockup exactly.

### Changes

1. **Push the hero photos toward the top.** Currently the image fills the whole screen and is darkened heavily. Switch it to occupy only the top ~70% of the screen, anchored to the top (`object-top`), with a solid `--background` fill underneath. This matches the mockup where the photo dominates the upper portion and the lower portion is pure dark.

2. **Lighten the overlay.** Replace the heavy radial darkening with a much softer top-to-bottom gradient so the anime art reads clearly at the top, and only fades to dark where the login card begins.

3. **Make the KR logo 50% larger.** Bump from `h-24 w-24` (96px) to `h-36 w-36` (144px).

4. **Kill the square glow.** The square came from the logo PNG having a white background; the red `drop-shadow` was rendering around the white bounding box. Regenerate `src/assets/kr-logo.png` from the source with the white background removed (transparency + trim) so the drop-shadow hugs the actual KR shape.

### Files touched
- `src/assets/kr-logo.png` — re-export with transparent background, trimmed.
- `src/routes/auth.tsx` — hero positioning, overlay, logo size.

No other behavior or layout changes.
