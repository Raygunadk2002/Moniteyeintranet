import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

interface Equipment {
  id: string;
  equipment_id: string;
  name: string;
  category_id: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  warranty_expiry?: string;
  location_id: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost';
  condition_rating?: number;
  last_calibration_date?: string;
  next_calibration_due?: string;
  calibration_frequency_months?: number;
  notes?: string;
  specifications?: any;
  created_at: string;
  updated_at: string;
}

interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
}

interface EquipmentLocation {
  id: string;
  name: string;
  address?: string;
  coordinates?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Equipment API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch equipment with category and location details
    const { data: equipment, error: equipmentError } = await supabaseAdmin
      .from('equipment_inventory')
      .select(`
        *,
        category:equipment_categories(id, name, description, icon),
        location:equipment_locations(id, name, address)
      `)
      .order('created_at', { ascending: false });

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      throw new Error(`Failed to fetch equipment: ${equipmentError.message}`);
    }

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('equipment_categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Fetch locations
    const { data: locations, error: locationsError } = await supabaseAdmin
      .from('equipment_locations')
      .select('*')
      .order('name');

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      throw new Error(`Failed to fetch locations: ${locationsError.message}`);
    }

    // Calculate summary statistics
    const totalEquipment = equipment?.length || 0;
    const activeEquipment = equipment?.filter(e => e.status === 'active').length || 0;
    const maintenanceEquipment = equipment?.filter(e => e.status === 'maintenance').length || 0;
    const retiredEquipment = equipment?.filter(e => e.status === 'retired').length || 0;

    // Calculate calibration due soon (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const calibrationDueSoon = equipment?.filter(e => {
      if (!e.next_calibration_due) return false;
      const dueDate = new Date(e.next_calibration_due);
      return dueDate <= thirtyDaysFromNow && dueDate >= today;
    }).length || 0;

    // Calculate overdue calibrations
    const overdueCalibrations = equipment?.filter(e => {
      if (!e.next_calibration_due) return false;
      const dueDate = new Date(e.next_calibration_due);
      return dueDate < today;
    }).length || 0;

    // Group by category
    const categoryStats = categories?.map(category => ({
      ...category,
      count: equipment?.filter(e => e.category_id === category.id).length || 0
    })) || [];

    // Group by location
    const locationStats = locations?.map(location => ({
      ...location,
      count: equipment?.filter(e => e.location_id === location.id).length || 0
    })) || [];

    return res.status(200).json({
      equipment: equipment || [],
      categories: categories || [],
      locations: locations || [],
      summary: {
        total: totalEquipment,
        active: activeEquipment,
        maintenance: maintenanceEquipment,
        retired: retiredEquipment,
        calibrationDueSoon,
        overdueCalibrations
      },
      categoryStats,
      locationStats
    });

  } catch (error) {
    console.error('Error in handleGet:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch equipment data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      equipment_id,
      name,
      category_id,
      manufacturer,
      model,
      serial_number,
      purchase_date,
      purchase_cost,
      warranty_expiry,
      location_id,
      status = 'active',
      condition_rating,
      last_calibration_date,
      next_calibration_due,
      calibration_frequency_months = 12,
      notes,
      specifications
    } = req.body;

    // Validate required fields
    if (!equipment_id || !name || !category_id || !location_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: equipment_id, name, category_id, location_id' 
      });
    }

    // Check if equipment_id already exists
    const { data: existingEquipment } = await supabaseAdmin
      .from('equipment_inventory')
      .select('equipment_id')
      .eq('equipment_id', equipment_id)
      .single();

    if (existingEquipment) {
      return res.status(400).json({ 
        error: `Equipment ID '${equipment_id}' already exists. Please use a unique ID.` 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('equipment_inventory')
      .insert({
        equipment_id,
        name,
        category_id,
        manufacturer,
        model,
        serial_number,
        purchase_date,
        purchase_cost,
        warranty_expiry,
        location_id,
        status,
        condition_rating,
        last_calibration_date,
        next_calibration_due,
        calibration_frequency_months,
        notes,
        specifications
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating equipment:', error);
      throw new Error(`Failed to create equipment: ${error.message}`);
    }

    return res.status(201).json(data);

  } catch (error) {
    console.error('Error in handlePost:', error);
    return res.status(500).json({ 
      error: 'Failed to create equipment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Equipment ID is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('equipment_inventory')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating equipment:', error);
      throw new Error(`Failed to update equipment: ${error.message}`);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in handlePut:', error);
    return res.status(500).json({ 
      error: 'Failed to update equipment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Equipment ID is required' });
    }

    const { error } = await supabaseAdmin
      .from('equipment_inventory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting equipment:', error);
      throw new Error(`Failed to delete equipment: ${error.message}`);
    }

    return res.status(200).json({ message: 'Equipment deleted successfully' });

  } catch (error) {
    console.error('Error in handleDelete:', error);
    return res.status(500).json({ 
      error: 'Failed to delete equipment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 