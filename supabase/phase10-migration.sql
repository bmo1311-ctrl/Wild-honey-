-- ============================================================
-- PHASE 10: RECIPES + CHALLENGES
-- ============================================================

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  ingredients text not null,
  instructions text not null,
  pillar text check (pillar in ('Body','Identity','Mindset','Faith')),
  prep_minutes integer,
  image_url text,
  is_premium boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  pillar text check (pillar in ('Body','Identity','Mindset','Faith')),
  length_days integer not null default 7,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists challenge_checkins (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id, date)
);

alter table recipes enable row level security;
alter table saved_recipes enable row level security;
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table challenge_checkins enable row level security;

drop policy if exists "view recipes" on recipes;
create policy "view recipes" on recipes for select using (auth.role() = 'authenticated');
drop policy if exists "admins manage recipes" on recipes;
create policy "admins manage recipes" on recipes for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));

drop policy if exists "manage own saved recipes" on saved_recipes;
create policy "manage own saved recipes" on saved_recipes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "view challenges" on challenges;
create policy "view challenges" on challenges for select using (auth.role() = 'authenticated');
drop policy if exists "admins manage challenges" on challenges;
create policy "admins manage challenges" on challenges for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));

drop policy if exists "manage own participation" on challenge_participants;
create policy "manage own participation" on challenge_participants for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "view participants of joined challenges" on challenge_participants;
create policy "view participants of joined challenges" on challenge_participants for select
  using (exists (select 1 from challenge_participants cp2 where cp2.challenge_id = challenge_participants.challenge_id and cp2.user_id = auth.uid()));

drop policy if exists "manage own challenge checkins" on challenge_checkins;
create policy "manage own challenge checkins" on challenge_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists recipes_pillar_idx on recipes (pillar);
create index if not exists challenge_checkins_challenge_idx on challenge_checkins (challenge_id, user_id);
