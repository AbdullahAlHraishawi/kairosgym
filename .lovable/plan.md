## Plan

1. **Remove the top gap on the Home/Profile hero**
   - The tab panels add `pt-6`, while the hero only offsets `-mt-2`, leaving visible empty space above the banner.
   - Pull the hero section flush to the top of the scroll panel without changing the app layout or dark/red aesthetic.

2. **Move the selected warrior checkmark outside the avatar circle**
   - In `CharacterPicker`, the checkmark sits inside the avatar wrapper which has `overflow-hidden`, so it gets clipped/visually inside the circle.
   - Move the selected badge to a card-level overlay so it sits cleanly outside the circular avatar for Ryuji, Kai, and Ren.

3. **Make warrior selection update Home immediately**
   - Root cause: `TabsShell` keeps all tab panels mounted, so Home’s `useProfile()` does not re-fetch when Profile saves a new `character_key`.
   - Add a lightweight refresh signal in `useProfile` (subscribe to a profile-changed event) and emit it after `CharacterPicker` saves.
   - Home updates instantly on warrior change, no refresh/restart needed.

4. **Smooth crossfade between banners (no abrupt swap)**
   - Root cause: the current hook fades the `next` layer in over the `current` layer, then on fade end swaps `current = next` and instantly hides `next` — at that frame the bottom layer’s `src` changes, causing a visible jump/flash.
   - Rework `useCharacterBanner` and `CharacterBanner` to use a true 2-layer crossfade where one layer fades out as the other fades in (each tick alternates which layer is visible), so neither layer’s `src` ever changes while it is visible. Use a longer easing (≈1200ms ease-in-out) for a cinematic feel and preload the next image before starting the fade to avoid pop-in.

5. **Fix the PWA update prompt root cause**
   - Current setup uses `registerType: "prompt"` + `injectRegister: false`, and the prompt is gated to `/` and excluded on preview hosts — so in many real conditions it never registers/shows.
   - Keep iframe/preview safeguards, but in production:
     - reliably register the SW,
     - listen for `needRefresh`,
     - also check for updates on visibility/focus (not just an interval),
     - render the prompt globally instead of only on `/`,
     - on click call `updateServiceWorker(true)` and reload.
   - Keep the existing “Clear cache” fallback for stuck workers.

6. **Verify**
   - Sanity-check edited files (JSX, imports, no console errors) and confirm the updated UI renders correctly on the current mobile viewport.