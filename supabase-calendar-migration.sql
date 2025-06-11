-- 📅 Calendar Integration Migration for Supabase
-- Run this in your Supabase SQL Editor

-- Create employee_calendars table
CREATE TABLE IF NOT EXISTS employee_calendars (
  id SERIAL PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  employee_email VARCHAR(255) UNIQUE NOT NULL,
  ical_url TEXT,
  calendar_type VARCHAR(50) DEFAULT 'ical',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 300 -- seconds between syncs
);

-- Create calendar_events table (optional - for caching)
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employee_calendars(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(500),
  is_all_day BOOLEAN DEFAULT false,
  attendees JSONB DEFAULT '[]',
  organizer VARCHAR(255),
  status VARCHAR(50) DEFAULT 'confirmed',
  visibility VARCHAR(50) DEFAULT 'public',
  calendar_type VARCHAR(50) DEFAULT 'ical',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, event_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_calendars_active ON employee_calendars(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_calendars_email ON employee_calendars(employee_email);
CREATE INDEX IF NOT EXISTS idx_calendar_events_employee ON calendar_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync ON calendar_events(synced_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_calendars_updated_at 
  BEFORE UPDATE ON employee_calendars 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial Moniteye employees
INSERT INTO employee_calendars (employee_name, employee_email, calendar_type, is_active) VALUES
  ('Alex Keal', 'alex@moniteye.com', 'ical', false),
  ('Mark Richardson', 'mark.r@moniteye.com', 'ical', false),
  ('Mark Nockles', 'mark.n@moniteye.com', 'ical', false),
  ('Richard Booth', 'richard@moniteye.com', 'ical', false)
ON CONFLICT (employee_email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE employee_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read employee calendars" 
  ON employee_calendars FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to read calendar events" 
  ON calendar_events FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policies for service role (for API)
CREATE POLICY "Allow service role full access to employee_calendars" 
  ON employee_calendars FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Allow service role full access to calendar_events" 
  ON calendar_events FOR ALL 
  TO service_role 
  USING (true);

-- Create view for easy employee calendar overview
CREATE OR REPLACE VIEW employee_calendar_overview AS
SELECT 
  ec.id,
  ec.employee_name,
  ec.employee_email,
  ec.calendar_type,
  ec.is_active,
  ec.last_sync,
  ec.sync_frequency,
  COUNT(ce.id) as cached_events_count,
  MAX(ce.synced_at) as last_event_sync
FROM employee_calendars ec
LEFT JOIN calendar_events ce ON ec.id = ce.employee_id
GROUP BY ec.id, ec.employee_name, ec.employee_email, ec.calendar_type, ec.is_active, ec.last_sync, ec.sync_frequency
ORDER BY ec.employee_name;

-- Grant access to the view
GRANT SELECT ON employee_calendar_overview TO authenticated, service_role; 