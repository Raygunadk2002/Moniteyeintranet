import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { serial_number } = req.query;

  if (!serial_number || typeof serial_number !== 'string') {
    return res.status(400).json({ error: 'Serial number is required' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch equipment details with related data
      const { data: equipment, error } = await supabaseAdmin
        .from('equipment_inventory')
        .select(`
          *,
          category:equipment_categories(id, name, description, icon),
          location:equipment_locations(id, name, address)
        `)
        .eq('serial_number', serial_number)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Equipment not found' });
        }
        console.error('Equipment fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch equipment' });
      }

      // Get location history for this equipment
      const { data: locationHistory } = await supabaseAdmin
        .from('equipment_location_history')
        .select('*')
        .eq('serial_number', serial_number)
        .order('moved_at', { ascending: false });

      // Get maintenance records
      const { data: maintenanceRecords } = await supabaseAdmin
        .from('equipment_maintenance')
        .select('*')
        .eq('serial_number', serial_number)
        .order('performed_date', { ascending: false });

      // Get calibration records
      const { data: calibrationRecords } = await supabaseAdmin
        .from('equipment_calibration')
        .select('*')
        .eq('serial_number', serial_number)
        .order('calibration_date', { ascending: false });

      // Determine current location from history
      let current_location = null;
      let current_location_id = null;
      let last_moved = null;

      if (locationHistory && locationHistory.length > 0) {
        const mostRecent = locationHistory[0];
        current_location = `${mostRecent.location_id} - ${mostRecent.location_name}`;
        current_location_id = mostRecent.location_id;
        last_moved = mostRecent.moved_at;
      }

      return res.status(200).json({
        ...equipment,
        current_location,
        current_location_id,
        last_moved,
        location_history: locationHistory || [],
        maintenance_records: maintenanceRecords || [],
        calibration_records: calibrationRecords || []
      });
    } catch (error) {
      console.error('Equipment detail API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const equipmentData = req.body;

      const { data, error } = await supabaseAdmin
        .from('equipment_inventory')
        .update(equipmentData)
        .eq('serial_number', serial_number)
        .select()
        .single();

      if (error) {
        console.error('Equipment update error:', error);
        return res.status(500).json({ error: 'Failed to update equipment' });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Equipment update error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('equipment_inventory')
        .delete()
        .eq('serial_number', serial_number);

      if (error) {
        console.error('Equipment deletion error:', error);
        return res.status(500).json({ error: 'Failed to delete equipment' });
      }

      return res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) {
      console.error('Equipment deletion error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 