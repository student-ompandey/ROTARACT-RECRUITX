-- ==============================================================================
-- Rotaract RecruitX — Phase 3 Database Schema & Relational Model
-- Migration: 20261015000002_core_schema.sql
-- ==============================================================================

-- 1. Enable pgcrypto for cryptographic hashing (pass tokens, etc.)
create extension if not exists "pgcrypto";

-- 2. Enumerated Domain Types
create type drive_status_type as enum ('draft', 'active', 'completed', 'archived');
create type candidate_status_type as enum ('pending', 'scheduled', 'interviewed', 'selected', 'waitlisted', 'rejected');
create type email_job_status_type as enum ('pending', 'processing', 'sent', 'failed', 'dead_letter');
create type email_campaign_type as enum ('interview_pass', 'schedule_reminder', 'selection_result', 'custom_notice');
create type audit_action_type as enum (
  'DRIVE_CREATED', 'DRIVE_UPDATED', 'DRIVE_STATUS_CHANGED',
  'CANDIDATES_IMPORTED', 'CANDIDATE_UPDATED',
  'PANEL_CREATED', 'PANEL_UPDATED', 'PANEL_MEMBERS_ASSIGNED',
  'SLOTS_GENERATED', 'CANDIDATE_ASSIGNED', 'ASSIGNMENT_REMOVED',
  'PASS_TOKEN_GENERATED', 'PASS_TOKEN_REVOKED',
  'SCORECARD_SUBMITTED', 'SCORECARD_UPDATED',
  'SHORTLIST_FINALIZED',
  'EMAIL_CAMPAIGN_DISPATCHED', 'EMAIL_JOB_RETRIED'
);

-- ==============================================================================
-- 3. Core Operational Tables
-- ==============================================================================

-- 3.1 Recruitment Drives
create table if not exists public.recruitment_drives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_year text not null, -- e.g. "2026-27"
  status drive_status_type not null default 'draft',
  target_candidates int not null default 92,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 Interview Panels (e.g., Tech, Editorial, Creative, Operations)
create table if not exists public.interview_panels (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.recruitment_drives(id) on delete cascade,
  name text not null,
  description text,
  meet_link text, -- Institutional / Google Meet room URL
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (drive_id, name)
);

-- 3.3 Interviewer Panel Memberships (M:N mapping between user_roles & panels)
create table if not exists public.panel_members (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.interview_panels(id) on delete cascade,
  user_id uuid not null references public.user_roles(id) on delete cascade,
  role_in_panel text not null default 'evaluator', -- e.g. 'lead', 'evaluator'
  created_at timestamptz not null default now(),
  unique (panel_id, user_id)
);

-- 3.4 Interview Slots
create table if not exists public.interview_slots (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.recruitment_drives(id) on delete cascade,
  panel_id uuid not null references public.interview_panels(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes int not null default 15,
  max_capacity int not null default 1, -- single candidate per slot by default
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint valid_slot_time check (ends_at > starts_at)
);

-- 3.5 Candidates Table
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.recruitment_drives(id) on delete cascade,
  enrollment_no text not null, -- Institutional identifier (e.g. 24TIT001)
  full_name text not null,
  email text not null,
  phone text,
  branch text not null, -- e.g. "Computer Science", "Textile Technology"
  year_of_study text not null, -- e.g. "1st Year", "2nd Year"
  status candidate_status_type not null default 'pending',
  import_batch_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Enrollment must be unique within an institutional recruitment drive
  unique (drive_id, enrollment_no)
);

