-- ==============================================================================
-- Rotaract RecruitX — Row-Level Security (RLS) & Access Control Policies
-- Migration: 20261015000003_rls_policies.sql
-- ==============================================================================

-- 1. Helper security functions
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_interviewer_for_panel(target_panel_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.panel_members
    where panel_id = target_panel_id and user_id = auth.uid()
  );
$$;

-- Helper to check if interviewer is assigned to an interview assignment
create or replace function public.is_interviewer_for_assignment(target_assignment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.interview_assignments a
    join public.interview_slots s on a.slot_id = s.id
    join public.panel_members pm on s.panel_id = pm.panel_id
    where a.id = target_assignment_id and pm.user_id = auth.uid()
  );
$$;

-- ==============================================================================
-- 2. Enable RLS on all 11 operational tables
-- ==============================================================================
alter table public.recruitment_drives enable row level security;
alter table public.interview_panels enable row level security;
alter table public.panel_members enable row level security;
alter table public.interview_slots enable row level security;
alter table public.candidates enable row level security;
alter table public.interview_assignments enable row level security;
alter table public.pass_tokens enable row level security;
alter table public.scorecards enable row level security;
alter table public.email_jobs enable row level security;
alter table public.email_delivery_log enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Default rule: DENY ALL. Anonymous role has 0 permissions.

-- ==============================================================================
-- 3. Recruitment Drives Policies
-- ==============================================================================
-- Admins have full access
create policy "Admins can manage drives"
  on public.recruitment_drives
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Interviewers can view active or completed drives
create policy "Interviewers can view drives"
  on public.recruitment_drives
  for select
  to authenticated
  using (status in ('active', 'completed'));

-- ==============================================================================
-- 4. Interview Panels & Members Policies
-- ==============================================================================
create policy "Admins can manage interview panels"
  on public.interview_panels
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Interviewers can view assigned panels"
  on public.interview_panels
  for select
  to authenticated
  using (
    public.is_admin() or
    exists (
      select 1 from public.panel_members
      where panel_id = public.interview_panels.id and user_id = auth.uid()
    )
  );

create policy "Admins can manage panel memberships"
  on public.panel_members
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Interviewers can view panel team members"
  on public.panel_members
  for select
  to authenticated
  using (
    public.is_admin() or
    exists (
      select 1 from public.panel_members pm2
      where pm2.panel_id = public.panel_members.panel_id and pm2.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 5. Interview Slots Policies
-- ==============================================================================
create policy "Admins can manage interview slots"
  on public.interview_slots
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Interviewers can view slots for their panels"
  on public.interview_slots
  for select
  to authenticated
  using (
    public.is_admin() or public.is_interviewer_for_panel(panel_id)
  );

-- ==============================================================================
-- 6. Candidates Policies
-- ==============================================================================
-- Admins can create, read, update, delete candidates
create policy "Admins can manage candidates"
  on public.candidates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Interviewers can view candidate information ONLY if assigned to interview them
create policy "Interviewers can view candidates assigned to their panel"
  on public.candidates
  for select
  to authenticated
  using (
    public.is_admin() or
    exists (
      select 1
      from public.interview_assignments a
      join public.interview_slots s on a.slot_id = s.id
      join public.panel_members pm on s.panel_id = pm.panel_id
      where a.candidate_id = public.candidates.id and pm.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 7. Interview Assignments Policies
-- ==============================================================================
create policy "Admins can manage assignments"
  on public.interview_assignments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Interviewers can view their panel assignments"
  on public.interview_assignments
  for select
  to authenticated
  using (
    public.is_admin() or
    exists (
      select 1
      from public.interview_slots s
      join public.panel_members pm on s.panel_id = pm.panel_id
      where s.id = public.interview_assignments.slot_id and pm.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 8. Pass Tokens Policies (Strict Server-Side Operation)
-- ==============================================================================
-- Only admins can inspect token records
create policy "Admins can manage pass tokens"
  on public.pass_tokens
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Candidates access passes through a SECURITY DEFINER RPC function validating token_hash,
-- preventing direct table enumeration or token scraping.

-- Function for validating candidate pass without direct table grant
create or replace function public.get_candidate_pass_by_hash(p_token_hash text)
returns table (
  pass_id uuid,
  candidate_name text,
  enrollment_no text,
  branch text,
  year_of_study text,
  drive_name text,
  panel_name text,
  meet_link text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_valid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pass record;
begin
  select
    pt.id as pass_id,
    c.full_name as candidate_name,
    c.enrollment_no,
    c.branch,
    c.year_of_study,
    d.name as drive_name,
    p.name as panel_name,
    p.meet_link,
    s.starts_at,
    s.ends_at,
    (not pt.revoked and pt.expires_at > now()) as is_valid
  into v_pass
  from public.pass_tokens pt
  join public.candidates c on pt.candidate_id = c.id
  join public.recruitment_drives d on pt.drive_id = d.id
  left join public.interview_assignments a on a.candidate_id = c.id
  left join public.interview_slots s on a.slot_id = s.id
  left join public.interview_panels p on s.panel_id = p.id
  where pt.token_hash = p_token_hash
  limit 1;

  if v_pass is not null and v_pass.is_valid then
    -- Atomically log access count
    update public.pass_tokens
    set access_count = access_count + 1, last_accessed_at = now()
    where id = v_pass.pass_id;

    return query select
      v_pass.pass_id,
      v_pass.candidate_name,
      v_pass.enrollment_no,
      v_pass.branch,
      v_pass.year_of_study,
      v_pass.drive_name,
      v_pass.panel_name,
      v_pass.meet_link,
      v_pass.starts_at,
      v_pass.ends_at,
      v_pass.is_valid;
  end if;

  return;
end;
$$;

-- Grant execute of the lookup function to anon and authenticated
grant execute on function public.get_candidate_pass_by_hash(text) to anon, authenticated;

-- ==============================================================================
-- 9. Scorecards Policies
-- ==============================================================================
-- Admins can view all scorecards for deliberation
create policy "Admins can view all scorecards"
  on public.scorecards
  for select
  to authenticated
  using (public.is_admin());

-- Interviewers can view only scorecards they authored
create policy "Interviewers can view own scorecards"
  on public.scorecards
  for select
  to authenticated
  using (interviewer_id = auth.uid());

-- Interviewers can insert scorecards ONLY if assigned to the candidate's panel
create policy "Interviewers can submit scorecards for assigned candidates"
  on public.scorecards
  for insert
  to authenticated
  with check (
    interviewer_id = auth.uid() and
    public.is_interviewer_for_assignment(assignment_id)
  );

-- Interviewers can update their own scorecards before deliberation closes
create policy "Interviewers can update own scorecards"
  on public.scorecards
  for update
  to authenticated
  using (interviewer_id = auth.uid())
  with check (interviewer_id = auth.uid());

-- ==============================================================================
-- 10. Email Queue & Delivery Logs Policies
-- ==============================================================================
-- Only Admins and background service roles can read/manage email jobs
create policy "Admins can manage email jobs"
  on public.email_jobs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view email delivery logs"
  on public.email_delivery_log
  for select
  to authenticated
  using (public.is_admin());

-- ==============================================================================
-- 11. Application Settings & Audit Logs Policies
-- ==============================================================================
create policy "Admins can manage app settings"
  on public.app_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (public.is_admin());
