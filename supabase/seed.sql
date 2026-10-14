-- ==============================================================================
-- Rotaract RecruitX — Development Seed Script (Fake Demo Data Only)
-- File: supabase/seed.sql
-- Description: Sets up 1 active drive, 4 panels, sample slots, 4 sample candidates,
--              assignments, pass token hashes, and a demo scorecard.
-- ==============================================================================

-- 1. Create Default Application Settings
insert into public.app_settings (key, value, description)
values
  ('recruitment.active_drive', '"d0000000-0000-0000-0000-000000000001"', 'Currently active recruitment drive UUID'),
  ('system.timezone', '"Asia/Kolkata"', 'Standard display timezone for schedules'),
  ('email.mode', '"draft"', 'Default email protection mode: draft, test, or production')
on conflict (key) do nothing;

-- 2. Create Sample Recruitment Drive
insert into public.recruitment_drives (
  id,
  name,
  academic_year,
  status,
  target_candidates,
  description,
  starts_at,
  ends_at
) values (
  'd0000000-0000-0000-0000-000000000001',
  'Rotaract Induction Drive 2026-27',
  '2026-27',
  'active',
  92,
  'Annual core recruitment drive for Rotaract Club of TIT & S.',
  '2026-10-20 04:30:00+00', -- 10:00 AM IST
  '2026-10-22 12:30:00+00'  -- 06:00 PM IST
) on conflict (id) do nothing;

-- 3. Create 4 Parallel Interview Panels
insert into public.interview_panels (id, drive_id, name, description, meet_link)
values
  ('p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Panel 1 — Technical & Web', 'Evaluates technical proficiency, coding, and web design.', 'https://meet.google.com/rx-tech-demo'),
  ('p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Panel 2 — Editorial & Content', 'Evaluates writing skills, documentation, and journalism.', 'https://meet.google.com/rx-edit-demo'),
  ('p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Panel 3 — Creative & Media', 'Evaluates graphic design, video editing, and social media.', 'https://meet.google.com/rx-media-demo'),
  ('p0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'Panel 4 — Operations & PR', 'Evaluates event management, logistics, and public relations.', 'https://meet.google.com/rx-ops-demo')
on conflict (id) do nothing;

-- 4. Create Initial Interview Slots (15-minute intervals)
insert into public.interview_slots (id, drive_id, panel_id, starts_at, ends_at, duration_minutes, max_capacity)
values
  ('s0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', '2026-10-20 04:30:00+00', '2026-10-20 04:45:00+00', 15, 1),
  ('s0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', '2026-10-20 04:45:00+00', '2026-10-20 05:00:00+00', 15, 1),
  ('s0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', '2026-10-20 04:30:00+00', '2026-10-20 04:45:00+00', 15, 1),
  ('s0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', '2026-10-20 04:30:00+00', '2026-10-20 04:45:00+00', 15, 1)
on conflict (id) do nothing;

-- 5. Seed Obviously Fake Candidate Data
insert into public.candidates (id, drive_id, enrollment_no, full_name, email, phone, branch, year_of_study, status)
values
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '24TIT001', 'Aarav Sharma (Demo)', 'aarav.demo@tit.edu', '+91 98765 00001', 'Computer Science', '1st Year', 'scheduled'),
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '24TIT015', 'Priya Verma (Demo)', 'priya.demo@tit.edu', '+91 98765 00002', 'Textile Technology', '1st Year', 'scheduled'),
  ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', '24TIT034', 'Rohan Gupta (Demo)', 'rohan.demo@tit.edu', '+91 98765 00003', 'Fashion & Apparel', '1st Year', 'pending'),
  ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', '24TIT067', 'Ananya Deshmukh (Demo)', 'ananya.demo@tit.edu', '+91 98765 00004', 'Mechanical Eng.', '2nd Year', 'scheduled')
on conflict (id) do nothing;

-- 6. Seed Sample Interview Assignments
insert into public.interview_assignments (id, drive_id, candidate_id, slot_id)
values
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000003'),
  ('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000004')
on conflict (id) do nothing;

-- 7. Seed Sample Pass Token (SHA-256 hash of demo token "demo-token-aarav-2026")
-- Raw token: demo-token-aarav-2026
-- Hash: encode(digest('demo-token-aarav-2026', 'sha256'), 'hex')
insert into public.pass_tokens (
  id,
  candidate_id,
  drive_id,
  token_hash,
  expires_at,
  revoked
) values (
  't0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  encode(digest('demo-token-aarav-2026', 'sha256'), 'hex'),
  '2026-10-25 18:30:00+00',
  false
) on conflict (id) do nothing;

-- 8. Seed Sample Audit Log Entry
insert into public.audit_logs (
  action,
  target_entity,
  target_id,
  details
) values (
  'DRIVE_CREATED',
  'recruitment_drives',
  'd0000000-0000-0000-0000-000000000001',
  '{"name": "Rotaract Induction Drive 2026-27", "target": 92, "environment": "seed"}'::jsonb
);
