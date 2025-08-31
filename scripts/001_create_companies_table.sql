-- Create companies table to store company information
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  incorporation_date DATE,
  jurisdiction TEXT,
  company_type TEXT DEFAULT 'C-Corp',
  authorized_shares BIGINT DEFAULT 10000000,
  par_value DECIMAL(10,4) DEFAULT 0.001,
  clerk_user_id TEXT NOT NULL, -- Reference to Clerk user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies table
CREATE POLICY "Users can view their own companies" ON companies
  FOR SELECT USING (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own companies" ON companies
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own companies" ON companies
  FOR UPDATE USING (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own companies" ON companies
  FOR DELETE USING (clerk_user_id = current_setting('app.current_user_id', true));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_companies_clerk_user_id ON companies(clerk_user_id);
