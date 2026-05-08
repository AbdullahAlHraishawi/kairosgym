
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Plan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_user_id_idx on public.plans(user_id);

create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  day_index int not null default 0,
  name text
);
create index plan_days_plan_id_idx on public.plan_days(plan_id);

create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  order_idx int not null default 0
);
create index plan_exercises_day_id_idx on public.plan_exercises(day_id);

create table public.plan_sets (
  id uuid primary key default gen_random_uuid(),
  plan_exercise_id uuid not null references public.plan_exercises(id) on delete cascade,
  set_idx int not null default 1,
  weight numeric not null default 0,
  reps int not null default 0
);
create index plan_sets_plan_exercise_id_idx on public.plan_sets(plan_exercise_id);

alter table public.plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.plan_sets enable row level security;

create policy "Users read own plans" on public.plans for select using (auth.uid() = user_id);
create policy "Users insert own plans" on public.plans for insert with check (auth.uid() = user_id);
create policy "Users update own plans" on public.plans for update using (auth.uid() = user_id);
create policy "Users delete own plans" on public.plans for delete using (auth.uid() = user_id);

create policy "Users read own plan_days" on public.plan_days for select
  using (exists (select 1 from public.plans p where p.id = plan_days.plan_id and p.user_id = auth.uid()));
create policy "Users insert own plan_days" on public.plan_days for insert
  with check (exists (select 1 from public.plans p where p.id = plan_days.plan_id and p.user_id = auth.uid()));
create policy "Users update own plan_days" on public.plan_days for update
  using (exists (select 1 from public.plans p where p.id = plan_days.plan_id and p.user_id = auth.uid()));
create policy "Users delete own plan_days" on public.plan_days for delete
  using (exists (select 1 from public.plans p where p.id = plan_days.plan_id and p.user_id = auth.uid()));

create policy "Users read own plan_exercises" on public.plan_exercises for select
  using (exists (
    select 1 from public.plan_days d join public.plans p on p.id = d.plan_id
    where d.id = plan_exercises.day_id and p.user_id = auth.uid()
  ));
create policy "Users insert own plan_exercises" on public.plan_exercises for insert
  with check (exists (
    select 1 from public.plan_days d join public.plans p on p.id = d.plan_id
    where d.id = plan_exercises.day_id and p.user_id = auth.uid()
  ));
create policy "Users update own plan_exercises" on public.plan_exercises for update
  using (exists (
    select 1 from public.plan_days d join public.plans p on p.id = d.plan_id
    where d.id = plan_exercises.day_id and p.user_id = auth.uid()
  ));
create policy "Users delete own plan_exercises" on public.plan_exercises for delete
  using (exists (
    select 1 from public.plan_days d join public.plans p on p.id = d.plan_id
    where d.id = plan_exercises.day_id and p.user_id = auth.uid()
  ));

create policy "Users read own plan_sets" on public.plan_sets for select
  using (exists (
    select 1 from public.plan_exercises pe
    join public.plan_days d on d.id = pe.day_id
    join public.plans p on p.id = d.plan_id
    where pe.id = plan_sets.plan_exercise_id and p.user_id = auth.uid()
  ));
create policy "Users insert own plan_sets" on public.plan_sets for insert
  with check (exists (
    select 1 from public.plan_exercises pe
    join public.plan_days d on d.id = pe.day_id
    join public.plans p on p.id = d.plan_id
    where pe.id = plan_sets.plan_exercise_id and p.user_id = auth.uid()
  ));
create policy "Users update own plan_sets" on public.plan_sets for update
  using (exists (
    select 1 from public.plan_exercises pe
    join public.plan_days d on d.id = pe.day_id
    join public.plans p on p.id = d.plan_id
    where pe.id = plan_sets.plan_exercise_id and p.user_id = auth.uid()
  ));
create policy "Users delete own plan_sets" on public.plan_sets for delete
  using (exists (
    select 1 from public.plan_exercises pe
    join public.plan_days d on d.id = pe.day_id
    join public.plans p on p.id = d.plan_id
    where pe.id = plan_sets.plan_exercise_id and p.user_id = auth.uid()
  ));

create trigger plans_touch_updated_at
  before update on public.plans
  for each row execute function public.touch_updated_at();
