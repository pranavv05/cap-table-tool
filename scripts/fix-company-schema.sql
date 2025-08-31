-- 1. First, let's fix the companies table structure
ALTER TABLE companies 
  ALTER COLUMN incorporation_date SET NOT NULL,
  ALTER COLUMN jurisdiction SET NOT NULL,
  ALTER COLUMN company_type SET NOT NULL,
  ALTER COLUMN authorized_shares SET NOT NULL,
  ALTER COLUMN par_value SET NOT NULL;

-- 2. Set up proper RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON companies;

-- 4. Create new policies with proper permissions
-- Allow users to view their own companies
CREATE POLICY "Users can view their own companies" 
ON companies 
FOR SELECT 
TO authenticated 
USING (auth.uid()::text = clerk_user_id);

-- Allow users to insert their own companies
CREATE POLICY "Users can insert their own companies"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = clerk_user_id);

-- Allow users to update their own companies
CREATE POLICY "Users can update their own companies"
ON companies
FOR UPDATE
TO authenticated
USING (auth.uid()::text = clerk_user_id)
WITH CHECK (auth.uid()::text = clerk_user_id);

-- 5. Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'companies';
