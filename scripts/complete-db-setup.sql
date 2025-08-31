-- Complete Database Setup for Cap Table Tool Production
-- Execute in Supabase SQL Editor or via psql

-- =============================================
-- 1. ENABLE NECESSARY EXTENSIONS
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 2. CREATE CORE TABLES
-- =============================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
  description TEXT,
  incorporation_date DATE,
  jurisdiction TEXT CHECK (length(jurisdiction) <= 100),
  company_type TEXT DEFAULT 'C-Corp' CHECK (company_type IN ('C-Corp', 'S-Corp', 'LLC', 'Partnership', 'Other')),
  authorized_shares BIGINT DEFAULT 10000000 CHECK (authorized_shares > 0),
  par_value DECIMAL(10,4) DEFAULT 0.001 CHECK (par_value >= 0),
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_company_name_per_user UNIQUE (clerk_user_id, name)
);

-- Shareholders table
CREATE TABLE IF NOT EXISTS shareholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  shareholder_type TEXT DEFAULT 'individual' CHECK (shareholder_type IN ('individual', 'entity', 'employee', 'advisor')),
  tax_id TEXT,
  address TEXT,
  is_founder BOOLEAN DEFAULT FALSE,
  is_employee BOOLEAN DEFAULT FALSE,
  is_investor BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_shareholder_email_per_company UNIQUE (company_id, email)
);

-- Share classes table
CREATE TABLE IF NOT EXISTS share_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  class_type TEXT DEFAULT 'common' CHECK (class_type IN ('common', 'preferred', 'option', 'warrant')),
  series TEXT,
  authorized_shares BIGINT DEFAULT 0 CHECK (authorized_shares >= 0),
  par_value DECIMAL(10,4) DEFAULT 0.001 CHECK (par_value >= 0),
  liquidation_preference DECIMAL(10,2) DEFAULT 1.0 CHECK (liquidation_preference >= 0),
  liquidation_multiple DECIMAL(10,2) DEFAULT 1.0 CHECK (liquidation_multiple >= 0),
  is_participating BOOLEAN DEFAULT FALSE,
  dividend_rate DECIMAL(5,2) DEFAULT 0.0 CHECK (dividend_rate >= 0 AND dividend_rate <= 100),
  voting_rights_per_share DECIMAL(10,4) DEFAULT 1.0 CHECK (voting_rights_per_share >= 0),
  anti_dilution_type TEXT DEFAULT 'none' CHECK (anti_dilution_type IN ('none', 'full_ratchet', 'weighted_average')),
  conversion_ratio DECIMAL(10,4) DEFAULT 1.0 CHECK (conversion_ratio > 0),
  seniority INTEGER DEFAULT 1 CHECK (seniority > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_share_class_name_per_company UNIQUE (company_id, name)
);

-- Equity grants table
CREATE TABLE IF NOT EXISTS equity_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shareholder_id UUID NOT NULL REFERENCES shareholders(id) ON DELETE CASCADE,
  share_class_id UUID NOT NULL REFERENCES share_classes(id) ON DELETE RESTRICT,
  grant_type TEXT DEFAULT 'shares' CHECK (grant_type IN ('shares', 'options', 'warrants', 'rsus', 'safe')),
  shares_granted BIGINT NOT NULL CHECK (shares_granted > 0),
  shares_outstanding BIGINT DEFAULT 0 CHECK (shares_outstanding >= 0),
  grant_date DATE NOT NULL,
  vesting_start_date DATE,
  vesting_cliff_months INTEGER DEFAULT 0 CHECK (vesting_cliff_months >= 0),
  vesting_period_months INTEGER DEFAULT 48 CHECK (vesting_period_months > 0),
  exercise_price DECIMAL(10,4) DEFAULT 0.0 CHECK (exercise_price >= 0),
  fair_market_value DECIMAL(10,4) DEFAULT 0.0 CHECK (fair_market_value >= 0),
  expiration_date DATE,
  series TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funding rounds table
