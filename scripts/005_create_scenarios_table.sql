-- Create scenarios table for modeling different exit and funding scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scenario_type TEXT NOT NULL, -- exit, funding_round, option_pool_expansion
  description TEXT,
  exit_valuation DECIMAL(15,2),
  liquidation_preference_multiple DECIMAL(10,4) DEFAULT 1.0,
  participation_cap DECIMAL(10,4),
  new_investment_amount DECIMAL(15,2),
  new_pre_money_valuation DECIMAL(15,2),
  new_option_pool_percentage DECIMAL(5,4),
  is_baseline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Create policies for scenarios table
CREATE POLICY "Users can view scenarios of their companies" ON scenarios
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can insert scenarios for their companies" ON scenarios
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update scenarios of their companies" ON scenarios
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete scenarios of their companies" ON scenarios
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_company_id ON scenarios(company_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_scenario_type ON scenarios(scenario_type);
