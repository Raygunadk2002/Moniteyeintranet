-- Create the moniteye_events table
CREATE TABLE IF NOT EXISTS moniteye_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    event_type TEXT NOT NULL CHECK (event_type IN ('company', 'meeting', 'holiday', 'announcement')),
    created_by TEXT NOT NULL,
    location TEXT DEFAULT '',
    attendees TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_moniteye_events_start_date ON moniteye_events(start_date);
CREATE INDEX IF NOT EXISTS idx_moniteye_events_end_date ON moniteye_events(end_date);
CREATE INDEX IF NOT EXISTS idx_moniteye_events_event_type ON moniteye_events(event_type);
CREATE INDEX IF NOT EXISTS idx_moniteye_events_created_by ON moniteye_events(created_by);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_moniteye_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_moniteye_events_updated_at ON moniteye_events;
CREATE TRIGGER update_moniteye_events_updated_at
    BEFORE UPDATE ON moniteye_events
    FOR EACH ROW
    EXECUTE FUNCTION update_moniteye_events_updated_at();

-- Insert some sample data
INSERT INTO moniteye_events (title, description, start_date, end_date, all_day, event_type, created_by, location) VALUES
('Company All-Hands Meeting', 'Quarterly all-hands meeting to discuss company progress and goals', '2025-06-15 09:00:00+00', '2025-06-15 11:00:00+00', false, 'company', 'Admin', 'Main Conference Room'),
('Team Building Event', 'Annual team building activities and lunch', '2025-06-20 10:00:00+00', '2025-06-20 16:00:00+00', false, 'company', 'Admin', 'Offsite Location'),
('Important Announcement', 'New product launch announcement to all staff', '2025-06-12 14:00:00+00', '2025-06-12 15:00:00+00', false, 'announcement', 'Admin', 'Virtual Meeting'),
('Office Closure', 'Office closed for maintenance', '2025-06-25 00:00:00+00', '2025-06-25 23:59:59+00', true, 'holiday', 'Admin', '');

-- Enable Row Level Security (RLS)
ALTER TABLE moniteye_events ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all operations for now, can be restricted later)
CREATE POLICY "Allow all operations on moniteye_events" ON moniteye_events
FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to the service role
GRANT ALL ON moniteye_events TO service_role;
GRANT ALL ON moniteye_events TO postgres; 