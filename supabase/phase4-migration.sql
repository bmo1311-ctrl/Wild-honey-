-- ============================================================
-- PHASE 4: Private Groups (+ Retreat Integration) + Ask an Expert
-- ============================================================
-- Note: called "groups" (not "circles") to avoid confusion with the
-- existing "Circle" journal-sharing feed (journal_entries visibility='circle').

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_code text not null unique,
  pillar text check (pillar in ('Body','Identity','Mindset','Faith')),
  retreat_id uuid references retreats(id) on delete set null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists group_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references group_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists group_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references group_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- link retreats to their (optional) attendee group
alter table retreats add column if not exists group_id uuid references groups(id) on delete set null;

-- Ask an Expert
create table if not exists expert_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pillar text check (pillar in ('Body','Identity','Mindset','Faith')),
  question text not null,
  answer text,
  answered_at timestamptz,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_posts enable row level security;
alter table group_post_reactions enable row level security;
alter table group_post_comments enable row level security;
alter table expert_questions enable row level security;

-- groups: name/description visible to any authenticated user so invite-code
-- lookups work; actual content (posts) is gated by membership below.
drop policy if exists "view groups" on groups;
create policy "view groups" on groups for select using (auth.role() = 'authenticated');
drop policy if exists "create groups" on groups;
create policy "create groups" on groups for insert with check (auth.uid() = created_by);
drop policy if exists "owner manages group" on groups;
create policy "owner manages group" on groups for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "view own group memberships" on group_members;
create policy "view own group memberships" on group_members for select
  using (exists (select 1 from group_members gm2 where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()));
drop policy if exists "join groups" on group_members;
create policy "join groups" on group_members for insert with check (auth.uid() = user_id);
drop policy if exists "leave groups" on group_members;
create policy "leave groups" on group_members for delete using (auth.uid() = user_id);

drop policy if exists "view group posts" on group_posts;
create policy "view group posts" on group_posts for select
  using (exists (select 1 from group_members gm where gm.group_id = group_posts.group_id and gm.user_id = auth.uid()));
drop policy if exists "post to group" on group_posts;
create policy "post to group" on group_posts for insert
  with check (auth.uid() = user_id and exists (select 1 from group_members gm where gm.group_id = group_posts.group_id and gm.user_id = auth.uid()));

drop policy if exists "view group post reactions" on group_post_reactions;
create policy "view group post reactions" on group_post_reactions for select
  using (exists (select 1 from group_posts gp join group_members gm on gm.group_id = gp.group_id where gp.id = group_post_reactions.post_id and gm.user_id = auth.uid()));
drop policy if exists "react to group post" on group_post_reactions;
create policy "react to group post" on group_post_reactions for insert
  with check (auth.uid() = user_id and exists (select 1 from group_posts gp join group_members gm on gm.group_id = gp.group_id where gp.id = group_post_reactions.post_id and gm.user_id = auth.uid()));
drop policy if exists "remove own group reaction" on group_post_reactions;
create policy "remove own group reaction" on group_post_reactions for delete using (auth.uid() = user_id);

drop policy if exists "view group post comments" on group_post_comments;
create policy "view group post comments" on group_post_comments for select
  using (exists (select 1 from group_posts gp join group_members gm on gm.group_id = gp.group_id where gp.id = group_post_comments.post_id and gm.user_id = auth.uid()));
drop policy if exists "comment on group post" on group_post_comments;
create policy "comment on group post" on group_post_comments for insert
  with check (auth.uid() = user_id and exists (select 1 from group_posts gp join group_members gm on gm.group_id = gp.group_id where gp.id = group_post_comments.post_id and gm.user_id = auth.uid()));

drop policy if exists "view own or public questions" on expert_questions;
create policy "view own or public questions" on expert_questions for select
  using (
    auth.uid() = user_id
    or (answer is not null and is_public = true)
    or exists (select 1 from profiles where id = auth.uid() and is_admin)
  );
drop policy if exists "ask a question" on expert_questions;
create policy "ask a question" on expert_questions for insert with check (auth.uid() = user_id);
drop policy if exists "admins answer questions" on expert_questions;
create policy "admins answer questions" on expert_questions for update
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));

create index if not exists group_members_user_idx on group_members (user_id);
create index if not exists group_posts_group_idx on group_posts (group_id, created_at desc);
create index if not exists expert_questions_user_idx on expert_questions (user_id, created_at desc);
create index if not exists expert_questions_public_idx on expert_questions (is_public, answered_at desc) where answer is not null;
