-- Create equipment_notes table for timestamped notes/logs
CREATE TABLE IF NOT EXISTS equipment_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id VARCHAR NOT NULL,
  serial_number VARCHAR NOT NULL,
  note_text TEXT NOT NULL,
  author VARCHAR DEFAULT 'System User',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_equipment_notes_equipment 
    FOREIGN KEY (equipment_id) 
    REFERENCES equipment_inventory(equipment_id) 
    ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_notes_equipment_id 
  ON equipment_notes(equipment_id);
  
CREATE INDEX IF NOT EXISTS idx_equipment_notes_serial_number 
  ON equipment_notes(serial_number);
  
CREATE INDEX IF NOT EXISTS idx_equipment_notes_created_at 
  ON equipment_notes(created_at DESC);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE equipment_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth needs)
CREATE POLICY "Allow all operations on equipment_notes" 
  ON equipment_notes 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Also allow for anon users for now (adjust based on your needs)
CREATE POLICY "Allow all operations on equipment_notes for anon" 
  ON equipment_notes 
  FOR ALL 
  TO anon 
  USING (true); 