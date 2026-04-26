## Redesign the Login Page (`/auth`)

Rebuild the auth screen to match the uploaded mockup pixel-for-pixel — cinematic anime hero up top with a smooth 3-image crossfade, KR logo + KAIROS wordmark, glassy login card, and the TRACK / ACHIEVE / EVOLVE footer.

### What you'll see

```text
┌─────────────────────────┐
│   [Anime hero — fades   │
│    between 3 images,    │
│    5s each, dark+red    │
│    overlay for legibility]
│                         │
│        [KR LOGO]        │  ← red glow pulse
│         KAIROS          │  ← wide tracking, glow
│  Discipline meets timing.│  ← red, underline accent
│                         │
│  ╭──── glass card ────╮ │
│  │   WELCOME BACK     │ │
│  │ Sign in to continue│ │
│  │                    │ │
│  │ EMAIL              │ │
│  │ [✉  enter email  ] │ │  ← red glow on focus
│  │                    │ │
│  │ PASSWORD           │ │
│  │ [🔒 enter pwd  👁 ]│ │
│  │       Forgot Password? │
│  │                    │ │
│  │ ┌──── LOGIN  →───┐ │ │  ← red, glowing
│  │ ───── OR ──────    │ │
│  │ ┌─ + CREATE ACCT ─┐│ │  ← outlined red
│  ╰────────────────────╯ │
│                         │
│  🏋 TRACK  🏆 ACHIEVE  🔥 EVOLVE │
└─────────────────────────┘
```

### Hero crossfade
- Three full-width anime portraits (the Ren-style images you uploaded) stacked absolutely.
- Each is visible for 5 seconds with a ~1s fade transition between them, looping.
- Dark gradient + slight blur overlay sits above them so the brand and form stay readable.
- The KR logo + KAIROS wordmark + tagline sit centered over the hero.

### Login card
- `#1A1D23` at ~85% opacity with `backdrop-blur` and rounded 16px corners.
- Inputs: dark fill, subtle border, leading icon (envelope/lock), red glow ring on focus, eye toggle for password.
- "Forgot Password?" small link, right-aligned, gray → red on tap.
- LOGIN: full-width red button with arrow icon, glow shadow, scale-down + glow pulse on press.
- Divider with "OR" centered.
- CREATE ACCOUNT: outlined red, transparent, user-plus icon. Toggles the form into signup mode (uses existing Supabase signup flow).

### Footer brand strip
- Three small red icons + labels: Dumbbell / TRACK · Trophy / ACHIEVE · Flame / EVOLVE.
- Subtle red glow, minimal spacing, sits below the card.

### Animations
- Page fade-in on mount.
- Card slides up ~12px with fade on mount.
- Hero crossfade loop (5s hold + 1s fade).
- Input focus: red glow ring transition.
- Button press: scale 0.97 + glow pulse (already in design system).

### Technical notes
- Files added: `src/assets/hero-1.png`, `src/assets/hero-2.png`, `src/assets/hero-3.png` (the three uploaded portraits).
- File rewritten: `src/routes/auth.tsx` — keeps the existing Supabase email/password sign-in + sign-up logic, just reskins the UI and adds the hero carousel + signup toggle.
- New small component inline: `HeroCarousel` using a `useEffect` interval and CSS opacity transitions (no extra deps).
- KAIROS wordmark: rendered as text with wide letter-spacing and a subtle text-shadow glow (matches mockup; no new font needed).
- KR logo: reuse `/icon-512.png` (the logo you set as the favicon) with a red drop-shadow glow.
- All colors via existing tokens in `src/styles.css` (`--primary`, `--card`, `--background`, `--muted-foreground`).
- Mobile-only: stays inside the `max-w-md` mobile shell, no desktop layout work.
- No DB or schema changes. No new dependencies.
