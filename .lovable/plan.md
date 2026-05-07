## Goal

Massively expand the KAIROS exercise library and make search/filtering smarter, without changing the visual design of `/workout`. Existing card layout, hero, sticky CTA, colors, and spacing stay exactly as they are.

## 1. Database schema changes (migration)

Extend the `exercises` table with structured fields:

- `secondary_muscles text[]` — e.g. `{Triceps, Shoulders}` (default `{}`)
- `difficulty text` — `Beginner | Intermediate | Advanced` (default `Beginner`)
- `exercise_type text` — `Compound | Isolation | Cardio` (default `Compound`)
- `aliases text[]` — short forms like `{rdl, romanian deadlift}` (default `{}`)
- `slug text unique` — stable id like `bench-press` for idempotent upserts

Also widen `muscle_group` allowed values (no enum currently — just text, so no constraint change needed) to include: `Chest, Back, Legs, Shoulders, Arms, Core, Glutes, Forearms, Calves, Full Body, Cardio`.

Add indexes for performant search/filter:

- `CREATE INDEX exercises_muscle_group_idx ON exercises(muscle_group);`
- `CREATE INDEX exercises_equipment_idx ON exercises(equipment);`
- `CREATE INDEX exercises_exercise_type_idx ON exercises(exercise_type);`
- `CREATE INDEX exercises_name_trgm_idx ON exercises USING gin (name gin_trgm_ops);` (enable `pg_trgm` extension)
- `CREATE INDEX exercises_aliases_gin_idx ON exercises USING gin (aliases);`

RLS unchanged (already public-read).

## 2. Seed the library (data insert)

Bulk `INSERT ... ON CONFLICT (slug) DO UPDATE` ~150–180 real exercises. Existing 19 rows get upgraded in place via the slug match; everything else is added. No duplicates, no fictional moves.

Coverage breakdown (target counts, ±a few):

```text
Chest        20   barbell, dumbbell, machine, cable, smith, bodyweight, incline/decline variants
Back         22   rows, pulldowns, pull-ups, deadlift family, shrugs (trap), rear delt
Shoulders    16   OHP, presses, raises (lat/front/rear), upright row, face pull, cable variants
Arms         22   biceps + triceps: barbell, EZ, dumbbell, cable, machine, bodyweight
Legs         24   squat family, leg press, hack squat, lunges, leg ext/curl, hip thrust intro
Glutes       10   hip thrust, glute bridge, cable kickback, abduction machine, Bulgarian split
Core/Abs     14   plank, crunch, leg raise, cable crunch, ab wheel, hanging knee raise
Forearms      6   wrist curl variants, reverse curl, farmer carry
Calves        6   standing/seated calf raise, smith, leg press calf
Full Body     6   clean, snatch, thruster, burpee, kettlebell swing, turkish get-up
Cardio        8   treadmill, bike, rower, elliptical, stairmaster, jump rope, sled push, assault bike
```

Each row stores: `slug, name, muscle_group, equipment, secondary_muscles, difficulty, exercise_type, aliases`. Aliases include common shortcuts: `rdl, ohp, bb row, db curl, lat pull, tri pushdown, skullcrusher, hip thrust, kb swing, bss (bulgarian split squat)`, etc.

## 3. Frontend types + data layer (`/workout` only)

Update local `Exercise` type in `src/routes/workout.index.tsx` to include the new optional fields. Supabase types regenerate automatically — no edit to `types.ts`.

Search/filter logic upgrades (pure logic; UI markup unchanged):

- **Search** — match if the lowercased query is a substring of `name`, any `aliases` entry, or `muscle_group`. Also match initials (first letter of each word in `name`) against the query so `bp` → `Bench Press`, `rdl` → `Romanian Deadlift` even without an alias row.
- **Filtering** — replace single `filter` state with two stacking filter groups:
  - Muscle: `All, Chest, Back, Legs, Shoulders, Arms, Core, Glutes` (Forearms/Calves/Full Body/Cardio reachable via "More" chip overflow — same chip style, just a longer scrollable row, which the existing `overflow-x-auto` already supports)
  - Equipment: `All, Barbell, Dumbbell, Cable, Machine, Bodyweight, Smith, Kettlebell` (second horizontal chip row directly below the muscle row, using identical chip styling)
  - Both rows AND together. Default `All / All`.
- All filtering/search runs client-side over the in-memory list — already fast for ~180 rows. Wrap the filter in `useMemo` (already there) and debounce the query input by 120ms via a tiny inline `useDeferredValue` to keep typing smooth.

## 4. Card content (no visual redesign)

The existing card already shows `name` and `muscle_group · equipment` in the same line. Keep that exactly. No new badges, no extra rows, no color changes — the brief explicitly forbids redesign and the current tag line already satisfies "primary muscle • equipment".

## 5. Out of scope (explicit)

- No changes to `/progress`, `/workout/log`, builder layout, bottom nav, swipe nav.
- No new routes, no detail page, no images per exercise.
- No changes to XP, calories, achievements.
- No edits to `src/integrations/supabase/types.ts` (auto-generated).

## 6. Verification

- `supabase--read_query` after migration: `SELECT muscle_group, COUNT(*) FROM exercises GROUP BY 1 ORDER BY 1;` confirms coverage matches the table above.
- Manual checks against the brief's examples: "bench" → Bench Press + Incline + Smith Bench; "lat" → Lat Pulldown; "rdl" → Romanian Deadlift; "tri" → Triceps Pushdown.
- Stack filters: Chest + Dumbbell shows only DB chest moves; Legs + Machine shows leg press, hack squat, leg ext, leg curl.
- Confirm `/workout` page renders unchanged visually (same hero, same chips, same cards, same sticky CTA).

## Technical notes

- Migration order: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` → `ALTER TABLE` adds columns → backfill `slug` for existing 19 rows from `lower(replace(name,' ','-'))` → add unique constraint on `slug` → create indexes.
- Seed runs as one large `INSERT ... ON CONFLICT (slug) DO UPDATE SET ...` so re-running is safe and existing rows get the new metadata without breaking foreign keys from `workout_exercises`.
