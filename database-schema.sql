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

-- Enable Row Level Security (RLS)
ALTER TABLE upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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

-- Grant necessary permissions to the service role
GRANT ALL ON upload_batches TO service_role;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON revenue_data TO service_role;
GRANT ALL ON task_columns TO service_role;
GRANT ALL ON tasks TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Comment on tables for documentation
COMMENT ON TABLE upload_batches IS 'Stores metadata about file uploads including totals and date ranges';
COMMENT ON TABLE invoices IS 'Stores individual invoice records from uploaded files';
COMMENT ON TABLE revenue_data IS 'Stores aggregated monthly revenue data calculated from invoices';
COMMENT ON TABLE task_columns IS 'Stores Kanban board columns for task management';
COMMENT ON TABLE tasks IS 'Stores individual tasks with priorities, assignees, and status';

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

-- Sample data insertion (optional - remove if you don't want sample data)
-- INSERT INTO revenue_data (month, revenue, year, month_number, invoice_count) VALUES
-- ('January 2025', 15750.25, 2025, 1, 12),
-- ('February 2025', 18500.50, 2025, 2, 15),
-- ('March 2025', 22100.75, 2025, 3, 18); 