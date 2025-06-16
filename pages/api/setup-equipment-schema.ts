import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Setting up equipment database schema...');

    // Try to insert default categories - this will fail if tables don't exist
    const { error: categoriesError } = await supabaseAdmin
      .from('equipment_categories')
      .upsert([
        { id: 'air-quality', name: 'Air Quality Monitors', description: 'Equipment for monitoring air pollution and quality', icon: '🌬️' },
        { id: 'water-quality', name: 'Water Quality Monitors', description: 'Equipment for monitoring water pollution and quality', icon: '💧' },
        { id: 'noise', name: 'Noise Monitors', description: 'Equipment for monitoring noise pollution levels', icon: '🔊' },
        { id: 'vibration', name: 'Vibration Monitors', description: 'Equipment for monitoring structural vibrations', icon: '📳' },
        { id: 'weather', name: 'Weather Stations', description: 'Equipment for monitoring weather conditions', icon: '🌤️' },
        { id: 'dust', name: 'Dust Monitors', description: 'Equipment for monitoring particulate matter', icon: '💨' },
        { id: 'gas', name: 'Gas Detectors', description: 'Equipment for detecting specific gases', icon: '⚗️' },
        { id: 'radiation', name: 'Radiation Monitors', description: 'Equipment for monitoring radiation levels', icon: '☢️' }
      ], { onConflict: 'id' });

    if (categoriesError) {
      console.error('Categories error:', categoriesError);
      return res.status(500).json({
        success: false,
        error: 'Equipment tables do not exist. Please run the database schema setup first.',
        details: categoriesError.message,
        instructions: [
          '1. Go to your Supabase Dashboard SQL Editor',
          '2. Copy and paste the equipment schema from database-schema.sql',
          '3. Run the SQL to create the equipment tables',
          '4. Return here and try again'
        ]
      });
    }

    // Insert default locations
    const { error: locationsError } = await supabaseAdmin
      .from('equipment_locations')
      .upsert([
        { id: 'office-main', name: 'Main Office', address: 'Moniteye Head Office', notes: 'Primary office location' },
        { id: 'warehouse', name: 'Equipment Warehouse', address: 'Storage facility', notes: 'Equipment storage and preparation' },
        { id: 'field-temp', name: 'Temporary Field Location', address: 'Various field locations', notes: 'For equipment deployed temporarily' }
      ], { onConflict: 'id' });

    if (locationsError) {
      console.error('Locations error:', locationsError);
    }

    console.log('Equipment database schema setup completed');

    return res.status(200).json({
      success: true,
      message: 'Equipment database schema setup completed successfully!',
      categoriesInserted: !categoriesError,
      locationsInserted: !locationsError,
      summary: 'Equipment tables are ready and default categories and locations have been inserted.'
    });

  } catch (error) {
    console.error('Equipment schema setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to setup equipment database schema',
      details: error instanceof Error ? error.message : 'Unknown error',
      note: 'The equipment tables may need to be created manually in Supabase Dashboard using the SQL from database-schema.sql'
    });
  }
} 