-- Enable Row Level Security if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;

-- Create policy to allow users to view their own companies
CREATE POLICY "Users can view their own companies" 
ON companies 
FOR SELECT 
TO authenticated 
USING (auth.uid()::text = clerk_user_id);

-- Create policy to allow users to insert their own companies
CREATE POLICY "Users can insert their own companies"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = clerk_user_id);

-- Create policy to allow users to update their own companies
CREATE POLICY "Users can update their own companies"
ON companies
FOR UPDATE
TO authenticated
USING (auth.uid()::text = clerk_user_id)
WITH CHECK (auth.uid()::text = clerk_user_id);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'companies';
