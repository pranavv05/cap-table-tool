-- Production Database Setup for Cap Table Tool
-- Run this in your Supabase SQL editor

-- 1. Enable Row Level Security on all tables
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cap_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for multi-tenancy
-- Companies table
CREATE POLICY "Users can view own companies" ON companies
    FOR SELECT USING (auth.uid() = owner_id OR auth.uid() IN (
        SELECT user_id FROM company_members WHERE company_id = id
    ));

CREATE POLICY "Users can create companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update companies" ON companies
    FOR UPDATE USING (auth.uid() = owner_id);

-- Cap Tables
CREATE POLICY "Users can view company cap tables" ON cap_tables
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE 
            auth.uid() = owner_id OR 
            auth.uid() IN (SELECT user_id FROM company_members WHERE company_id = companies.id)
        )
    );

-- Shareholders
CREATE POLICY "Users can view company shareholders" ON shareholders
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE 
            auth.uid() = owner_id OR 
            auth.uid() IN (SELECT user_id FROM company_members WHERE company_id = companies.id)
        )
    );

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_cap_tables_company_id ON cap_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_company_id ON shareholders(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_company_id ON funding_rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);

-- 4. Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 5. Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_logs (
        company_id,
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        COALESCE(NEW.company_id, OLD.company_id),
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Apply audit triggers to important tables
CREATE TRIGGER audit_companies_trigger
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_shareholders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shareholders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();