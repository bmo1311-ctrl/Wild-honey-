-- ============================================================
-- PHASE 2: Habit Stacking + Personalized Protocols
-- ============================================================

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  anchor text,
  pillar text check (pillar in ('Body','Identity','Mindset','Faith')),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  completed_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- protocols themselves are static, defined in code (lib/protocols.ts) —
-- only enrollment/progress needs to live in the DB.
create table if not exists protocol_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  protocol_slug text not null,
  is_active boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists protocol_day_completions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references protocol_enrollments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  day_number int not null,
  completed_at timestamptz not null default now(),
  unique (enrollment_id, day_number)
);

alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table protocol_enrollments enable row level security;
alter table protocol_day_completions enable row level security;

drop policy if exists "manage own habits" on habits;
create policy "manage own habits" on habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own habit logs" on habit_logs;
create policy "manage own habit logs" on habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own protocol enrollments" on protocol_enrollments;
create policy "manage own protocol enrollments" on protocol_enrollments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own protocol day completions" on protocol_day_completions;
create policy "manage own protocol day completions" on protocol_day_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists habit_logs_user_date_idx on habit_logs (user_id, date desc);
create index if not exists protocol_enrollments_user_idx on protocol_enrollments (user_id, is_active);
