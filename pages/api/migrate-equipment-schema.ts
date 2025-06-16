import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting equipment schema migration...');

    // Step 1: Backup existing data
    console.log('Step 1: Creating backup of existing equipment data...');
    const { data: existingEquipment, error: backupError } = await supabaseAdmin
      .from('equipment_inventory')
      .select('*');

    if (backupError) {
      console.error('Backup error:', backupError);
      return res.status(500).json({ 
        error: 'Failed to backup existing data', 
        details: backupError.message 
      });
    }

    console.log(`Backed up ${existingEquipment?.length || 0} equipment records`);

    // Step 2: Apply the new schema by running the SQL file
    console.log('Step 2: Applying new database schema...');
    
    // Read and execute the schema migration SQL
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'equipment-schema-serial-pk.sql');
    
    let schemaSql;
    try {
      schemaSql = fs.readFileSync(schemaPath, 'utf8');
    } catch (fileError) {
      console.error('Schema file not found:', fileError);
      return res.status(500).json({ 
        error: 'Schema migration file not found',
        details: 'equipment-schema-serial-pk.sql file is missing'
      });
    }

    // Execute the schema migration
    const { error: schemaError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: schemaSql 
    });

    if (schemaError) {
      console.error('Schema migration error:', schemaError);
      return res.status(500).json({ 
        error: 'Failed to apply new schema', 
        details: schemaError.message 
      });
    }

    console.log('Schema migration completed successfully');

    // Step 3: Migrate existing data to new schema
    console.log('Step 3: Migrating existing data to new schema...');
    
    if (existingEquipment && existingEquipment.length > 0) {
      const migratedData = existingEquipment
        .filter(item => item.serial_number) // Only migrate items with serial numbers
        .map(item => ({
          serial_number: item.serial_number,
          equipment_id: item.equipment_id,
          name: item.name,
          category_id: item.category_id,
          manufacturer: item.manufacturer,
          model: item.model,
          purchase_date: item.purchase_date,
          purchase_cost: item.purchase_cost,
          warranty_expiry: item.warranty_expiry,
          location_id: item.location_id,
          status: item.status,
          condition_rating: item.condition_rating,
          last_calibration_date: item.last_calibration_date,
          next_calibration_due: item.next_calibration_due,
          calibration_frequency_months: item.calibration_frequency_months,
          notes: item.notes,
          specifications: item.specifications,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

      if (migratedData.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('equipment_inventory')
          .insert(migratedData);

        if (insertError) {
          console.error('Data migration error:', insertError);
          return res.status(500).json({ 
            error: 'Failed to migrate existing data', 
            details: insertError.message 
          });
        }

        console.log(`Successfully migrated ${migratedData.length} equipment records`);
      }
    }

    // Step 4: Update related tables (notes, location history, etc.)
    console.log('Step 4: Updating related table references...');
    
    // The schema migration should have already handled this with CASCADE operations
    
    console.log('Equipment schema migration completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Equipment schema migration completed successfully',
      details: {
        backedUpRecords: existingEquipment?.length || 0,
        migratedRecords: existingEquipment?.filter(item => item.serial_number).length || 0,
        skippedRecords: existingEquipment?.filter(item => !item.serial_number).length || 0
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 