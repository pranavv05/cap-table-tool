-- Add new columns for SAFE rounds, ESOP management, and founder secondary
ALTER TABLE funding_rounds 
ADD COLUMN round_stage VARCHAR(50),
ADD COLUMN valuation_cap DECIMAL(15,2),
ADD COLUMN discount_rate DECIMAL(5,2),
ADD COLUMN most_favored_nation BOOLEAN DEFAULT FALSE,
ADD COLUMN esop_top_up BOOLEAN DEFAULT FALSE,
ADD COLUMN esop_percentage DECIMAL(5,2),
ADD COLUMN esop_shares INTEGER,
ADD COLUMN founder_secondary BOOLEAN DEFAULT FALSE,
ADD COLUMN secondary_amount DECIMAL(15,2),
ADD COLUMN secondary_founders TEXT[];

-- Update existing round_type enum to include SAFE
ALTER TABLE funding_rounds 
ALTER COLUMN round_type TYPE VARCHAR(50);

-- Add check constraints for round stages
ALTER TABLE funding_rounds 
ADD CONSTRAINT check_round_stage 
CHECK (round_stage IN ('pre-seed', 'seed', 'series_a', 'series_b', 'series_c', 'series_d', 'bridge', 'growth'));

-- Add check constraints for round types
ALTER TABLE funding_rounds 
ADD CONSTRAINT check_round_type 
CHECK (round_type IN ('safe', 'priced'));
