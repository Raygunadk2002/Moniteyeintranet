import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Setting up equipment database...');

    // Check if tables exist and have data
    const { data: existingEquipment, error: equipmentError } = await supabaseAdmin
      .from('equipment_inventory')
      .select('id')
      .limit(1);

    if (equipmentError) {
      console.error('Equipment table error:', equipmentError);
      return res.status(500).json({
        success: false,
        error: 'Equipment tables not found. Please run the database schema setup first.',
        details: equipmentError.message
      });
    }

    if (existingEquipment && existingEquipment.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Equipment database already has data',
        equipmentCount: existingEquipment.length
      });
    }

    // Insert sample equipment data
    const sampleEquipment = [
      {
        equipment_id: 'MON-001',
        name: 'Air Quality Monitor Station Alpha',
        category_id: 'air-quality',
        manufacturer: 'AirTech Solutions',
        model: 'AQ-Pro 2000',
        serial_number: 'AT2000-001',
        purchase_date: '2023-01-15',
        purchase_cost: 2500.00,
        warranty_expiry: '2026-01-15',
        location_id: 'office-main',
        status: 'active',
        condition_rating: 5,
        last_calibration_date: '2024-01-15',
        next_calibration_due: '2025-01-15',
        calibration_frequency_months: 12,
        notes: 'Primary air quality monitoring station for main office area'
      },
      {
        equipment_id: 'MON-002',
        name: 'Noise Level Monitor',
        category_id: 'noise',
        manufacturer: 'SoundTech',
        model: 'NT-500',
        serial_number: 'ST500-045',
        purchase_date: '2023-03-20',
        purchase_cost: 1800.00,
        location_id: 'field-temp',
        status: 'active',
        condition_rating: 4,
        last_calibration_date: '2024-03-20',
        next_calibration_due: '2025-03-20',
        calibration_frequency_months: 12,
        notes: 'Deployed for construction site noise monitoring'
      },
      {
        equipment_id: 'MON-003',
        name: 'Water Quality Sensor Array',
        category_id: 'water-quality',
        manufacturer: 'HydroSense',
        model: 'WQ-Multi 300',
        serial_number: 'HS300-078',
        purchase_date: '2023-05-10',
        purchase_cost: 3200.00,
        location_id: 'field-temp',
        status: 'active',
        condition_rating: 5,
        last_calibration_date: '2024-05-10',
        next_calibration_due: '2025-05-10',
        calibration_frequency_months: 6,
        notes: 'Multi-parameter water quality monitoring for river assessment'
      },
      {
        equipment_id: 'MON-004',
        name: 'Vibration Monitor',
        category_id: 'vibration',
        manufacturer: 'VibroTech',
        model: 'VT-1000',
        serial_number: 'VT1000-023',
        purchase_date: '2023-07-05',
        purchase_cost: 2100.00,
        location_id: 'field-temp',
        status: 'maintenance',
        condition_rating: 3,
        last_calibration_date: '2024-01-05',
        next_calibration_due: '2025-01-05',
        calibration_frequency_months: 12,
        notes: 'Currently in maintenance - sensor calibration required'
      },
      {
        equipment_id: 'MON-005',
        name: 'Weather Station Pro',
        category_id: 'weather',
        manufacturer: 'WeatherMax',
        model: 'WM-Pro 500',
        serial_number: 'WMP500-012',
        purchase_date: '2023-09-15',
        purchase_cost: 4500.00,
        location_id: 'office-main',
        status: 'active',
        condition_rating: 5,
        last_calibration_date: '2024-09-15',
        next_calibration_due: '2025-09-15',
        calibration_frequency_months: 12,
        notes: 'Comprehensive weather monitoring station with wind, rain, temperature, humidity sensors'
      },
      {
        equipment_id: 'MON-006',
        name: 'Dust Particle Counter',
        category_id: 'dust',
        manufacturer: 'DustSense',
        model: 'DS-Counter 200',
        serial_number: 'DSC200-089',
        purchase_date: '2023-11-20',
        purchase_cost: 1900.00,
        location_id: 'warehouse',
        status: 'active',
        condition_rating: 4,
        last_calibration_date: '2024-05-20',
        next_calibration_due: '2024-11-20',
        calibration_frequency_months: 6,
        notes: 'Portable dust monitoring for construction and industrial sites'
      },
      {
        equipment_id: 'MON-007',
        name: 'Gas Detection Array',
        category_id: 'gas',
        manufacturer: 'GasTech Pro',
        model: 'GT-Multi 400',
        serial_number: 'GTP400-156',
        purchase_date: '2024-01-10',
        purchase_cost: 2800.00,
        location_id: 'warehouse',
        status: 'active',
        condition_rating: 5,
        last_calibration_date: '2024-07-10',
        next_calibration_due: '2025-01-10',
        calibration_frequency_months: 6,
        notes: 'Multi-gas detector for CO, CO2, H2S, and VOCs'
      },
      {
        equipment_id: 'MON-008',
        name: 'Radiation Monitor',
        category_id: 'radiation',
        manufacturer: 'RadSafe',
        model: 'RS-Monitor 100',
        serial_number: 'RSM100-034',
        purchase_date: '2024-02-28',
        purchase_cost: 5200.00,
        location_id: 'warehouse',
        status: 'retired',
        condition_rating: 2,
        last_calibration_date: '2024-02-28',
        next_calibration_due: '2025-02-28',
        calibration_frequency_months: 12,
        notes: 'Retired due to sensor degradation - replacement ordered'
      },
      {
        equipment_id: 'MON-009',
        name: 'Air Quality Monitor Station Beta',
        category_id: 'air-quality',
        manufacturer: 'AirTech Solutions',
        model: 'AQ-Pro 2000',
        serial_number: 'AT2000-002',
        purchase_date: '2024-03-15',
        purchase_cost: 2500.00,
        warranty_expiry: '2027-03-15',
        location_id: 'field-temp',
        status: 'active',
        condition_rating: 5,
        last_calibration_date: '2024-09-15',
        next_calibration_due: '2025-03-15',
        calibration_frequency_months: 6,
        notes: 'Secondary air quality monitoring station for field deployment'
      }
    ];

    // Insert equipment records
    const { data: insertedEquipment, error: insertError } = await supabaseAdmin
      .from('equipment_inventory')
      .insert(sampleEquipment)
      .select();

    if (insertError) {
      console.error('Error inserting equipment:', insertError);
      throw new Error(`Failed to insert equipment: ${insertError.message}`);
    }

    // Insert some sample maintenance records
    const sampleMaintenance = [
      {
        equipment_id: insertedEquipment![3].id, // MON-004 (in maintenance)
        maintenance_type: 'repair',
        performed_by: 'Tech Support Team',
        performed_date: '2024-12-01',
        description: 'Sensor calibration and housing inspection',
        cost: 150.00,
        next_maintenance_due: '2025-06-01',
        status: 'completed'
      },
      {
        equipment_id: insertedEquipment![0].id, // MON-001
        maintenance_type: 'routine',
        performed_by: 'Maintenance Team',
        performed_date: '2024-11-15',
        description: 'Quarterly maintenance check and cleaning',
        cost: 75.00,
        next_maintenance_due: '2025-02-15',
        status: 'completed'
      }
    ];

    const { error: maintenanceError } = await supabaseAdmin
      .from('equipment_maintenance')
      .insert(sampleMaintenance);

    if (maintenanceError) {
      console.warn('Warning: Could not insert maintenance records:', maintenanceError);
    }

    // Insert some sample calibration records
    const sampleCalibrations = [
      {
        equipment_id: insertedEquipment![0].id, // MON-001
        calibration_date: '2024-01-15',
        calibrated_by: 'Calibration Services Ltd',
        calibration_standard: 'ISO 17025',
        results: { accuracy: '±2%', drift: '0.1%/month' },
        passed: true,
        certificate_number: 'CAL-2024-001',
        next_calibration_due: '2025-01-15',
        notes: 'All parameters within specification'
      },
      {
        equipment_id: insertedEquipment![2].id, // MON-003
        calibration_date: '2024-05-10',
        calibrated_by: 'HydroSense Calibration',
        calibration_standard: 'NIST Traceable',
        results: { ph_accuracy: '±0.1', conductivity_accuracy: '±1%' },
        passed: true,
        certificate_number: 'CAL-2024-003',
        next_calibration_due: '2025-05-10',
        notes: 'Multi-parameter calibration completed successfully'
      }
    ];

    const { error: calibrationError } = await supabaseAdmin
      .from('equipment_calibration')
      .insert(sampleCalibrations);

    if (calibrationError) {
      console.warn('Warning: Could not insert calibration records:', calibrationError);
    }

    console.log('Equipment database setup completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Equipment database setup completed successfully!',
      equipmentCreated: insertedEquipment?.length || 0,
      maintenanceRecords: sampleMaintenance.length,
      calibrationRecords: sampleCalibrations.length,
      summary: `Created ${insertedEquipment?.length || 0} equipment records with sample maintenance and calibration data.`
    });

  } catch (error) {
    console.error('Equipment database setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to setup equipment database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 