-- ==============================================================================
-- Rotaract RecruitX — Phase 2 Authentication & Role-Based Access Schema
-- ==============================================================================

-- 1. Create User Roles Enum
create type user_role as enum ('admin', 'interviewer');

-- 2. User Profiles with Server-Enforced Roles
create table if not exists public.user_roles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'interviewer',
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row-Level Security
alter table public.user_roles enable row level security;

-- 3. RLS Policies for user_roles
-- Authenticated users can read their own role record
create policy "Users can view their own role"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = id);

-- Admins can read all role records
create policy "Admins can view all roles"
  on public.user_roles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only service-role key or custom admin RPC can insert/update/delete roles
-- (No public INSERT/UPDATE policy: protects against self-privilege escalation)

-- 4. Secure Helper Function: Check User Role
create or replace function public.get_user_role(user_id uuid)
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.user_roles where id = user_id limit 1;
$$;

-- 5. Trigger to automatically sync updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_roles_updated
  before update on public.user_roles
  for each row execute function public.handle_updated_at();
