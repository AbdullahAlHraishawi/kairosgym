## Character Identity System — KAIROS

Add a default anime character identity (avatar + rotating banners) that users can pick during signup or from their profile. Built to be expandable. No redesign of the existing dark/red aesthetic — purely additive.

### 1. Assets

Two characters provided now (Ryuji, Kai). Ren will be added later — the registry already supports it as a "Coming soon" entry that's visible but not selectable until assets land.

Copy uploads into the repo:

```text
src/assets/characters/
  ryuji/
    avatar.png    ← file_000000006f9471f4bc4bcc0046981cc5.png
    banner1.png   ← file_00000000d25471f4beead5537d90eff0.png
    banner2.png   ← file_00000000aba471f4ab7ec0da880460f5.png
    banner3.png   ← file_00000000051471f49d978e28cba506d8.png
  kai/
    avatar.png    ← file_00000000ec807246a472eff94675af63.png
    banner1.png   ← file_00000000812c71f4b3d363edbfd74bd3.png
    banner2.png   ← file_000000004ae4720abc01fc4df129e7c4.png
    banner3.png   ← file_00000000fc7871f48eb76ad830aef979.png
```

A central registry `src/lib/characters.ts` exports:

```ts
export type CharacterKey = "ryuji" | "kai" | "ren";
export const CHARACTERS: Record<CharacterKey, {
  key: CharacterKey;
  name: string;
  tagline: string;       // "Intense / Focused", "Calm / Tactical", "Relentless / Rebel"
  avatar: string | null; // null = not yet available
  banners: string[];
  available: boolean;    // ren = false until assets uploaded
}>
```

Adding/finishing a character = drop a folder + flip `available: true`. Nothing else changes.

### 2. Database

Add a single nullable column to `profiles`:

- `character_key text` (nullable; `null` = no character chosen yet, fall back to current initial-letter avatar).

No RLS changes (existing owner-only policies cover it).

### 3. Hooks

- Extend `Profile` type in `src/hooks/use-profile.ts` with `character_key`.
- New `src/hooks/use-character.ts` → resolves the active character object from `profile.character_key` (or `null`).
- New `src/hooks/use-character-banner.ts` → returns `{current, next, phase}` for a timed crossfade. Picks a random starting banner, rotates every ~8s with a 1s fade. Pauses when the tab is hidden. Same-character banners only.

### 4. Reusable components

- `src/components/character-banner.tsx` — full-width cinematic banner with two stacked `<img>` layers (current + next) for opacity crossfade, dark gradient overlay at bottom, rounded bottom corners, fixed height ≈ `clamp(180px, 28vw, 240px)`. `object-cover`, `object-position: center`. Lazy-loads non-active banners.
- `src/components/character-avatar.tsx` — circular avatar with the existing red glow ring. Selected character → image; otherwise fall back to existing `<Avatar seed=…>`. Same prop surface (`size`, `className`).
- `src/components/character-picker.tsx` — grid of character cards (avatar preview, name, tagline). Selected card glows red (`edge-red` + ring). Tapping previews that character's first banner above the grid with a smooth fade. Locked cards (Ren today) show a subtle "Coming soon" overlay and are non-interactive. Includes a "Skip / use initials" option. Persists to `profiles.character_key` via `supabase.update`.

### 5. Home header (the only layout change)

In `src/components/tabs/home-content.tsx`, replace the current top row only:

```text
[ banner image (≈200px, rounded-b)              ]
[                                ↑ streak chip  ]   ← absolute top-right over banner
[ avatar (overlaps -32px)   "Yo, {name}."       ]
[                            "Today is your day."]
```

- Banner uses `<CharacterBanner />` with timed crossfade.
- Streak chip stays top-right, absolutely positioned over the banner with a subtle dark backdrop so it stays readable.
- Avatar uses `<CharacterAvatar size={64} />`, negatively offset so it overlaps the banner ~50%.
- Greeting text (`Yo, {username}.` + `Today is your day.`) sits to the right of the avatar — same typography as today.
- Everything below (level card, log workout button, stats, achievements, leaders) is **untouched**.

If the user has no `character_key` yet, the banner area is replaced with a slim gradient placeholder + a "Choose your warrior →" link to `/profile`. No layout shift.

### 6. Profile tab

Add a "Character" section in `profile-content.tsx` at the top of the page that mounts `<CharacterPicker />`. Always editable. Selecting updates the DB and refreshes the profile so home/profile banners switch instantly.

### 7. Onboarding (signup)

In `src/routes/auth.tsx`, after a successful `signUp`, instead of immediately `navigate({ to: "/" })`, switch the auth card into a third state `"choose-character"` rendering `<CharacterPicker variant="onboarding" />` with a "Continue" CTA. On confirm → navigate home. Sign-in flow is unchanged (existing users go straight home; if they never picked, the home banner shows the "Choose your warrior" placeholder linking to profile).

### 8. Profile page header

Apply the same banner + overlapping avatar treatment to the top of `profile-content.tsx` for consistency, using the same `<CharacterBanner />` and `<CharacterAvatar />` components.

### 9. Animations

- Banner crossfade: opacity transition 1000ms ease-in-out between two stacked imgs.
- Avatar load: fade-in 300ms.
- Picker selection: existing `edge-red` glow + scale-in 200ms.
- Use existing `animate-fade-up` / `animate-glow` utilities — no new keyframes needed.

### 10. Asset hygiene

- All `<img>` use `object-cover`, fixed banner height, `loading="eager"` for current, `loading="lazy"` for the rest.
- Avatars rendered at intrinsic 1:1, no stretch. The provided avatars already include a red ring — render them edge-to-edge inside the existing ring container so the rings don't double up (use a thin outer glow instead of the component's default ring when a character avatar is shown).
- Mobile-first: banner height clamps `clamp(180px, 28vw, 240px)`.

### Technical notes

- Migration: `ALTER TABLE public.profiles ADD COLUMN character_key text;` (no DB constraint — character set is enforced in app code so adding new keys doesn't need a migration).
- After migration, `src/integrations/supabase/types.ts` is auto-regenerated, so `useProfile` can read `character_key` typed.
- `CharacterPicker` writes via the existing browser supabase client under the user's RLS (owner-only update policy already exists).
- Banner rotation lives entirely in the hook; no global state, no provider needed.

### Out of scope

- Custom user-uploaded avatars/banners (storage bucket + upload UI) — explicitly deferred.
- Using character banners on progression/leaderboard cards — flagged as "future optional", not built now.
- Ren character — placeholder card shown as "Coming soon"; wired up the moment assets are dropped into `src/assets/characters/ren/`.