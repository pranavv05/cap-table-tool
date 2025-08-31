-- Create equity_grants table to store all equity allocations
CREATE TABLE IF NOT EXISTS equity_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shareholder_id UUID NOT NULL REFERENCES shareholders(id) ON DELETE CASCADE,
  grant_type TEXT NOT NULL, -- common_stock, preferred_stock, options, warrants, convertible_note
  series TEXT, -- A, B, C, Seed, etc.
  shares_granted BIGINT NOT NULL,
  shares_outstanding BIGINT NOT NULL DEFAULT 0, -- for options: vested shares
  strike_price DECIMAL(10,4) DEFAULT 0,
  grant_date DATE NOT NULL,
  vesting_start_date DATE,
  vesting_cliff_months INTEGER DEFAULT 0,
  vesting_period_months INTEGER DEFAULT 48,
  exercise_price DECIMAL(10,4),
  liquidation_preference DECIMAL(10,4) DEFAULT 1.0,
  participation_rights TEXT DEFAULT 'non-participating', -- non-participating, participating, capped
  anti_dilution_rights TEXT DEFAULT 'weighted_average_narrow', -- none, weighted_average_narrow, weighted_average_broad, full_ratchet
  voting_rights BOOLEAN DEFAULT TRUE,
  dividend_rights BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE equity_grants ENABLE ROW LEVEL SECURITY;

-- Create policies for equity_grants table
CREATE POLICY "Users can view equity grants of their companies" ON equity_grants
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can insert equity grants for their companies" ON equity_grants
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update equity grants of their companies" ON equity_grants
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete equity grants of their companies" ON equity_grants
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equity_grants_company_id ON equity_grants(company_id);
CREATE INDEX IF NOT EXISTS idx_equity_grants_shareholder_id ON equity_grants(shareholder_id);
CREATE INDEX IF NOT EXISTS idx_equity_grants_grant_type ON equity_grants(grant_type);
CREATE INDEX IF NOT EXISTS idx_equity_grants_series ON equity_grants(series);
