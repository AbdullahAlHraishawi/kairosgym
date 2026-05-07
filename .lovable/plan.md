# Cinematic Atmosphere Pass — KAIROS Logged-In UI

Visual-only upgrade. No layout changes, no new sections, no removed features. Existing structure on Home, Profile, Progress, Leaderboard, and Ranks stays identical — we only enrich shadows, gradients, glow, character art, badge visuals, and typography.

## 1. New atmospheric assets (generated as transparent/dark PNGs)

All faded anime-style art, dark + red-tinted, designed to sit at 10–18% opacity behind cards.

- `src/assets/atmo-warrior.png` — silhouette of a hooded fighter (level card backdrop)
- `src/assets/atmo-gym.png` — dark gym interior with red rim light (home top banner backdrop)
- `src/assets/atmo-crowd.png` — faded arena/crowd silhouette (leaderboard backdrop)
- `src/assets/atmo-blade.png` — single katana / cross emblem (profile header backdrop)

Plus illustrated metallic badge emblems (transparent PNGs, dark red metallic, ~256px):

- `src/assets/badge-flame.png` — ember/flame crest (streak)
- `src/assets/badge-skull.png` — skull emblem (discipline)
- `src/assets/badge-shield.png` — warrior shield crest
- `src/assets/badge-crown.png` — elite crown emblem
- `src/assets/badge-sword.png` — crossed swords crest
- `src/assets/badge-trophy.png` — engraved trophy emblem

These map onto the existing `icon` strings (`flame`, `shield`, `crown`, `sword`, `trophy`, plus `zap` → fallback to flame).

## 2. Design system additions (`src/styles.css`)

Add new tokens + utilities (no breaking changes to existing ones):

- `--gradient-card`: top-down subtle gradient for card surfaces (slightly lighter at top, darker at bottom).
- `--gradient-level`: stronger red-to-dark radial used inside the level card.
- `--shadow-inset-top`: subtle inner top highlight.
- `--shadow-edge-red`: faint red edge glow for premium cards.
- `--shadow-card-deep`: stronger layered drop shadow.
- New utility classes: `.card-premium` (combines gradient + inset highlight + faint red edge + deep shadow), `.card-cinematic` (same + animated lighting sweep), `.text-display` (slightly condensed letter-spacing for cinematic numbers), `.metallic-emblem` (drop-shadow glow tuned for badge PNGs).
- New keyframes: `light-sweep` (slow diagonal highlight across level card), `ember-pulse` (slower, softer pulse than `glow-pulse`).
- Tighten display typography: condensed tracking for large numbers via `.text-display` class (kept Inter — no font swap to avoid scope creep).

## 3. Reusable atmosphere primitive

New tiny component `src/components/atmo-card.tsx`:

- Wraps existing card markup, adds an absolutely-positioned faded background image layer (configurable opacity 0.1–0.18), a top-to-bottom gradient overlay, and inner highlight + red edge glow.
- Accepts `image`, `opacity`, `tone` ("red" | "neutral"), `glow` boolean.
- Used to upgrade: level card, leaderboard card, profile header, badges row container.

## 4. Page-by-page enhancements

### Home (`src/routes/index.tsx`)
- Wrap level card in `AtmoCard` with `atmo-warrior.png` at 14% opacity, add `.card-cinematic` (light sweep) and stronger XP glow.
- XP bar: thicker (h-3), inner shadow groove, red gradient fill (`linear-gradient(90deg, primary, primary-glow)`), animated shimmer overlay while filling.
- Stat cards: add `.card-premium` (gradient + inset top highlight + faint red edge).
- Achievements row: replace lucide icon + circle with metallic badge PNG (`badge-*.png`) inside a dark inset disc; locked state stays muted with `Lock` icon. Card gets faint red edge when unlocked.
- Leaderboard preview: wrap in `AtmoCard` with `atmo-crowd.png` at 12%; rank #1 row gets red gradient row background + shadow-glow, rank-number gets metallic gradient text.
- Top "Yo, {username}" header gets a thin gradient divider underneath.

### Profile (`src/routes/profile.tsx`)
- Header avatar block: add `atmo-blade.png` background at 12% behind the avatar with vignette.
- Level card: same `AtmoCard` + cinematic treatment as home.
- Badges grid: swap icons for metallic emblem PNGs; locked tiles stay muted; unlocked tiles get `card-premium` + faint glow.
- Rank row: add gradient strip on the left edge tinted by the rank color.

### Progress (`src/routes/progress.tsx`)
- Weekly XP card and Muscle map card: apply `.card-premium`.
- Bar chart: switch fill to a vertical red gradient (`linear-gradient(180deg, primary-glow, primary)`) via SVG `<defs>` in recharts.
- Tiles: `.card-premium` + small icon background tinted red.

### Leaderboard (`src/routes/leaderboard.tsx`)
- Podium: top-1 avatar gets stronger animated glow + metallic crown badge floating above; podium columns get gradient fill (taller column = brighter red top edge).
- List: top-3 rows get red-tinted background + faint glow; rank-number uses metallic gradient text; XP values use `.text-display`.

### Ranks (`src/routes/ranks.tsx`)
- Each rank row: unlocked rows get `.card-premium` + colored edge using the rank's color token (already present); icon disc gets inset shadow.

### Mobile shell (`src/components/mobile-shell.tsx`)
- Add a fixed, pointer-events-none full-bleed background layer with a very subtle dark-red radial vignette (top-right) + grain-free noise gradient. Opacity ~6%. Provides global cinematic mood without touching any page content.

## 5. What is NOT changing

- No route additions, no new pages, no nav changes.
- No data/business logic changes (XP math, queries, auth all untouched).
- No font swap (Inter stays). Typography upgrade is tracking/weight + new `.text-display` utility only.
- Bottom nav, buttons, forms keep current structure.

## Technical notes

- All new colors flow through `src/styles.css` tokens (oklch). No raw hex in components.
- New PNGs are imported directly from `src/assets` (Vite handles bundling). Generated via `imagegen--generate_image` with `transparent_background: true` for badges and `false` (dark scenes) for atmo-* art.
- `AtmoCard` keeps the existing `bg-card`/`rounded-2xl`/`border-border` classes so spacing and hit areas match exactly.
- Animations use existing reduced-motion-friendly easings; new `light-sweep` is slow (8s) and subtle.
