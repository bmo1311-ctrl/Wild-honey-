-- ============================================================
-- PHASE 3: Pantry + Grocery Builder + Resource Vault
-- ============================================================

create table if not exists pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text not null default 'other' check (category in ('produce','protein','dairy','grains','pantry','frozen','spices','other')),
  quantity text,
  running_low boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists grocery_builder_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text not null default 'other' check (category in ('produce','protein','dairy','grains','pantry','frozen','spices','other')),
  quantity text,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- admin-curated resource library
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text,
  resource_type text not null default 'article' check (resource_type in ('article','video','pdf','audio','link')),
  pillar text check (pillar in ('Body','Identity','Mindset','Faith')),
  created_at timestamptz not null default now()
);

create table if not exists saved_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

alter table pantry_items enable row level security;
alter table grocery_builder_items enable row level security;
alter table resources enable row level security;
alter table saved_resources enable row level security;

drop policy if exists "manage own pantry items" on pantry_items;
create policy "manage own pantry items" on pantry_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manage own grocery builder items" on grocery_builder_items;
create policy "manage own grocery builder items" on grocery_builder_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "view resources" on resources;
create policy "view resources" on resources for select using (auth.role() = 'authenticated');
drop policy if exists "admins manage resources" on resources;
create policy "admins manage resources"
  on resources for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));

drop policy if exists "manage own saved resources" on saved_resources;
create policy "manage own saved resources" on saved_resources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists pantry_items_user_idx on pantry_items (user_id, category);
create index if not exists grocery_builder_items_user_idx on grocery_builder_items (user_id, checked);
create index if not exists resources_pillar_idx on resources (pillar);
