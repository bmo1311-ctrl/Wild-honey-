-- ============================================================
-- PHASE 7: PRIVACY & ACCOUNT CONTROLS + ADMIN MEMBER MANAGEMENT
-- ============================================================

alter table profiles add column if not exists notification_prefs jsonb not null default '{}';
alter table profiles add column if not exists quiet_hours_start text;
alter table profiles add column if not exists quiet_hours_end text;
alter table profiles add column if not exists data_consent_at timestamptz;

-- Admins can see every member (for the admin member-management screen).
-- Additive/permissive: does not remove the existing "own row" access.
drop policy if exists "admins view all profiles" on profiles;
create policy "admins view all profiles" on profiles for select
  using (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.is_admin));

drop policy if exists "admins update any profile" on profiles;
create policy "admins update any profile" on profiles for update
  using (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.is_admin))
  with check (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.is_admin));

-- Hardening: a member's own "update own row" RLS policy allows changing any
-- column on their own row, including is_admin / membership_tier. This trigger
-- silently reverts those two fields unless the request comes from an admin
-- or from a trusted service-role context (auth.uid() is null there).
create or replace function prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if (new.is_admin is distinct from old.is_admin or new.membership_tier is distinct from old.membership_tier) then
    if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
      new.is_admin := old.is_admin;
      new.membership_tier := old.membership_tier;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_privilege_escalation on profiles;
create trigger trg_prevent_self_privilege_escalation
before update on profiles
for each row execute function prevent_self_privilege_escalation();