CREATE TABLE IF NOT EXISTS funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
  round_type TEXT DEFAULT 'seed' CHECK (round_type IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'series_d', 'series_e', 'bridge', 'safe', 'convertible', 'other')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'open', 'closed', 'cancelled')),
  target_amount DECIMAL(15,2) CHECK (target_amount > 0),
  raised_amount DECIMAL(15,2) DEFAULT 0.0 CHECK (raised_amount >= 0),
  pre_money_valuation DECIMAL(15,2) CHECK (pre_money_valuation >= 0),
  post_money_valuation DECIMAL(15,2) CHECK (post_money_valuation >= 0),
  price_per_share DECIMAL(10,4) CHECK (price_per_share >= 0),
  shares_issued BIGINT DEFAULT 0 CHECK (shares_issued >= 0),
  opening_date DATE,
  closing_date DATE,
  lead_investor TEXT,
  terms_summary TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_valuation_relationship CHECK (post_money_valuation >= pre_money_valuation),
  CONSTRAINT valid_closing_date CHECK (closing_date IS NULL OR opening_date IS NULL OR closing_date >= opening_date)
);

-- Transactions table (for secondary transactions, exercises, etc.)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('exercise', 'transfer', 'grant', 'cancellation', 'conversion', 'repurchase')),
  from_shareholder_id UUID REFERENCES shareholders(id),
  to_shareholder_id UUID REFERENCES shareholders(id),
  share_class_id UUID NOT NULL REFERENCES share_classes(id),
  shares BIGINT NOT NULL CHECK (shares > 0),
  price_per_share DECIMAL(10,4) CHECK (price_per_share >= 0),
  total_amount DECIMAL(15,2) CHECK (total_amount >= 0),
  transaction_date DATE NOT NULL,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT transaction_participants CHECK (
    (transaction_type IN ('exercise', 'grant', 'cancellation') AND from_shareholder_id IS NULL) OR
    (transaction_type IN ('transfer', 'repurchase') AND from_shareholder_id IS NOT NULL AND to_shareholder_id IS NOT NULL) OR
    (transaction_type = 'conversion' AND from_shareholder_id IS NOT NULL)
  )
);

-- Scenarios table (for what-if analysis)
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
  description TEXT,
  scenario_type TEXT DEFAULT 'funding' CHECK (scenario_type IN ('funding', 'exit', 'option_pool', 'secondary', 'custom')),
  base_date DATE DEFAULT CURRENT_DATE,
  scenario_data JSONB NOT NULL DEFAULT '{}',
  results JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_scenario_name_per_company UNIQUE (company_id, name)
);

