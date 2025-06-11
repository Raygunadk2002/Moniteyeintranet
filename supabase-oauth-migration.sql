-- Create table for storing employee Google Calendar OAuth tokens
CREATE TABLE IF NOT EXISTS employee_calendar_tokens (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  employee_name TEXT,
  google_email TEXT,
  google_name TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_calendar_tokens_employee_id ON employee_calendar_tokens(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_calendar_tokens_is_active ON employee_calendar_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_calendar_tokens_updated_at ON employee_calendar_tokens(updated_at);

-- Add Row Level Security (RLS)
ALTER TABLE employee_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust based on your authentication setup)
CREATE POLICY "Allow service role full access" ON employee_calendar_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: Add comments for documentation
COMMENT ON TABLE employee_calendar_tokens IS 'Stores Google Calendar OAuth tokens for employees';
COMMENT ON COLUMN employee_calendar_tokens.employee_id IS 'Unique identifier for the employee (e.g., alex-keal, mark-nockles)';
COMMENT ON COLUMN employee_calendar_tokens.google_access_token IS 'Google OAuth access token (encrypted in production)';
COMMENT ON COLUMN employee_calendar_tokens.google_refresh_token IS 'Google OAuth refresh token (encrypted in production)';
COMMENT ON COLUMN employee_calendar_tokens.google_token_expiry IS 'When the access token expires';
COMMENT ON COLUMN employee_calendar_tokens.is_active IS 'Whether this token connection is active';

-- Insert some example data structure (commented out - uncomment if needed for testing)
/*
INSERT INTO employee_calendar_tokens (employee_id, employee_name, is_active) VALUES
('alex-keal', 'Alex Keal', false),
('mark-nockles', 'Mark Nockles', false),
('richard-booth', 'Richard Booth', false)
ON CONFLICT (employee_id) DO NOTHING;
*/ 