-- 3.6 Interview Assignments (Mapping Candidate -> Slot)
create table if not exists public.interview_assignments (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.recruitment_drives(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  slot_id uuid not null references public.interview_slots(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  -- Business Rule: A candidate can only have ONE active assignment per drive
  unique (candidate_id, drive_id),
  -- Business Rule: A slot cannot be double-booked beyond capacity
  unique (slot_id)
);

-- 3.7 Pass Tokens (Candidate Access Links with SHA-256 Hashes)
-- NOTE: Never store raw tokens. Raw token is only presented once to candidate in email.
create table if not exists public.pass_tokens (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  drive_id uuid not null references public.recruitment_drives(id) on delete cascade,
  token_hash text not null unique, -- SHA-256 hash of random 256-bit token
  expires_at timestamptz not null,
  revoked boolean not null default false,
  revoked_at timestamptz,
  access_count int not null default 0,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (candidate_id)
);

-- 3.8 Scorecards & Evaluator Submissions
create table if not exists public.scorecards (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.interview_assignments(id) on delete cascade,
  interviewer_id uuid not null references public.user_roles(id) on delete cascade,
  communication_score int not null check (communication_score between 1 and 5),
  motivation_score int not null check (motivation_score between 1 and 5),
  domain_knowledge_score int not null check (domain_knowledge_score between 1 and 5),
  teamwork_score int not null check (teamwork_score between 1 and 5),
  overall_score int not null check (overall_score between 1 and 5),
  internal_notes text, -- Strictly confidential to evaluation committee
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Business Rule: Exactly one scorecard per interviewer per interview assignment
  unique (assignment_id, interviewer_id)
);

-- 3.9 Email Job Queue (Idempotent, Rate-limited, Background delivery)
create table if not exists public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.recruitment_drives(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  campaign_type email_campaign_type not null,
  recipient_email text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status email_job_status_type not null default 'pending',
  idempotency_key text not null unique, -- Prevents duplicate delivery
  attempts int not null default 0,
  max_attempts int not null default 3,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.10 Email Delivery Logs (Provider audit trail)
create table if not exists public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.email_jobs(id) on delete cascade,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null, -- 'delivered', 'failed', 'bounced'
  sanitized_error text, -- Stripped of sensitive credentials/headers
  response_payload jsonb,
  logged_at timestamptz not null default now()
);

-- 3.11 Application Settings (Key-Value configuration)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 3.12 Comprehensive Audit Logs (Tamper-evident record of administrative events)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action audit_action_type not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  drive_id uuid references public.recruitment_drives(id) on delete set null,
  target_entity text not null, -- e.g. "candidate", "scorecard", "assignment"
  target_id text not null,
  details jsonb not null default '{}'::jsonb, -- Safe payload (NO raw tokens/secrets)
  ip_address text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 4. High-Performance Indexing Strategy
-- ==============================================================================
create index if not exists idx_candidates_drive_status on public.candidates(drive_id, status);
create index if not exists idx_candidates_enrollment on public.candidates(enrollment_no);
create index if not exists idx_slots_drive_panel on public.interview_slots(drive_id, panel_id, starts_at);
create index if not exists idx_assignments_slot on public.interview_assignments(slot_id);
create index if not exists idx_assignments_candidate on public.interview_assignments(candidate_id);
create index if not exists idx_panel_members_user on public.panel_members(user_id);
create index if not exists idx_pass_tokens_hash on public.pass_tokens(token_hash) where not revoked;
create index if not exists idx_scorecards_assignment on public.scorecards(assignment_id);
create index if not exists idx_email_jobs_pending on public.email_jobs(status, next_retry_at) where status in ('pending', 'processing');
create index if not exists idx_email_jobs_idempotency on public.email_jobs(idempotency_key);
create index if not exists idx_audit_logs_action on public.audit_logs(action, created_at desc);

-- ==============================================================================
-- 5. Automatic Timestamp Updaters
-- ==============================================================================
create trigger on_drives_updated before update on public.recruitment_drives for each row execute function public.handle_updated_at();
create trigger on_panels_updated before update on public.interview_panels for each row execute function public.handle_updated_at();
create trigger on_candidates_updated before update on public.candidates for each row execute function public.handle_updated_at();
create trigger on_scorecards_updated before update on public.scorecards for each row execute function public.handle_updated_at();
create trigger on_email_jobs_updated before update on public.email_jobs for each row execute function public.handle_updated_at();
create trigger on_app_settings_updated before update on public.app_settings for each row execute function public.handle_updated_at();
