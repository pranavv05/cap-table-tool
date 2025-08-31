-- Fix RLS context function to avoid conflicts with PostgreSQL's built-in set_config
-- Run this in your Supabase SQL editor to fix the RLS context issue

-- Drop the problematic function that conflicts with PostgreSQL's built-in
DROP FUNCTION IF EXISTS set_config(text, text, boolean);

-- Create a properly named function for setting user context
CREATE OR REPLACE FUNCTION set_user_context(user_id text)
RETURNS text AS $$
BEGIN
  -- Use PostgreSQL's built-in set_config function correctly
  PERFORM set_config('app.current_user_id', user_id, true);
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative function with the original signature but different name
CREATE OR REPLACE FUNCTION set_rls_config(setting_name text, setting_value text, is_local boolean DEFAULT true)
RETURNS text AS $$
BEGIN
  -- Use PostgreSQL's built-in set_config function correctly
  PERFORM set_config(setting_name, setting_value, is_local);
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the functions work correctly
DO $$
BEGIN
  -- Test setting user context
  PERFORM set_user_context('test-user-123');
  
  -- Verify it was set
  IF current_setting('app.current_user_id', true) = 'test-user-123' THEN
    RAISE NOTICE '✅ set_user_context function works correctly';
  ELSE
    RAISE WARNING '❌ set_user_context function not working';
  END IF;
  
  -- Test the alternative function
  PERFORM set_rls_config('app.current_user_id', 'test-user-456', true);
  
  -- Verify it was set
  IF current_setting('app.current_user_id', true) = 'test-user-456' THEN
    RAISE NOTICE '✅ set_rls_config function works correctly';
  ELSE
    RAISE WARNING '❌ set_rls_config function not working';
  END IF;
  
  RAISE NOTICE '🔧 RLS functions have been fixed and tested';
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_user_context(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION set_rls_config(text, text, boolean) TO authenticated, anon;