-- ==============================================================================
-- Rotaract RecruitX — Add interviewer_name and interview_link to candidates
-- Migration: 20261015000004_add_interview_details_to_candidates.sql
-- ==============================================================================

-- 1. Add interviewer_name and interview_link columns to public.candidates
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS interviewer_name text,
  ADD COLUMN IF NOT EXISTS interview_link text;

-- 2. Add comment for clarity
COMMENT ON COLUMN public.candidates.interviewer_name IS 'Assigned interviewer or panel lead name for this candidate';
COMMENT ON COLUMN public.candidates.interview_link IS 'Direct HTTPS interview room link (e.g. Google Meet URL)';