-- Share links table (for secure sharing)
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{"canView": true, "canComment": false, "canEdit": false}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  access_count INTEGER DEFAULT 0 CHECK (access_count >= 0),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  session_id TEXT
);

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_clerk_user_id ON companies(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Shareholders indexes
CREATE INDEX IF NOT EXISTS idx_shareholders_company_id ON shareholders(company_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_email ON shareholders(email);
CREATE INDEX IF NOT EXISTS idx_shareholders_type ON shareholders(shareholder_type);
CREATE INDEX IF NOT EXISTS idx_shareholders_active ON shareholders(is_active) WHERE is_active = true;

-- Share classes indexes
CREATE INDEX IF NOT EXISTS idx_share_classes_company_id ON share_classes(company_id);
CREATE INDEX IF NOT EXISTS idx_share_classes_type ON share_classes(class_type);
CREATE INDEX IF NOT EXISTS idx_share_classes_series ON share_classes(series);

-- Equity grants indexes
CREATE INDEX IF NOT EXISTS idx_equity_grants_company_id ON equity_grants(company_id);
CREATE INDEX IF NOT EXISTS idx_equity_grants_shareholder_id ON equity_grants(shareholder_id);
CREATE INDEX IF NOT EXISTS idx_equity_grants_share_class_id ON equity_grants(share_class_id);
CREATE INDEX IF NOT EXISTS idx_equity_grants_grant_type ON equity_grants(grant_type);
CREATE INDEX IF NOT EXISTS idx_equity_grants_grant_date ON equity_grants(grant_date);
CREATE INDEX IF NOT EXISTS idx_equity_grants_active ON equity_grants(is_active) WHERE is_active = true;

-- Funding rounds indexes
CREATE INDEX IF NOT EXISTS idx_funding_rounds_company_id ON funding_rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_type ON funding_rounds(round_type);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_status ON funding_rounds(status);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_closing_date ON funding_rounds(closing_date);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_from_shareholder ON transactions(from_shareholder_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_shareholder ON transactions(to_shareholder_id);
CREATE INDEX IF NOT EXISTS idx_transactions_share_class ON transactions(share_class_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- Scenarios indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_company_id ON scenarios(company_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_type ON scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenarios_active ON scenarios(is_active) WHERE is_active = true;

-- Share links indexes
CREATE INDEX IF NOT EXISTS idx_share_links_scenario_id ON share_links(scenario_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active) WHERE is_active = true;

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_companies_name_search ON companies USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_shareholders_name_search ON shareholders USING gin(to_tsvector('english', name));

-- =============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. CREATE RLS POLICIES
-- =============================================

-- Companies policies
CREATE POLICY "companies_select_policy" ON companies FOR SELECT
USING (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "companies_insert_policy" ON companies FOR INSERT
WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "companies_update_policy" ON companies FOR UPDATE
USING (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "companies_delete_policy" ON companies FOR DELETE
USING (clerk_user_id = current_setting('app.current_user_id', true));

-- Helper function for company access
CREATE OR REPLACE FUNCTION user_has_company_access(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM companies 
    WHERE id = company_uuid 
    AND clerk_user_id = current_setting('app.current_user_id', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Shareholders policies
CREATE POLICY "shareholders_select_policy" ON shareholders FOR SELECT
USING (user_has_company_access(company_id));

CREATE POLICY "shareholders_insert_policy" ON shareholders FOR INSERT
WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "shareholders_update_policy" ON shareholders FOR UPDATE
USING (user_has_company_access(company_id));

CREATE POLICY "shareholders_delete_policy" ON shareholders FOR DELETE
USING (user_has_company_access(company_id));

-- Share classes policies
CREATE POLICY "share_classes_select_policy" ON share_classes FOR SELECT
USING (user_has_company_access(company_id));

CREATE POLICY "share_classes_insert_policy" ON share_classes FOR INSERT
WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "share_classes_update_policy" ON share_classes FOR UPDATE
USING (user_has_company_access(company_id));

CREATE POLICY "share_classes_delete_policy" ON share_classes FOR DELETE
USING (user_has_company_access(company_id));

-- Equity grants policies
CREATE POLICY "equity_grants_select_policy" ON equity_grants FOR SELECT
USING (user_has_company_access(company_id));

CREATE POLICY "equity_grants_insert_policy" ON equity_grants FOR INSERT
WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "equity_grants_update_policy" ON equity_grants FOR UPDATE
USING (user_has_company_access(company_id));

CREATE POLICY "equity_grants_delete_policy" ON equity_grants FOR DELETE
USING (user_has_company_access(company_id));

-- Funding rounds policies
CREATE POLICY "funding_rounds_select_policy" ON funding_rounds FOR SELECT
USING (user_has_company_access(company_id));

CREATE POLICY "funding_rounds_insert_policy" ON funding_rounds FOR INSERT
WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "funding_rounds_update_policy" ON funding_rounds FOR UPDATE
USING (user_has_company_access(company_id));

CREATE POLICY "funding_rounds_delete_policy" ON funding_rounds FOR DELETE
USING (user_has_company_access(company_id));

-- Transactions policies
CREATE POLICY "transactions_select_policy" ON transactions FOR SELECT
USING (user_has_company_access(company_id));

CREATE POLICY "transactions_insert_policy" ON transactions FOR INSERT
WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "transactions_update_policy" ON transactions FOR UPDATE
USING (user_has_company_access(company_id));

CREATE POLICY "transactions_delete_policy" ON transactions FOR DELETE
USING (user_has_company_access(company_id));

-- Scenarios policies
CREATE POLICY "scenarios_select_policy" ON scenarios FOR SELECT
USING (user_has_company_access(company_id));

CREATE POLICY "scenarios_insert_policy" ON scenarios FOR INSERT
WITH CHECK (user_has_company_access(company_id));

CREATE POLICY "scenarios_update_policy" ON scenarios FOR UPDATE
USING (user_has_company_access(company_id));

CREATE POLICY "scenarios_delete_policy" ON scenarios FOR DELETE
USING (user_has_company_access(company_id));

-- Share links policies (special case - can be accessed by token)
CREATE POLICY "share_links_select_policy" ON share_links FOR SELECT
USING (
  created_by_user_id = current_setting('app.current_user_id', true) OR
  (is_active = true AND expires_at > NOW())
);

CREATE POLICY "share_links_insert_policy" ON share_links FOR INSERT
WITH CHECK (created_by_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "share_links_update_policy" ON share_links FOR UPDATE
USING (created_by_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "share_links_delete_policy" ON share_links FOR DELETE
USING (created_by_user_id = current_setting('app.current_user_id', true));

-- Audit logs policies (read-only for users)
CREATE POLICY "audit_logs_select_policy" ON audit_logs FOR SELECT
USING (user_has_company_access(company_id));

-- =============================================
-- 6. CREATE AUDIT TRIGGERS
-- =============================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  company_uuid UUID;
BEGIN
  -- Extract company_id from the record
  IF TG_OP = 'DELETE' THEN
    old_data = row_to_json(OLD)::jsonb;
    company_uuid = OLD.company_id;
  ELSIF TG_OP = 'INSERT' THEN
    new_data = row_to_json(NEW)::jsonb;
    company_uuid = NEW.company_id;
  ELSE
    old_data = row_to_json(OLD)::jsonb;
    new_data = row_to_json(NEW)::jsonb;
    company_uuid = NEW.company_id;
  END IF;

  -- Insert audit record
  INSERT INTO audit_logs (
    company_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_by
  ) VALUES (
    company_uuid,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_data,
    new_data,
    current_setting('app.current_user_id', true)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all audited tables
CREATE TRIGGER audit_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_shareholders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON shareholders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_share_classes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON share_classes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_equity_grants_trigger
  AFTER INSERT OR UPDATE OR DELETE ON equity_grants
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_funding_rounds_trigger
  AFTER INSERT OR UPDATE OR DELETE ON funding_rounds
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- 7. CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to set user context for RLS
CREATE OR REPLACE FUNCTION set_config(setting_name text, setting_value text, is_local boolean)
RETURNS text AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, is_local);
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total shares outstanding
CREATE OR REPLACE FUNCTION calculate_total_shares_outstanding(company_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
  total_shares BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(shares_outstanding), 0)
  INTO total_shares
  FROM equity_grants
  WHERE company_id = company_uuid AND is_active = true;
  
  RETURN total_shares;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate ownership percentage
CREATE OR REPLACE FUNCTION calculate_ownership_percentage(company_uuid UUID, shareholder_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  shareholder_shares BIGINT := 0;
  total_shares BIGINT := 0;
BEGIN
  -- Get shareholder's total shares
  SELECT COALESCE(SUM(shares_outstanding), 0)
  INTO shareholder_shares
  FROM equity_grants
  WHERE company_id = company_uuid 
    AND shareholder_id = shareholder_uuid 
    AND is_active = true;
  
  -- Get total company shares
  total_shares := calculate_total_shares_outstanding(company_uuid);
  
  -- Calculate percentage
  IF total_shares > 0 THEN
    RETURN (shareholder_shares::DECIMAL / total_shares::DECIMAL) * 100;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- =============================================

-- Cap table summary view
CREATE OR REPLACE VIEW cap_table_summary AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  s.id as shareholder_id,
  s.name as shareholder_name,
  s.shareholder_type,
  sc.name as share_class_name,
  sc.class_type,
  SUM(eg.shares_outstanding) as total_shares,
  calculate_ownership_percentage(c.id, s.id) as ownership_percentage,
  MAX(eg.updated_at) as last_updated
FROM companies c
JOIN equity_grants eg ON c.id = eg.company_id
JOIN shareholders s ON eg.shareholder_id = s.id
JOIN share_classes sc ON eg.share_class_id = sc.id
WHERE eg.is_active = true AND s.is_active = true
GROUP BY c.id, c.name, s.id, s.name, s.shareholder_type, sc.name, sc.class_type;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
  al.id,
  al.company_id,
  c.name as company_name,
  al.table_name,
  al.action,
  al.changed_by,
  al.changed_at,
  al.new_values->>'name' as record_name
FROM audit_logs al
JOIN companies c ON al.company_id = c.id
ORDER BY al.changed_at DESC
LIMIT 100;

-- =============================================
-- 9. GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- =============================================
-- 10. INSERT DEFAULT DATA
-- =============================================

-- Insert default share classes
INSERT INTO share_classes (id, company_id, name, class_type, authorized_shares)
SELECT 
  gen_random_uuid(),
  c.id,
  'Common Stock',
  'common',
  c.authorized_shares
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM share_classes sc 
  WHERE sc.company_id = c.id AND sc.name = 'Common Stock'
);

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '📊 Tables created: companies, shareholders, share_classes, equity_grants, funding_rounds, transactions, scenarios, share_links, audit_logs';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '📈 Performance indexes created';
  RAISE NOTICE '📝 Audit triggers activated';
  RAISE NOTICE '🔍 Utility functions and views created';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '1. Test RLS policies with your application';
  RAISE NOTICE '2. Run performance tests with sample data';
  RAISE NOTICE '3. Set up database monitoring';
  RAISE NOTICE '4. Configure automated backups';
  RAISE NOTICE '5. Review and adjust constraints as needed';
END $$;