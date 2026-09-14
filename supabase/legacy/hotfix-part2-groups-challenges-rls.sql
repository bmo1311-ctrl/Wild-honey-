-- ============================================================
-- HOTFIX PART 2: same recursion bug in group_members and
-- challenge_participants — both had a policy on table X that
-- queries table X to check "am I already a member of this group/
-- challenge". Same fix: route through a SECURITY DEFINER function.
-- ============================================================

create or replace function public.is_group_member(check_group_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from group_members
    where group_id = check_group_id and user_id = check_user_id
  );
$$;

drop policy if exists "view own group memberships" on group_members;
create policy "view own group memberships" on group_members for select
  using (public.is_group_member(group_id, auth.uid()));

create or replace function public.is_challenge_participant(check_challenge_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from challenge_participants
    where challenge_id = check_challenge_id and user_id = check_user_id
  );
$$;

drop policy if exists "view participants of joined challenges" on challenge_participants;
create policy "view participants of joined challenges" on challenge_participants for select
  using (public.is_challenge_participant(challenge_id, auth.uid()));
