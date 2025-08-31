-- Create funding_rounds table to track investment rounds
CREATE TABLE IF NOT EXISTS funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  round_name TEXT NOT NULL, -- Seed, Series A, Series B, etc.
  round_type TEXT NOT NULL, -- seed, series_a, series_b, bridge, convertible
  total_investment DECIMAL(15,2) NOT NULL,
  pre_money_valuation DECIMAL(15,2),
  post_money_valuation DECIMAL(15,2),
  price_per_share DECIMAL(10,4),
  shares_issued BIGINT,
  closing_date DATE,
  lead_investor TEXT,
  liquidation_preference DECIMAL(10,4) DEFAULT 1.0,
  participation_rights TEXT DEFAULT 'non-participating',
  anti_dilution_rights TEXT DEFAULT 'weighted_average_narrow',
  dividend_rate DECIMAL(5,4) DEFAULT 0,
  voting_rights BOOLEAN DEFAULT TRUE,
  board_seats INTEGER DEFAULT 0,
  pro_rata_rights BOOLEAN DEFAULT TRUE,
  drag_along_rights BOOLEAN DEFAULT TRUE,
  tag_along_rights BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;

-- Create policies for funding_rounds table
CREATE POLICY "Users can view funding rounds of their companies" ON funding_rounds
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can insert funding rounds for their companies" ON funding_rounds
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update funding rounds of their companies" ON funding_rounds
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete funding rounds of their companies" ON funding_rounds
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies WHERE clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_funding_rounds_company_id ON funding_rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_round_type ON funding_rounds(round_type);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_closing_date ON funding_rounds(closing_date);
