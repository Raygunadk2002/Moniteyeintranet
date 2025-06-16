import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

interface Equipment {
  serial_number: string; // Primary key
  equipment_id: string | null; // Optional user-defined ID
  name: string;
  manufacturer: string | null;
  model: string | null;
  warranty_expiry: string | null; // End date/off hire date
  next_calibration_due: string | null; // Calibration due date
  last_calibration_date: string | null;
  calibration_frequency_months: number | null;
  status: string;
  category?: { id: string; name: string; icon: string };
  location?: { id: string; name: string };
  current_location?: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch equipment with categories and locations
      const { data: equipment, error } = await supabaseAdmin
        .from('equipment_inventory')
        .select(`
          *,
          category:equipment_categories(id, name, description, icon),
          location:equipment_locations(id, name, address)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Equipment fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch equipment' });
      }

      // Fetch categories and locations separately for filters
      const { data: categories } = await supabaseAdmin
        .from('equipment_categories')
        .select('*')
        .order('name');

      const { data: locations } = await supabaseAdmin
        .from('equipment_locations')
        .select('*')
        .order('name');

      // Get location history for all equipment to determine current locations
      const { data: locationHistory } = await supabaseAdmin
        .from('equipment_location_history')
        .select('*')
        .order('moved_at', { ascending: false });

      // Create location lookup map
      const locationLookup = new Map();
      if (locations) {
        locations.forEach(loc => {
          locationLookup.set(loc.id, loc.name);
        });
      }

      // Create a map of equipment to their most recent location
      const locationMap = new Map();
      if (locationHistory) {
        locationHistory.forEach(history => {
          if (!locationMap.has(history.serial_number)) {
            // Format as "ID - Name"
            const locationName = locationLookup.get(history.location_id) || history.location_name;
            locationMap.set(history.serial_number, `${history.location_id} - ${locationName}`);
          }
        });
      }

      // Add current location info to equipment
      const equipmentWithLocations = equipment?.map(item => ({
        ...item,
        current_location: locationMap.get(item.serial_number) || null
      })) || [];

      return res.status(200).json({
        equipment: equipmentWithLocations,
        categories: categories || [],
        locations: locations || []
      });
    } catch (error) {
      console.error('Equipment API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const equipmentData = req.body;
      
      // Validate required fields
      if (!equipmentData.serial_number || !equipmentData.name) {
        return res.status(400).json({ 
          error: 'Serial number and name are required' 
        });
      }

      // Check if equipment with this serial number already exists
      const { data: existingEquipment } = await supabaseAdmin
        .from('equipment_inventory')
        .select('serial_number')
        .eq('serial_number', equipmentData.serial_number)
        .single();

      if (existingEquipment) {
        return res.status(400).json({ 
          error: 'Equipment with this serial number already exists' 
        });
      }

      const { data, error } = await supabaseAdmin
        .from('equipment_inventory')
        .insert([equipmentData])
        .select()
        .single();

      if (error) {
        console.error('Equipment creation error:', error);
        return res.status(500).json({ error: 'Failed to create equipment' });
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error('Equipment creation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const equipmentData = req.body;
      
      if (!equipmentData.serial_number) {
        return res.status(400).json({ error: 'Serial number is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('equipment_inventory')
        .update(equipmentData)
        .eq('serial_number', equipmentData.serial_number)
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
      const { serial_number } = req.query;
      
      if (!serial_number) {
        return res.status(400).json({ error: 'Serial number is required' });
      }

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