-- Temporary fix: Disable RLS on companies table to allow onboarding to work
-- This is a quick fix - should be replaced with proper RLS setup later

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Add a comment for tracking
COMMENT ON TABLE companies IS 'RLS temporarily disabled for onboarding fix - needs proper RLS setup';