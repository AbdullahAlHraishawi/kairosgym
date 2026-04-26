# KAIROS — Mobile Fitness Gamification App

A premium, dark, mobile-only PWA-installable fitness app where logging workouts earns XP, levels, and badges. Anime-inspired accents, clean UI.

## Design system

Applied globally via `src/styles.css`:
- Background `#0F1115`, cards `#1A1D23`, primary red `#C23B3B`, blue accent `#3A6EA5`
- Text `#E6E6E6` / muted `#9AA0A6`
- Soft rounded corners, subtle shadows, red glow on primary actions
- Sans-serif (Inter), strong numeric hierarchy for XP/Level
- Layout capped at ~max-w-md, centered, with mobile bottom nav

## Screens (routes)

```text
/              Home dashboard
/workout       Browse + start workout
/workout/log   Active workout (add exercises, sets/reps/weight, finish → XP)
/progress      Charts + lifetime stats
/leaderboard   Top users (mock)
/profile       Avatar, level, badges, menu
/auth          Sign in / sign up
/ranks         Rank tiers (sub-page from profile)
```

Bottom tab bar: Home · Workout · Progress · Leaderboard · Profile.

### 1. Home
Avatar circle (initials over dark gradient), greeting, level card with animated XP bar, streak chip (🔥), large red "Log Workout" CTA with red glow, today's progress bar, stat cards (workouts / weekly XP / calories), horizontal achievements scroll (locked dimmed), top-3 leaderboard preview.

### 2. Workout
Hero banner (gradient + icon placeholder), search bar, muscle-group filter chips (All/Chest/Back/Legs/Shoulders/Arms), exercise list rows with name, muscle group, equipment, + button. "Create Workout" CTA opens active log screen.

### 3. Active workout log
Selected exercises with sets table (set #, weight, reps, ✓). Add set, add exercise. Finish button computes XP (+100 base, +10/set), saves workout, shows animated XP gain overlay, updates streak.

### 4. Progress
Weekly XP bar chart (recharts), % delta vs last week, simple front/back body silhouette with trained muscles highlighted in red, lifetime stat tiles.

### 5. Profile
Avatar, username, title, level + XP bar, rank badge with "View Ranks", badge grid, menu list (Stats, Achievements, History, Friends [coming soon], Settings, Sign out).

### 6. Auth
Email + password sign in / sign up using Supabase. Auto-creates profile row.

## Functionality

- **Auth**: Supabase email/password. Protected routes redirect to `/auth`.
- **XP & Level**: `level = floor(sqrt(total_xp / 100))`. Title derived from level (Novice → Warrior → Berserker → Relentless → Kairos).
- **Streak**: increment if last workout was yesterday, reset if older, no-op if today.
- **Achievements**: First Workout, 3-Day Streak, 5 Workouts — unlocked after each finish, surfaced via toast.
- **Animations**: Framer-motion-free CSS animations — XP bar fill, button press, page fade, XP gain count-up overlay.

## PWA (installable only)

Per your choice: web manifest + icons + theme color, `display: standalone`. **No service worker** (avoids preview iframe issues). Users can "Add to Home Screen" on iOS/Android.

## Database (Supabase)

```text
profiles(id pk → auth.users, username, title, avatar_seed,
         total_xp int default 0, level int default 0,
         streak int default 0, last_workout_date date)
exercises(id, name, muscle_group, equipment)            -- seeded
workouts(id, user_id, started_at, finished_at, xp_earned)
workout_exercises(id, workout_id, exercise_id, order_idx)
workout_sets(id, workout_exercise_id, set_idx, weight, reps, completed)
achievements(id, code unique, name, description, icon)  -- seeded
user_achievements(id, user_id, achievement_id, unlocked_at, unique(user_id, achievement_id))
```

RLS: users can only read/write their own profile, workouts, workout_exercises, sets, user_achievements. `exercises` and `achievements` are publicly readable. Profile auto-created via trigger on `auth.users` insert. Leaderboard reads top profiles by `total_xp` (public read of `username, total_xp, level, title, avatar_seed` only).

## Technical notes

- TanStack Start file-based routes under `src/routes/`, each page a separate route with its own `head()` meta.
- Shared `MobileShell` component wraps every authenticated route with bottom nav and max-width container.
- Tailwind v4 tokens added to `src/styles.css` (`--background`, `--primary`, `--accent`, etc. in oklch).
- Auth state via `supabase.auth.onAuthStateChange` in a `useAuth` hook; redirects handled in route `beforeLoad`.
- Leaderboard shows mock data this phase; UI ready to swap for real query later.
- Avatars: deterministic initials + colored gradient block (no AI images, no uploads yet).
- Charts: `recharts` for weekly XP.
- Toasts: existing `sonner`.

## Out of scope (Phase 2)
Friend system, social feed, real leaderboard rankings, exercise demo videos, rest timer, plate calculator, offline service worker.
