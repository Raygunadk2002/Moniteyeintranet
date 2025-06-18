-- Business Models Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create business model persistence

-- Table to store business ideas
CREATE TABLE IF NOT EXISTS business_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  business_model TEXT CHECK (business_model IN ('SAAS', 'Hardware + SAAS', 'Straight Sales', 'Subscription Product', 'Marketplace', 'Services/Consulting', 'Ad-Supported Platform', 'Licensing/IP', 'Freemium → Premium', 'Other')) NOT NULL,
  target_market TEXT NOT NULL,
  initial_startup_cost NUMERIC(12,2) DEFAULT 0,
  ongoing_monthly_cost NUMERIC(12,2) DEFAULT 0,
  ongoing_annual_cost NUMERIC(12,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Enhanced fields for advanced modeling
  market_size TEXT,
  competitive_landscape TEXT,
  unique_value_proposition TEXT,
  expected_monthly_revenue NUMERIC(12,2) DEFAULT 0,
  expected_annual_revenue NUMERIC(12,2) DEFAULT 0,
  pricing_strategy TEXT,
  customer_acquisition_cost NUMERIC(10,2) DEFAULT 0,
  customer_lifetime_value NUMERIC(10,2) DEFAULT 0,
  time_to_market INTEGER DEFAULT 0,
  team_size INTEGER DEFAULT 0,
  key_risks TEXT,
  success_metrics TEXT,
  funding_required NUMERIC(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT business_ideas_name_check CHECK (length(name) >= 3),
  CONSTRAINT business_ideas_description_check CHECK (length(description) >= 10)
);

-- Table to store simple revenue models
CREATE TABLE IF NOT EXISTS revenue_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_idea_id UUID REFERENCES business_ideas(id) ON DELETE CASCADE NOT NULL,
  business_model TEXT NOT NULL,
  parameters JSONB NOT NULL,
  growth_assumptions JSONB,
  forecast JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT revenue_models_business_idea_unique UNIQUE (business_idea_id)
);

-- Table to store advanced business model configurations
CREATE TABLE IF NOT EXISTS advanced_business_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_idea_id UUID REFERENCES business_ideas(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  launch_year INTEGER NOT NULL,
  
  -- Model activations (stored as JSONB array)
  model_activations JSONB DEFAULT '[]',
  
  -- Model inputs for different business model types
  model_inputs JSONB DEFAULT '{}',
  
  -- Global costs configuration
  global_costs JSONB DEFAULT '{}',
  
  -- Forecast assumptions
  assumptions JSONB DEFAULT '{}',
  
  -- Forecast results
  forecast_results JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT advanced_models_name_check CHECK (length(name) >= 3),
  CONSTRAINT advanced_models_launch_year_check CHECK (launch_year >= 2020 AND launch_year <= 2050),
  CONSTRAINT advanced_models_business_idea_unique UNIQUE (business_idea_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_ideas_created_by ON business_ideas(created_by);
CREATE INDEX IF NOT EXISTS idx_business_ideas_business_model ON business_ideas(business_model);
CREATE INDEX IF NOT EXISTS idx_business_ideas_industry ON business_ideas(industry);
CREATE INDEX IF NOT EXISTS idx_business_ideas_created_at ON business_ideas(created_at);
CREATE INDEX IF NOT EXISTS idx_business_ideas_name_search ON business_ideas USING gin(to_tsvector('english', name || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_revenue_models_business_idea ON revenue_models(business_idea_id);
CREATE INDEX IF NOT EXISTS idx_revenue_models_created_at ON revenue_models(created_at);

CREATE INDEX IF NOT EXISTS idx_advanced_models_business_idea ON advanced_business_models(business_idea_id);
CREATE INDEX IF NOT EXISTS idx_advanced_models_created_at ON advanced_business_models(created_at);

-- Enable Row Level Security
ALTER TABLE business_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_business_models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own business ideas" ON business_ideas;
DROP POLICY IF EXISTS "Users can insert own business ideas" ON business_ideas;
DROP POLICY IF EXISTS "Users can update own business ideas" ON business_ideas;
DROP POLICY IF EXISTS "Users can delete own business ideas" ON business_ideas;
DROP POLICY IF EXISTS "Admins can view all business ideas" ON business_ideas;
DROP POLICY IF EXISTS "Admins can manage all business ideas" ON business_ideas;

DROP POLICY IF EXISTS "Users can view own revenue models" ON revenue_models;
DROP POLICY IF EXISTS "Users can manage own revenue models" ON revenue_models;
DROP POLICY IF EXISTS "Admins can view all revenue models" ON revenue_models;
DROP POLICY IF EXISTS "Admins can manage all revenue models" ON revenue_models;

DROP POLICY IF EXISTS "Users can view own advanced models" ON advanced_business_models;
DROP POLICY IF EXISTS "Users can manage own advanced models" ON advanced_business_models;
DROP POLICY IF EXISTS "Admins can view all advanced models" ON advanced_business_models;
DROP POLICY IF EXISTS "Admins can manage all advanced models" ON advanced_business_models;

-- Create RLS policies for business_ideas
CREATE POLICY "Users can view own business ideas" ON business_ideas
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own business ideas" ON business_ideas
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own business ideas" ON business_ideas
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own business ideas" ON business_ideas
  FOR DELETE USING (auth.uid() = created_by);

-- Admin policies for business_ideas
CREATE POLICY "Admins can view all business ideas" ON business_ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage all business ideas" ON business_ideas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for revenue_models
CREATE POLICY "Users can view own revenue models" ON revenue_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_ideas 
      WHERE id = revenue_models.business_idea_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage own revenue models" ON revenue_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_ideas 
      WHERE id = revenue_models.business_idea_id AND created_by = auth.uid()
    )
  );

-- Admin policies for revenue_models
CREATE POLICY "Admins can view all revenue models" ON revenue_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage all revenue models" ON revenue_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for advanced_business_models
CREATE POLICY "Users can view own advanced models" ON advanced_business_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_ideas 
      WHERE id = advanced_business_models.business_idea_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage own advanced models" ON advanced_business_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_ideas 
      WHERE id = advanced_business_models.business_idea_id AND created_by = auth.uid()
    )
  );

