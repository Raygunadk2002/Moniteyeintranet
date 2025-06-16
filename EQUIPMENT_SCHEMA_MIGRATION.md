# Equipment Schema Migration: Serial Number as Primary Key

## Overview

This migration updates the equipment management system to use `serial_number` as the primary key instead of the auto-generated UUID `id` field. This change makes the system more intuitive and aligns with real-world equipment tracking practices.

## Key Changes

### Database Schema Changes

1. **Primary Key Change**
   - **Before**: `id` (UUID) was the primary key
   - **After**: `serial_number` (text) is now the primary key and REQUIRED

2. **Equipment Table Structure**
   ```sql
   -- NEW SCHEMA
   CREATE TABLE equipment_inventory (
     serial_number text PRIMARY KEY NOT NULL,  -- Now the primary key
     equipment_id text UNIQUE,                 -- Optional user-defined ID
     name text NOT NULL,
     -- ... other fields remain the same
   );
   ```

3. **Related Tables Updated**
   - `equipment_maintenance` now references `serial_number`
   - `equipment_calibration` now references `serial_number`
   - `equipment_notes` now references `serial_number`
   - `equipment_location_history` now references `serial_number`

### API Changes

1. **Equipment Detail Routes**
   - **Before**: `/equipment/[id]` (UUID)
   - **After**: `/equipment/[serial_number]` (serial number)

2. **API Endpoints Updated**
   - `GET /api/equipment/[serial_number]` - Get equipment by serial number
   - `POST /api/equipment` - Create equipment (serial_number required)
   - `PUT /api/equipment` - Update equipment (serial_number required)
   - `DELETE /api/equipment?serial_number=...` - Delete by serial number

3. **Equipment Notes API**
   - Now uses `serial_number` as primary reference
   - Maintains backward compatibility with `equipment_id`

### Frontend Changes

1. **Equipment Form**
   - Serial number field is now first and required
   - Equipment ID field is optional
   - Form validation ensures serial number is provided

2. **Equipment Table**
   - Serial number column is now first
   - Equipment ID shown as separate optional column
   - Links use serial number for navigation

3. **Equipment Detail Page**
   - URL uses serial number: `/equipment/AQ2000-001`
   - All references updated to use serial number

## Migration Process

### Automatic Migration

1. **Run Migration**
   ```
   Visit: /migrate-equipment
   Click: "Run Migration"
   ```

2. **Migration Steps**
   - Backs up existing equipment data
   - Applies new database schema
   - Migrates data to new structure
   - Updates all foreign key references

3. **Data Handling**
   - Equipment WITH serial numbers: Migrated successfully
   - Equipment WITHOUT serial numbers: Skipped (logged)
   - All related data (notes, maintenance, etc.): Preserved

### Manual Database Migration

If you prefer to run the migration manually:

```sql
-- Execute the SQL file
\i equipment-schema-serial-pk.sql
```

## New Equipment Upload Requirements

### CSV Format Changes

1. **Serial Number Column**
   - **Required**: Must be present in CSV
   - **Unique**: Each serial number must be unique
   - **Format**: Text (e.g., "AQ2000-001", "WQ500-078")

2. **Equipment ID Column**
   - **Optional**: No longer required
   - **Auto-generated**: If not provided, will be generated as "EQ-{serial_number}"

### Example CSV Structure

```csv
Serial Number,Equipment ID,Name,Manufacturer,Model,Category,Location
AQ2000-001,MON-001,Air Quality Monitor Alpha,AirTech,AQ-Pro 2000,air-quality,office
WQ500-078,MON-002,Water Quality Sensor,AquaMonitor,WQ-500,water-quality,field
```

## Benefits of This Change

1. **Real-world Alignment**
   - Serial numbers are the actual unique identifiers on physical equipment
   - Matches how equipment is tracked in the field

2. **Improved User Experience**
   - URLs are more meaningful: `/equipment/AQ2000-001` vs `/equipment/uuid`
   - Easier to reference equipment in communications

3. **Data Integrity**
   - Enforces that all equipment must have serial numbers
   - Prevents duplicate serial numbers

4. **Better Integration**
   - Easier to integrate with external systems
   - Matches manufacturer tracking systems

## Backward Compatibility

- Equipment ID field is preserved for existing workflows
- Notes API accepts both serial_number and equipment_id parameters
- Migration preserves all existing data and relationships

## Troubleshooting

### Common Issues

1. **Equipment without Serial Numbers**
   - These will be skipped during migration
   - Add serial numbers manually before migration
   - Or create new records with serial numbers

2. **Duplicate Serial Numbers**
   - Migration will fail if duplicates exist
   - Clean up duplicates before running migration

3. **CSV Upload Errors**
   - Ensure Serial Number column is present
   - Check for empty serial number cells
   - Verify serial numbers are unique

### Support

If you encounter issues:
1. Check the migration logs in browser console
2. Verify all equipment has serial numbers before migration
3. Contact system administrator for database-level issues

## Testing the New System

After migration:

1. **Verify Equipment List**
   - Check that all equipment appears correctly
   - Verify serial numbers are displayed prominently

2. **Test Equipment Detail Pages**
   - Navigate using serial number URLs
   - Verify all information is preserved

3. **Test Equipment Upload**
   - Upload CSV with serial numbers as primary column
   - Verify new equipment is created correctly

4. **Test Notes and History**
   - Add notes to equipment
   - Verify location history is preserved 