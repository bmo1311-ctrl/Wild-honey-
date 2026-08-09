-- ============================================================
-- PHASE 8: COMMUNITY SAFETY
-- ============================================================

create table if not exists user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists user_mutes (
  id uuid primary key default gen_random_uuid(),
  muter_id uuid not null references profiles(id) on delete cascade,
  muted_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (muter_id, muted_id),
  check (muter_id <> muted_id)
);

create table if not exists content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  content_type text not null check (content_type in (
    'journal_entry','community_post','community_comment','group_post','group_post_comment','circle_comment'
  )),
  content_id uuid not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed','removed')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table user_blocks enable row level security;
alter table user_mutes enable row level security;
alter table content_reports enable row level security;

drop policy if exists "manage own blocks" on user_blocks;
create policy "manage own blocks" on user_blocks for all
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

drop policy if exists "view blocks involving me" on user_blocks;
create policy "view blocks involving me" on user_blocks for select
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "manage own mutes" on user_mutes;
create policy "manage own mutes" on user_mutes for all
  using (auth.uid() = muter_id) with check (auth.uid() = muter_id);

drop policy if exists "submit reports" on content_reports;
create policy "submit reports" on content_reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "view own reports" on content_reports;
create policy "view own reports" on content_reports for select
  using (auth.uid() = reporter_id or exists (select 1 from profiles where id = auth.uid() and is_admin));
drop policy if exists "admins review reports" on content_reports;
create policy "admins review reports" on content_reports for update
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));

create index if not exists user_blocks_blocker_idx on user_blocks (blocker_id);
create index if not exists user_blocks_blocked_idx on user_blocks (blocked_id);
create index if not exists user_mutes_muter_idx on user_mutes (muter_id);
create index if not exists content_reports_status_idx on content_reports (status, created_at desc);
