-- ============================================================
-- HOTFIX: infinite recursion in profiles RLS policies
-- ============================================================
-- The Phase 7 "admins view/update any profile" policies checked admin
-- status via a subquery on `profiles` from within a policy attached to
-- `profiles` itself — Postgres cannot safely evaluate that and throws
-- "infinite recursion detected in policy for relation profiles" on
-- every single query, for every user, breaking all sign-ins.
--
-- Fix: check admin status through a SECURITY DEFINER function, which
-- runs as the table owner and bypasses RLS internally, avoiding the
-- self-referencing loop entirely. This is the standard, safe pattern.

create or replace function public.is_admin_user(check_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = check_user_id), false);
$$;

drop policy if exists "admins view all profiles" on profiles;
create policy "admins view all profiles" on profiles for select
  using (public.is_admin_user(auth.uid()));

drop policy if exists "admins update any profile" on profiles;
create policy "admins update any profile" on profiles for update
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));
