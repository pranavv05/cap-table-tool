-- Create shareholders table to store shareholder information
CREATE TABLE IF NOT EXISTS shareholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  shareholder_type TEXT DEFAULT 'individual', -- individual, entity, employee
  tax_id TEXT,
  address TEXT,
  is_founder BOOLEAN DEFAULT FALSE,
  is_employee BOOLEAN DEFAULT FALSE,
  is_investor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;

-- Create policies for shareholders table
CREATE POLICY "Users can view shareholders of their companies" ON shareholders
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can insert shareholders for their companies" ON shareholders
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update shareholders of their companies" ON shareholders
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete shareholders of their companies" ON shareholders
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shareholders_company_id ON shareholders(company_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_email ON shareholders(email);
