-- Updated Equipment Schema with Serial Number as Primary Key
-- This script migrates the equipment system to use serial_number as the primary key

-- First, drop existing foreign key constraints
ALTER TABLE IF EXISTS equipment_maintenance DROP CONSTRAINT IF EXISTS equipment_maintenance_equipment_id_fkey;
ALTER TABLE IF EXISTS equipment_calibration DROP CONSTRAINT IF EXISTS equipment_calibration_equipment_id_fkey;
ALTER TABLE IF EXISTS equipment_notes DROP CONSTRAINT IF EXISTS fk_equipment_notes_equipment;

-- Drop existing indexes that reference the old primary key
DROP INDEX IF EXISTS idx_equipment_maintenance_equipment;
DROP INDEX IF EXISTS idx_equipment_calibration_equipment;
DROP INDEX IF EXISTS idx_equipment_notes_equipment_id;

-- Create backup of existing data (optional - for safety)
-- CREATE TABLE equipment_inventory_backup AS SELECT * FROM equipment_inventory;

-- Drop and recreate the equipment_inventory table with serial_number as primary key
DROP TABLE IF EXISTS equipment_inventory CASCADE;

CREATE TABLE equipment_inventory (
  serial_number text PRIMARY KEY NOT NULL, -- Serial number is now the primary key
  equipment_id text UNIQUE, -- Optional user-defined equipment ID (e.g., MON-001)
  name text NOT NULL,
  category_id text REFERENCES equipment_categories(id),
  manufacturer text,
  model text,
  purchase_date date,
  purchase_cost numeric(10,2),
  warranty_expiry date,
  location_id text, -- Free text location field
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

-- Update maintenance table to reference serial_number
DROP TABLE IF EXISTS equipment_maintenance CASCADE;

CREATE TABLE equipment_maintenance (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  serial_number text REFERENCES equipment_inventory(serial_number) ON DELETE CASCADE,
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

-- Update calibration table to reference serial_number
DROP TABLE IF EXISTS equipment_calibration CASCADE;

CREATE TABLE equipment_calibration (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  serial_number text REFERENCES equipment_inventory(serial_number) ON DELETE CASCADE,
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

-- Update equipment_notes table to reference serial_number as primary key
DROP TABLE IF EXISTS equipment_notes CASCADE;

CREATE TABLE equipment_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number text NOT NULL REFERENCES equipment_inventory(serial_number) ON DELETE CASCADE,
  equipment_id text, -- Keep for backward compatibility but not required
  note_text TEXT NOT NULL,
  author VARCHAR DEFAULT 'System User',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update location history table to reference serial_number
DROP TABLE IF EXISTS equipment_location_history CASCADE;

CREATE TABLE equipment_location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number text NOT NULL REFERENCES equipment_inventory(serial_number) ON DELETE CASCADE,
  equipment_id text, -- Keep for backward compatibility
  name text,
  location_id text NOT NULL, -- Free text location field
  location_name text NOT NULL,
  status text,
  moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moved_by text,
  notes text,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_to TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN DEFAULT true
);

-- Create new indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_category ON equipment_inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_location ON equipment_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_status ON equipment_inventory(status);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_equipment_id ON equipment_inventory(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_serial ON equipment_maintenance(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_serial ON equipment_calibration(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_due ON equipment_calibration(next_calibration_due);
CREATE INDEX IF NOT EXISTS idx_equipment_notes_serial ON equipment_notes(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_notes_created_at ON equipment_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_location_history_serial ON equipment_location_history(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_location_history_current ON equipment_location_history(is_current);

-- Enable Row Level Security (RLS)
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_location_history ENABLE ROW LEVEL SECURITY;

-- Equipment inventory policies
CREATE POLICY "Enable read access for authenticated users" ON equipment_inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_inventory
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON equipment_inventory
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON equipment_inventory
  FOR DELETE USING (auth.role() = 'authenticated');

-- Equipment maintenance policies
CREATE POLICY "Enable read access for authenticated users" ON equipment_maintenance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_maintenance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Equipment calibration policies
CREATE POLICY "Enable read access for authenticated users" ON equipment_calibration
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_calibration
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Equipment notes policies
CREATE POLICY "Enable all operations on equipment_notes" ON equipment_notes
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable all operations on equipment_notes for anon" ON equipment_notes
  FOR ALL TO anon USING (true);

-- Equipment location history policies
CREATE POLICY "Enable read access for authenticated users" ON equipment_location_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON equipment_location_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create triggers to automatically update timestamps
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

CREATE TRIGGER set_timestamp_equipment_notes
  BEFORE UPDATE ON equipment_notes
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Grant necessary permissions to the service role
GRANT ALL ON equipment_inventory TO service_role;
GRANT ALL ON equipment_maintenance TO service_role;
GRANT ALL ON equipment_calibration TO service_role;
GRANT ALL ON equipment_notes TO service_role;
GRANT ALL ON equipment_location_history TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Insert sample equipment with serial numbers as primary keys
INSERT INTO equipment_inventory (serial_number, equipment_id, name, category_id, manufacturer, model, purchase_date, purchase_cost, location_id, status, condition_rating, last_calibration_date, next_calibration_due, calibration_frequency_months, notes) VALUES
  ('AQ2000-001', 'MON-001', 'Air Quality Monitor Alpha', 'air-quality', 'AirTech Solutions', 'AQ-Pro 2000', '2024-01-15', 2500.00, 'office-main', 'active', 5, '2024-07-15', '2025-01-15', 6, 'Primary air quality monitoring station'),
  ('WQ500-078', 'MON-002', 'Water Quality Sensor', 'water-quality', 'AquaMonitor', 'WQ-500', '2024-02-01', 1800.00, 'field-temp', 'active', 4, '2024-08-01', '2025-02-01', 6, 'Deployed at River Thames monitoring point'),
  ('NM100-234', 'MON-003', 'Noise Level Monitor', 'noise', 'SoundTech', 'NM-100', '2024-01-20', 1200.00, 'warehouse', 'maintenance', 3, '2024-06-20', '2024-12-20', 6, 'Currently undergoing calibration'),
  ('VM300-456', 'MON-004', 'Vibration Sensor Array', 'vibration', 'VibeTech', 'VM-300', '2024-03-01', 3200.00, 'field-temp', 'active', 5, '2024-09-01', '2025-03-01', 6, 'Monitoring structural vibrations at construction site'),
  ('WS200-789', 'MON-005', 'Weather Station Compact', 'weather', 'WeatherPro', 'WS-200', '2024-01-10', 1500.00, 'office-main', 'active', 4, '2024-07-10', '2025-01-10', 6, 'Rooftop weather monitoring station'),
  ('DM150-012', 'MON-006', 'Dust Particle Counter', 'dust', 'DustTech', 'DM-150', '2024-02-15', 2200.00, 'warehouse', 'active', 5, '2024-08-15', '2025-02-15', 6, 'High-precision particulate matter detector'),
  ('GTP400-156', 'MON-007', 'Gas Detection Array', 'gas', 'GasTech Pro', 'GT-Multi 400', '2024-01-10', 2800.00, 'warehouse', 'active', 5, '2024-07-10', '2025-01-10', 6, 'Multi-gas detector for CO, CO2, H2S, and VOCs'),
  ('RSM100-034', 'MON-008', 'Radiation Monitor', 'radiation', 'RadSafe', 'RS-Monitor 100', '2024-02-28', 5200.00, 'warehouse', 'retired', 2, '2024-02-28', '2025-02-28', 12, 'Retired due to sensor degradation - replacement ordered'),
  ('AT2000-002', 'MON-009', 'Air Quality Monitor Station Beta', 'air-quality', 'AirTech Solutions', 'AQ-Pro 2000', '2024-03-15', 2500.00, 'field-temp', 'active', 5, '2024-09-15', '2025-03-15', 6, 'Secondary air quality monitoring station for field deployment')
ON CONFLICT (serial_number) DO NOTHING; 