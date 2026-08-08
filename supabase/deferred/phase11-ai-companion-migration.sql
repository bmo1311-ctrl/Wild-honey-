-- ============================================================
-- PHASE 11: AI WELLNESS COMPANION
-- ============================================================

create table if not exists companion_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table companion_messages enable row level security;

drop policy if exists "manage own companion messages" on companion_messages;
create policy "manage own companion messages" on companion_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists companion_messages_user_idx on companion_messages (user_id, created_at);
