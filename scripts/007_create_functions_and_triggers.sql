-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shareholders_updated_at BEFORE UPDATE ON shareholders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equity_grants_updated_at BEFORE UPDATE ON equity_grants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_rounds_updated_at BEFORE UPDATE ON funding_rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate fully diluted shares
CREATE OR REPLACE FUNCTION calculate_fully_diluted_shares(company_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
    total_shares BIGINT := 0;
BEGIN
    SELECT COALESCE(SUM(shares_granted), 0)
    INTO total_shares
    FROM equity_grants
    WHERE company_id = company_uuid AND is_active = TRUE;
    
    RETURN total_shares;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate ownership percentage
CREATE OR REPLACE FUNCTION calculate_ownership_percentage(
    shareholder_uuid UUID,
    company_uuid UUID
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
    shareholder_shares BIGINT := 0;
    total_shares BIGINT := 0;
    ownership_pct DECIMAL(5,4) := 0;
BEGIN
    -- Get shareholder's total shares
    SELECT COALESCE(SUM(shares_granted), 0)
    INTO shareholder_shares
    FROM equity_grants
    WHERE shareholder_id = shareholder_uuid 
    AND company_id = company_uuid 
    AND is_active = TRUE;
    
    -- Get total company shares
    SELECT calculate_fully_diluted_shares(company_uuid)
    INTO total_shares;
    
    -- Calculate percentage
    IF total_shares > 0 THEN
        ownership_pct := (shareholder_shares::DECIMAL / total_shares::DECIMAL);
    END IF;
    
    RETURN ownership_pct;
END;
$$ LANGUAGE plpgsql;
