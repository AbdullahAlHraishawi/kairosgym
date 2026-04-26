-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  title text not null default 'Novice',
  avatar_seed text not null default 'K',
  total_xp integer not null default 0,
  level integer not null default 0,
  streak integer not null default 0,
  last_workout_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_seed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'username', new.email), 1))
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ EXERCISES ============
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text not null default 'Bodyweight'
);

alter table public.exercises enable row level security;
create policy "Exercises are viewable by all" on public.exercises for select using (true);

insert into public.exercises (name, muscle_group, equipment) values
  ('Bench Press', 'Chest', 'Barbell'),
  ('Incline Dumbbell Press', 'Chest', 'Dumbbell'),
  ('Push-Up', 'Chest', 'Bodyweight'),
  ('Cable Fly', 'Chest', 'Cable'),
  ('Pull-Up', 'Back', 'Bodyweight'),
  ('Deadlift', 'Back', 'Barbell'),
  ('Barbell Row', 'Back', 'Barbell'),
  ('Lat Pulldown', 'Back', 'Cable'),
  ('Back Squat', 'Legs', 'Barbell'),
  ('Romanian Deadlift', 'Legs', 'Barbell'),
  ('Leg Press', 'Legs', 'Machine'),
  ('Walking Lunge', 'Legs', 'Dumbbell'),
  ('Overhead Press', 'Shoulders', 'Barbell'),
  ('Lateral Raise', 'Shoulders', 'Dumbbell'),
  ('Face Pull', 'Shoulders', 'Cable'),
  ('Barbell Curl', 'Arms', 'Barbell'),
  ('Hammer Curl', 'Arms', 'Dumbbell'),
  ('Triceps Pushdown', 'Arms', 'Cable'),
  ('Skull Crusher', 'Arms', 'Barbell');

-- ============ WORKOUTS ============
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  xp_earned integer not null default 0
);

alter table public.workouts enable row level security;
create policy "Users read own workouts" on public.workouts for select using (auth.uid() = user_id);
create policy "Users insert own workouts" on public.workouts for insert with check (auth.uid() = user_id);
create policy "Users update own workouts" on public.workouts for update using (auth.uid() = user_id);
create policy "Users delete own workouts" on public.workouts for delete using (auth.uid() = user_id);

-- ============ WORKOUT_EXERCISES ============
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  order_idx integer not null default 0
);

alter table public.workout_exercises enable row level security;

create policy "Users read own workout exercises" on public.workout_exercises for select
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "Users insert own workout exercises" on public.workout_exercises for insert
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "Users update own workout exercises" on public.workout_exercises for update
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "Users delete own workout exercises" on public.workout_exercises for delete
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- ============ WORKOUT_SETS ============
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_idx integer not null default 1,
  weight numeric(6,2) not null default 0,
  reps integer not null default 0,
  completed boolean not null default false
);

alter table public.workout_sets enable row level security;

create policy "Users read own sets" on public.workout_sets for select
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));
create policy "Users insert own sets" on public.workout_sets for insert
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));
create policy "Users update own sets" on public.workout_sets for update
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));
create policy "Users delete own sets" on public.workout_sets for delete
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));

-- ============ ACHIEVEMENTS ============
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null default 'trophy'
);

alter table public.achievements enable row level security;
create policy "Achievements viewable by all" on public.achievements for select using (true);

insert into public.achievements (code, name, description, icon) values
  ('first_workout', 'First Blood', 'Complete your first workout', 'flame'),
  ('streak_3', 'On Fire', 'Maintain a 3-day streak', 'zap'),
  ('workouts_5', 'Disciplined', 'Complete 5 workouts', 'shield'),
  ('workouts_10', 'Relentless', 'Complete 10 workouts', 'sword'),
  ('level_5', 'Warrior', 'Reach level 5', 'crown');

-- ============ USER_ACHIEVEMENTS ============
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "Users read own achievements" on public.user_achievements for select using (auth.uid() = user_id);
create policy "Users insert own achievements" on public.user_achievements for insert with check (auth.uid() = user_id);

-- helpful indexes
create index idx_workouts_user_started on public.workouts(user_id, started_at desc);
create index idx_workout_exercises_workout on public.workout_exercises(workout_id);
create index idx_workout_sets_we on public.workout_sets(workout_exercise_id);
create index idx_profiles_xp on public.profiles(total_xp desc);