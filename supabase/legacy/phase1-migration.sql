-- ============================================================
-- PHASE 1: Daily Experience + Energy & Wellness Dashboard
-- ============================================================

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  energy int check (energy between 1 and 10),
  mood text,
  stress int check (stress between 1 and 10),
  sleep_quality int check (sleep_quality between 1 and 10),
  hydration_oz numeric,
  protein_g numeric,
  sunlight_minutes int,
  movement_minutes int,
  cycle_phase text check (cycle_phase in ('menstrual','follicular','ovulation','luteal','not_tracked')),
  symptoms text[] default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists morning_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  intention text,
  gratitude text,
  completed_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists evening_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  q1 text,
  q2 text,
  q3 text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  kind text not null default 'win' check (kind in ('win','gratitude','prayer','compliment','courage')),
  text text not null,
  created_at timestamptz not null default now()
);

alter table checkins enable row level security;
alter table morning_resets enable row level security;
alter table evening_reflections enable row level security;
alter table wins enable row level security;

drop policy if exists "manage own checkins" on checkins;
create policy "manage own checkins" on checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own morning resets" on morning_resets;
create policy "manage own morning resets" on morning_resets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own evening reflections" on evening_reflections;
create policy "manage own evening reflections" on evening_reflections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own wins" on wins;
create policy "manage own wins" on wins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists checkins_user_date_idx on checkins (user_id, date desc);
create index if not exists wins_user_date_idx on wins (user_id, date desc);