-- Admin policies for advanced_business_models
CREATE POLICY "Admins can view all advanced models" ON advanced_business_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage all advanced models" ON advanced_business_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_business_ideas_updated_at ON business_ideas;
CREATE TRIGGER update_business_ideas_updated_at
    BEFORE UPDATE ON business_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_revenue_models_updated_at ON revenue_models;
CREATE TRIGGER update_revenue_models_updated_at
    BEFORE UPDATE ON revenue_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advanced_models_updated_at ON advanced_business_models;
CREATE TRIGGER update_advanced_models_updated_at
    BEFORE UPDATE ON advanced_business_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This will only insert if no business ideas exist yet
INSERT INTO business_ideas (
  name, 
  description, 
  industry, 
  business_model, 
  target_market, 
  initial_startup_cost, 
  ongoing_monthly_cost,
  tags,
  created_by
) 
SELECT 
  'AI-Powered Construction Monitoring',
  'Advanced monitoring system for construction sites using IoT sensors and AI analytics to track progress, safety, and equipment efficiency.',
  'Construction',
  'Hardware + SAAS',
  'B2B',
  50000,
  2500,
  ARRAY['AI', 'IoT', 'Construction', 'Monitoring'],
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM business_ideas)
AND EXISTS (SELECT 1 FROM auth.users);

-- Create a view for easy business idea retrieval with model status
CREATE OR REPLACE VIEW business_ideas_with_models AS
SELECT 
  bi.*,
  CASE WHEN rm.id IS NOT NULL THEN true ELSE false END as has_revenue_model,
  CASE WHEN abm.id IS NOT NULL THEN true ELSE false END as has_advanced_model,
  rm.created_at as revenue_model_created_at,
  abm.created_at as advanced_model_created_at
FROM business_ideas bi
LEFT JOIN revenue_models rm ON bi.id = rm.business_idea_id
LEFT JOIN advanced_business_models abm ON bi.id = abm.business_idea_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON business_ideas TO authenticated;
GRANT ALL ON revenue_models TO authenticated;
GRANT ALL ON advanced_business_models TO authenticated;
GRANT SELECT ON business_ideas_with_models TO authenticated; 