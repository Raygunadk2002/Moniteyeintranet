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
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_category ON equipment_inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_location ON equipment_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_status ON equipment_inventory(status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_equipment ON equipment_calibration(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_due ON equipment_calibration(next_calibration_due);

-- Enable Row Level Security (RLS)
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_upload_batches ENABLE ROW LEVEL SECURITY;

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

-- Create triggers to automatically update timestamps
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
GRANT ALL ON equipment_categories TO service_role;
GRANT ALL ON equipment_locations TO service_role;
GRANT ALL ON equipment_inventory TO service_role;
GRANT ALL ON equipment_maintenance TO service_role;
GRANT ALL ON equipment_calibration TO service_role;
GRANT ALL ON equipment_upload_batches TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Insert default equipment categories
INSERT INTO equipment_categories (id, name, description, icon) VALUES
  ('air-quality', 'Air Quality', 'Equipment for monitoring air pollution and quality', '🌬️'),
  ('water-quality', 'Water Quality', 'Equipment for monitoring water pollution and quality', '💧'),
  ('noise', 'Noise', 'Equipment for monitoring noise pollution levels', '🔊'),
  ('vibration', 'Vibration', 'Equipment for monitoring structural vibrations', '📳'),
  ('weather', 'Weather', 'Equipment for monitoring weather conditions', '🌤️'),
  ('dust', 'Dust', 'Equipment for monitoring particulate matter', '💨'),
  ('gas', 'Gas', 'Equipment for detecting specific gases', '⚗️'),
  ('radiation', 'Radiation', 'Equipment for monitoring radiation levels', '☢️')
ON CONFLICT (id) DO NOTHING;

-- Insert default locations
INSERT INTO equipment_locations (id, name, address, notes) VALUES
  ('office', 'Office', 'Moniteye Head Office', 'Primary office location'),
  ('warehouse', 'Warehouse', 'Equipment storage facility', 'Equipment storage and preparation'),
  ('field', 'Field', 'Various field locations', 'For equipment deployed temporarily')
ON CONFLICT (id) DO NOTHING; 