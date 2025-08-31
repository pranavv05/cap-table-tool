-- Create share_links table for collaboration features
CREATE TABLE IF NOT EXISTS share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  created_by_user_id VARCHAR(255) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"canView": true, "canComment": false, "canEdit": false, "requiresAuth": true}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_scenario_id ON share_links(scenario_id);
CREATE INDEX IF NOT EXISTS idx_share_links_created_by ON share_links(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active);

-- Enable Row Level Security
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Create policies for share_links table
CREATE POLICY "Users can view share links they created" ON share_links
  FOR SELECT USING (
    created_by_user_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can create share links for their scenarios" ON share_links
  FOR INSERT WITH CHECK (
    created_by_user_id = current_setting('app.current_user_id', true) AND
    scenario_id IN (
      SELECT s.id FROM scenarios s
      JOIN companies c ON s.company_id = c.id
      WHERE c.clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update share links they created" ON share_links
  FOR UPDATE USING (
    created_by_user_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can delete share links they created" ON share_links
  FOR DELETE USING (
    created_by_user_id = current_setting('app.current_user_id', true)
  );

-- Create policy for public access to shared scenarios (for shared links)
CREATE POLICY "Public can access active non-expired share links" ON share_links
  FOR SELECT USING (
    is_active = true AND 
    expires_at > NOW()
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_share_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_share_links_updated_at_trigger
  BEFORE UPDATE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_share_links_updated_at();

-- Create function to increment access count
CREATE OR REPLACE FUNCTION increment_share_link_access(token_param VARCHAR(64))
RETURNS VOID AS $$
BEGIN
  UPDATE share_links 
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE share_token = token_param AND is_active = true AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_share_link_access(VARCHAR(64)) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_share_link_access(VARCHAR(64)) TO anon;