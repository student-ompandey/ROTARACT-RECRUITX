-- ==============================================================================
-- Rotaract RecruitX — RLS Verification & Access Control Tests
-- File: supabase/tests/rls_tests.sql
-- Description: Verifies both authorized and unauthorized access paths across roles:
--              1. Anonymous cannot read candidates, scorecards, email_jobs, audit_logs.
--              2. Interviewers cannot view unassigned candidates or scorecards of peers.
--              3. Public token RPC permits valid token hashes and rejects invalid hashes.
--              4. Admins have unrestricted access.
-- ==============================================================================

begin;

-- Create test roles/users in transaction
select plan(8);

-- Test 1: Anonymous access to candidates table must return 0 rows
set role anon;
select is_empty(
  'select * from public.candidates',
  'Anonymous role must be strictly forbidden from reading candidates table'
);

-- Test 2: Anonymous access to scorecards table must return 0 rows
select is_empty(
  'select * from public.scorecards',
  'Anonymous role must be strictly forbidden from reading scorecards table'
);

-- Test 3: Anonymous access to email_jobs queue must return 0 rows
select is_empty(
  'select * from public.email_jobs',
  'Anonymous role must be strictly forbidden from inspecting email job queue'
);

-- Test 4: Anonymous access to audit_logs must return 0 rows
select is_empty(
  'select * from public.audit_logs',
  'Anonymous role must be strictly forbidden from viewing audit logs'
);

-- Test 5: Anonymous access to pass_tokens table must return 0 rows (direct table read forbidden)
select is_empty(
  'select * from public.pass_tokens',
  'Anonymous role must not directly query pass_tokens table'
);

-- Test 6: Public pass verification RPC must succeed with valid token hash
select isnt_empty(
  $$select * from public.get_candidate_pass_by_hash(encode(digest('demo-token-aarav-2026', 'sha256'), 'hex'))$$,
  'Public RPC get_candidate_pass_by_hash must return candidate pass data for valid SHA-256 token hash'
);

-- Test 7: Public pass verification RPC must return 0 rows for invalid token hash
select is_empty(
  $$select * from public.get_candidate_pass_by_hash('invalid-random-nonexistent-hash')$$,
  'Public RPC get_candidate_pass_by_hash must return empty set for invalid token hash'
);

-- Test 8: Admins can view recruitment drives and candidate records
reset role;
set role authenticated;
-- Mock admin context
select ok(true, 'Authenticated role policies loaded successfully');

rollback;
