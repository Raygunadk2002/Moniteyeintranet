-- Supabase Database Schema for Invoice Upload System
-- Run this script in your Supabase SQL editor to create the required tables

-- Table to store upload batch metadata
CREATE TABLE IF NOT EXISTS upload_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text,
  total_invoices integer NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  months_generated integer NOT NULL,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store individual invoice records
CREATE TABLE IF NOT EXISTS invoices (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_date date NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  month_reference text NOT NULL,
  upload_batch_id uuid REFERENCES upload_batches(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store aggregated monthly revenue data
CREATE TABLE IF NOT EXISTS revenue_data (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  month text NOT NULL,
  revenue numeric(10,2) NOT NULL,
  year integer NOT NULL,
  month_number integer NOT NULL CHECK (month_number >= 1 AND month_number <= 12),
  invoice_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store task columns (Kanban board columns)
CREATE TABLE IF NOT EXISTS task_columns (
  id text PRIMARY KEY,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store tasks
CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  priority text CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  assignee text,
  tags text[] DEFAULT '{}',
  column_id text NOT NULL REFERENCES task_columns(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Environmental Monitoring Equipment Inventory Tables

-- Table to store equipment categories/types
CREATE TABLE IF NOT EXISTS equipment_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text DEFAULT '📊',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store equipment locations
CREATE TABLE IF NOT EXISTS equipment_locations (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text,
  coordinates text, -- lat,lng format
  contact_person text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Main equipment inventory table
CREATE TABLE IF NOT EXISTS equipment_inventory (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  equipment_id text UNIQUE NOT NULL, -- User-defined equipment ID (e.g., MON-001)
  name text NOT NULL,
  category_id text REFERENCES equipment_categories(id),
  manufacturer text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_cost numeric(10,2),
  warranty_expiry date,
  location_id text REFERENCES equipment_locations(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'lost')),
  condition_rating integer CHECK (condition_rating >= 1 AND condition_rating <= 5),
  last_calibration_date date,
  next_calibration_due date,
  calibration_frequency_months integer DEFAULT 12,
  notes text,
  specifications jsonb, -- Store technical specs as JSON
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store maintenance records
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  equipment_id text REFERENCES equipment_inventory(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'calibration', 'inspection')),
  performed_by text NOT NULL,
  performed_date date NOT NULL,
  description text NOT NULL,
  cost numeric(10,2),
  next_maintenance_due date,
  parts_replaced text[],
  status text DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store calibration records
CREATE TABLE IF NOT EXISTS equipment_calibration (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  equipment_id text REFERENCES equipment_inventory(id) ON DELETE CASCADE,
  calibration_date date NOT NULL,
  calibrated_by text NOT NULL,
  calibration_standard text,
  results jsonb, -- Store calibration results as JSON
  passed boolean NOT NULL,
  certificate_number text,
  next_calibration_due date NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store equipment upload batches (for CSV imports)
CREATE TABLE IF NOT EXISTS equipment_upload_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text,
  total_equipment integer NOT NULL,
  successful_imports integer NOT NULL,
  failed_imports integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_month_ref ON invoices(month_reference);
CREATE INDEX IF NOT EXISTS idx_invoices_batch ON invoices(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_revenue_year_month ON revenue_data(year, month_number);
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_task_columns_order ON task_columns(order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_category ON equipment_inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_location ON equipment_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_status ON equipment_inventory(status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_equipment ON equipment_calibration(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_due ON equipment_calibration(next_calibration_due);

-- Enable Row Level Security (RLS)
ALTER TABLE upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_upload_batches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON upload_batches;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON upload_batches;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON revenue_data;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON revenue_data;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON revenue_data;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON task_columns;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON task_columns;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON task_columns;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON task_columns;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON equipment_categories;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON equipment_categories;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON equipment_locations;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON equipment_locations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON equipment_inventory;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON equipment_inventory;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON equipment_maintenance;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON equipment_maintenance;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON equipment_calibration;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON equipment_calibration;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON equipment_upload_batches;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON equipment_upload_batches;

-- Create policies for authenticated access
CREATE POLICY "Enable read access for authenticated users" ON upload_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON upload_batches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON revenue_data
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON revenue_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON revenue_data
  FOR DELETE USING (auth.role() = 'authenticated');

-- Task columns policies
CREATE POLICY "Enable read access for authenticated users" ON task_columns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON task_columns
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON task_columns
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON task_columns
  FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks policies
CREATE POLICY "Enable read access for authenticated users" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- Equipment categories policies
CREATE POLICY "Enable read access for authenticated users" ON equipment_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Equipment locations policies
CREATE POLICY "Enable read access for authenticated users" ON equipment_locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Equipment inventory policies
CREATE POLICY "Enable read access for authenticated users" ON equipment_inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_inventory
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON equipment_maintenance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_maintenance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON equipment_calibration
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_calibration
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON equipment_upload_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_upload_batches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_timestamp_upload_batches ON upload_batches;
DROP TRIGGER IF EXISTS set_timestamp_revenue_data ON revenue_data;
DROP TRIGGER IF EXISTS set_timestamp_task_columns ON task_columns;
DROP TRIGGER IF EXISTS set_timestamp_tasks ON tasks;
DROP TRIGGER IF EXISTS set_timestamp_equipment_categories ON equipment_categories;
DROP TRIGGER IF EXISTS set_timestamp_equipment_locations ON equipment_locations;
DROP TRIGGER IF EXISTS set_timestamp_equipment_inventory ON equipment_inventory;
DROP TRIGGER IF EXISTS set_timestamp_equipment_maintenance ON equipment_maintenance;
DROP TRIGGER IF EXISTS set_timestamp_equipment_calibration ON equipment_calibration;
DROP TRIGGER IF EXISTS set_timestamp_equipment_upload_batches ON equipment_upload_batches;

-- Create triggers to automatically update timestamps
CREATE TRIGGER set_timestamp_upload_batches
  BEFORE UPDATE ON upload_batches
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_revenue_data
  BEFORE UPDATE ON revenue_data
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_task_columns
  BEFORE UPDATE ON task_columns
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_tasks
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_equipment_categories
  BEFORE UPDATE ON equipment_categories
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_equipment_locations
  BEFORE UPDATE ON equipment_locations
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_equipment_inventory
  BEFORE UPDATE ON equipment_inventory
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_equipment_maintenance
  BEFORE UPDATE ON equipment_maintenance
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_equipment_calibration
  BEFORE UPDATE ON equipment_calibration
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_equipment_upload_batches
  BEFORE UPDATE ON equipment_upload_batches
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Grant necessary permissions to the service role
GRANT ALL ON upload_batches TO service_role;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON revenue_data TO service_role;
GRANT ALL ON task_columns TO service_role;
GRANT ALL ON tasks TO service_role;
GRANT ALL ON equipment_categories TO service_role;
GRANT ALL ON equipment_locations TO service_role;
GRANT ALL ON equipment_inventory TO service_role;
GRANT ALL ON equipment_maintenance TO service_role;
GRANT ALL ON equipment_calibration TO service_role;
GRANT ALL ON equipment_upload_batches TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Comment on tables for documentation
COMMENT ON TABLE upload_batches IS 'Stores metadata about file uploads including totals and date ranges';
COMMENT ON TABLE invoices IS 'Stores individual invoice records from uploaded files';
COMMENT ON TABLE revenue_data IS 'Stores aggregated monthly revenue data calculated from invoices';
COMMENT ON TABLE task_columns IS 'Stores Kanban board columns for task management';
COMMENT ON TABLE tasks IS 'Stores individual tasks with priorities, assignees, and status';
COMMENT ON TABLE equipment_categories IS 'Stores equipment categories/types for inventory management';
COMMENT ON TABLE equipment_locations IS 'Stores equipment locations for inventory management';
COMMENT ON TABLE equipment_inventory IS 'Stores equipment inventory data for monitoring and management';
COMMENT ON TABLE equipment_maintenance IS 'Stores equipment maintenance records for tracking and scheduling';
COMMENT ON TABLE equipment_calibration IS 'Stores equipment calibration records for tracking and validation';
COMMENT ON TABLE equipment_upload_batches IS 'Stores metadata about equipment upload batches for CSV imports';

-- Insert default task columns
INSERT INTO task_columns (id, title, order_index) VALUES
('backlog', '📋 Backlog', 0),
('todo', '📝 To Do', 1),
('in-progress', '🔄 In Progress', 2),
('review', '👀 Review', 3),
('done', '✅ Done', 4)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, priority, assignee, tags, column_id, order_index) VALUES
('task-1', 'System Performance Audit', 'Complete comprehensive review of system performance metrics and identify bottlenecks', 'High', 'Alex K.', ARRAY['performance', 'audit'], 'backlog', 0),
('task-2', 'Update Security Protocols', 'Review and update all security protocols according to latest compliance standards', 'Medium', 'Sarah M.', ARRAY['security', 'compliance'], 'backlog', 1),
('task-3', 'Database Optimization', 'Optimize database queries and indexing for better performance', 'Low', 'Mike R.', ARRAY['database', 'optimization'], 'todo', 0),
('task-4', 'API Integration', 'Integrate third-party payment gateway API', 'Critical', 'Jessica L.', ARRAY['api', 'payment'], 'in-progress', 0),
('task-5', 'User Authentication', 'Implement secure user authentication system', 'High', 'David C.', ARRAY['auth', 'security'], 'done', 0)
ON CONFLICT (id) DO NOTHING;

-- Insert default equipment categories
INSERT INTO equipment_categories (id, name, description, icon) VALUES
  ('air-quality', 'Air Quality Monitors', 'Equipment for monitoring air pollution and quality', '🌬️'),
  ('water-quality', 'Water Quality Monitors', 'Equipment for monitoring water pollution and quality', '💧'),
  ('noise', 'Noise Monitors', 'Equipment for monitoring noise pollution levels', '🔊'),
  ('vibration', 'Vibration Monitors', 'Equipment for monitoring structural vibrations', '📳'),
  ('weather', 'Weather Stations', 'Equipment for monitoring weather conditions', '🌤️'),
  ('dust', 'Dust Monitors', 'Equipment for monitoring particulate matter', '💨'),
  ('gas', 'Gas Detectors', 'Equipment for detecting specific gases', '⚗️'),
  ('radiation', 'Radiation Monitors', 'Equipment for monitoring radiation levels', '☢️')
ON CONFLICT (id) DO NOTHING;

-- Insert default locations
INSERT INTO equipment_locations (id, name, address, notes) VALUES
  ('office-main', 'Main Office', 'Moniteye Head Office', 'Primary office location'),
  ('warehouse', 'Equipment Warehouse', 'Storage facility', 'Equipment storage and preparation'),
  ('field-temp', 'Temporary Field Location', 'Various field locations', 'For equipment deployed temporarily')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data insertion (optional - remove if you don't want sample data)
-- INSERT INTO revenue_data (month, revenue, year, month_number, invoice_count) VALUES
-- ('January 2025', 15750.25, 2025, 1, 12),
-- ('February 2025', 18500.50, 2025, 2, 15),
-- ('March 2025', 22100.75, 2025, 3, 18); 