-- ============================================================================
-- SplitWise+ — core schema
-- Run this in Supabase SQL editor (or `supabase db push`) before 0002_rls.sql
-- ============================================================================

create extension if not exists "uuid-ossp";

-- Profiles mirror auth.users so we can join on names/avatars without
-- exposing the auth schema to the client.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text not null default '💸',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_invites (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email text,
  token uuid not null default uuid_generate_v4(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id)
);

create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  paid_by uuid not null references public.profiles(id),
  category text not null default 'other'
    check (category in ('food', 'travel', 'shopping', 'rent', 'bills', 'entertainment', 'other')),
  notes text,
  expense_date date not null default current_date,
  expense_time time not null default current_time,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per person the expense is split between. share_amount is stored
-- (not just derived) so historical expenses stay correct if split logic
-- changes later, and so unequal splits are supported from day one.
create table if not exists public.expense_participants (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  share_amount numeric(12, 2) not null check (share_amount >= 0),
  primary key (expense_id, user_id)
);

create table if not exists public.settlements (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_user uuid not null references public.profiles(id),
  to_user uuid not null references public.profiles(id),
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  type text not null, -- expense_added | expense_edited | expense_deleted | member_joined | member_left | settlement_completed
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_expenses_group on public.expenses(group_id, expense_date desc);
create index if not exists idx_expense_participants_user on public.expense_participants(user_id);
create index if not exists idx_settlements_group on public.settlements(group_id, status);
create index if not exists idx_activity_group on public.activity_log(group_id, created_at desc);

-- Keep updated_at fresh on expense edits
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_expenses_touch on public.expenses;
create trigger trg_expenses_touch
  before update on public.expenses
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row whenever a new auth user signs up (Google or email)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
