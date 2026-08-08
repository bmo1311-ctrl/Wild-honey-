-- ============================================================
-- PHASE 6: Personalization Engine + Progress/Transformation
-- ============================================================
-- Note: personalization itself reads existing profiles/user_goals/vitality_checkins
-- columns from Phase 5 — no new tables needed for that part.

create table if not exists transformation_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  milestone text not null check (milestone in ('30_day','60_day','90_day','custom')),
  q_changed text,
  q_proud text,
  q_different text,
  q_becoming text,
  created_at timestamptz not null default now()
);

alter table transformation_reflections enable row level security;

drop policy if exists "manage own reflections" on transformation_reflections;
create policy "manage own reflections" on transformation_reflections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists transformation_reflections_user_idx on transformation_reflections (user_id, created_at desc);
