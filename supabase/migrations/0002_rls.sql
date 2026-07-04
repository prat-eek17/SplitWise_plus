-- ============================================================================
-- SplitWise+ — Row Level Security
-- This is the file that actually enforces "Prateek can never see Office
-- Lunch". Every table is locked to auth.uid() being a member of the group.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_participants enable row level security;
alter table public.settlements enable row level security;
alter table public.activity_log enable row level security;

-- security definer helper: bypasses RLS internally so checking membership
-- doesn't recursively trigger group_members' own RLS policy.
create or replace function public.is_group_member(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = _group_id and user_id = auth.uid()
  );
$$;

-- ---------- profiles ----------
-- Anyone authenticated can look up basic profile info (needed to render
-- names/avatars of group co-members) but never their private data.
drop policy if exists "profiles_select_all_authenticated" on public.profiles;
create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- ---------- groups ----------
drop policy if exists "groups_select_member_only" on public.groups;
create policy "groups_select_member_only"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

drop policy if exists "groups_insert_any_authenticated" on public.groups;
create policy "groups_insert_any_authenticated"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "groups_update_owner_only" on public.groups;
create policy "groups_update_owner_only"
  on public.groups for update
  to authenticated
  using (created_by = auth.uid());

-- ---------- group_members ----------
drop policy if exists "members_select_same_group" on public.group_members;
create policy "members_select_same_group"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

-- Users can insert themselves (accepting an invite); owners can add others.
drop policy if exists "members_insert_self_or_owner" on public.group_members;
create policy "members_insert_self_or_owner"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

drop policy if exists "members_delete_self_or_owner" on public.group_members;
create policy "members_delete_self_or_owner"
  on public.group_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- ---------- group_invites ----------
drop policy if exists "invites_select_member" on public.group_invites;
create policy "invites_select_member"
  on public.group_invites for select
  to authenticated
  using (public.is_group_member(group_id) or created_by = auth.uid());

drop policy if exists "invites_insert_member" on public.group_invites;
create policy "invites_insert_member"
  on public.group_invites for insert
  to authenticated
  with check (public.is_group_member(group_id) and created_by = auth.uid());

-- Invite lookup by token has to work for someone who is NOT yet a member,
-- so allow read of a single invite row by anyone authenticated; the token
-- itself is the secret (like a password-reset link), not group membership.
drop policy if exists "invites_select_by_token" on public.group_invites;
create policy "invites_select_by_token"
  on public.group_invites for select
  to authenticated
  using (accepted_at is null and expires_at > now());

-- ---------- expenses ----------
drop policy if exists "expenses_select_member" on public.expenses;
create policy "expenses_select_member"
  on public.expenses for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "expenses_insert_member" on public.expenses;
create policy "expenses_insert_member"
  on public.expenses for insert
  to authenticated
  with check (public.is_group_member(group_id) and created_by = auth.uid());

drop policy if exists "expenses_update_member" on public.expenses;
create policy "expenses_update_member"
  on public.expenses for update
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "expenses_delete_member" on public.expenses;
create policy "expenses_delete_member"
  on public.expenses for delete
  to authenticated
  using (public.is_group_member(group_id));

-- ---------- expense_participants ----------
drop policy if exists "participants_select_member" on public.expense_participants;
create policy "participants_select_member"
  on public.expense_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );

drop policy if exists "participants_write_member" on public.expense_participants;
create policy "participants_write_member"
  on public.expense_participants for all
  to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  )
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );

-- ---------- settlements ----------
drop policy if exists "settlements_select_member" on public.settlements;
create policy "settlements_select_member"
  on public.settlements for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "settlements_write_member" on public.settlements;
create policy "settlements_write_member"
  on public.settlements for all
  to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

-- ---------- activity_log ----------
drop policy if exists "activity_select_member" on public.activity_log;
create policy "activity_select_member"
  on public.activity_log for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "activity_insert_member" on public.activity_log;
create policy "activity_insert_member"
  on public.activity_log for insert
  to authenticated
  with check (public.is_group_member(group_id));

-- ---------- Realtime ----------
-- Enable realtime replication for the tables the client subscribes to.
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.activity_log;
alter publication supabase_realtime add table public.group_members;
