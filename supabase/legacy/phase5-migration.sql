-- ============================================================
-- PHASE 5: ONBOARDING + HONEY PROFILE
-- ============================================================

alter table profiles add column if not exists birthday date;
alter table profiles add column if not exists age_range text;
alter table profiles add column if not exists timezone text;
alter table profiles add column if not exists season text check (season in (
  'rebuilding','growing','healing','motherhood','entrepreneurship',
  'career_expansion','transition','deepening_faith','finding_balance','becoming_healthiest'
));
alter table profiles add column if not exists faith_preference text check (faith_preference in (
  'regularly','occasionally','when_i_choose','not_now'
));
alter table profiles add column if not exists communication_style text check (communication_style in (
  'gentle','direct','inspirational','educational','reminders','deep_dives'
));
alter table profiles add column if not exists wake_time text;
alter table profiles add column if not exists bedtime text;
alter table profiles add column if not exists movement_preference text;
alter table profiles add column if not exists hydration_goal_oz integer;
alter table profiles add column if not exists caffeine text;
alter table profiles add column if not exists foods_avoided text;
alter table profiles add column if not exists allergies text;
alter table profiles add column if not exists onboarding_completed_at timestamptz;

-- Backfill: existing members should NOT be forced through onboarding retroactively.
-- New signups get onboarding_completed_at = null (via the handle_new_user trigger,
-- which doesn't set this column), which is what triggers the wizard.
update profiles set onboarding_completed_at = created_at where onboarding_completed_at is null;

-- Multi-select goals chosen during onboarding (and editable later)
create table if not exists user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  goal text not null check (goal in (
    'more_energy','better_sleep','stress_reduction','strength','nourishment',
    'womens_health_education','confidence','spiritual_growth','emotional_wellness',
    'better_routines','community','joy'
  )),
  created_at timestamptz not null default now(),
  unique (user_id, goal)
);

-- Vitality baseline + later checkpoints, powers the 30/60/90-day transformation view
create table if not exists vitality_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  energy smallint check (energy between 1 and 10),
  mood smallint check (mood between 1 and 10),
  stress smallint check (stress between 1 and 10),
  sleep smallint check (sleep between 1 and 10),
  confidence smallint check (confidence between 1 and 10),
  motivation smallint check (motivation between 1 and 10),
  mental_clarity smallint check (mental_clarity between 1 and 10),
  physical_strength smallint check (physical_strength between 1 and 10),
  label text not null default 'checkpoint' check (label in ('baseline','checkpoint')),
  note text,
  taken_at timestamptz not null default now()
);

alter table user_goals enable row level security;
alter table vitality_checkins enable row level security;

drop policy if exists "manage own goals" on user_goals;
create policy "manage own goals" on user_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own vitality checkins" on vitality_checkins;
create policy "manage own vitality checkins" on vitality_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists user_goals_user_idx on user_goals (user_id);
create index if not exists vitality_checkins_user_idx on vitality_checkins (user_id, taken_at);
