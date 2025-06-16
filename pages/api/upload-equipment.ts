import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface EquipmentRecord {
  equipment_id: string;
  name: string;
  category_id: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: Date;
  purchase_cost?: number;
  warranty_expiry?: Date;
  location_id: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost';
  condition_rating?: number;
  last_calibration_date?: Date;
  next_calibration_due?: Date;
  calibration_frequency_months?: number;
  notes?: string;
  specifications?: any;
}

interface DetectionResult {
  success: boolean;
  equipmentIdColumn?: number;
  nameColumn?: number;
  categoryColumn?: number;
  locationColumn?: number;
  startRow?: number;
  headers?: string[];
  error?: string;
  suggestions?: string[];
  detectedFormat?: string;
}

// Helper function to detect equipment ID columns
function isEquipmentIdColumn(columnData: any[]): boolean {
  let validCount = 0;
  const sampleSize = Math.min(10, columnData.length);
  
  for (let i = 0; i < sampleSize; i++) {
    const value = columnData[i]?.toString().trim();
    if (value && (
      value.match(/^[A-Z]{2,4}-\d{3,6}$/i) || // MON-001, EQUIP-12345
      value.match(/^[A-Z]+\d+$/i) || // MON001, EQUIP12345
      value.match(/^\d{4,8}$/) // 12345678
    )) {
      validCount++;
    }
  }
  
  return validCount / sampleSize > 0.6; // More than 60% look like equipment IDs
}

// Helper function to detect name columns
function isNameColumn(columnData: any[]): boolean {
  let validCount = 0;
  const sampleSize = Math.min(10, columnData.length);
  
  for (let i = 0; i < sampleSize; i++) {
    const value = columnData[i]?.toString().trim();
    if (value && value.length > 3 && value.length < 100) {
      validCount++;
    }
  }
  
  return validCount / sampleSize > 0.8; // More than 80% are valid names
}

// Helper function to detect category columns
function isCategoryColumn(columnData: any[]): boolean {
  const commonCategories = [
    'air quality', 'water quality', 'noise', 'vibration', 'weather', 
    'dust', 'gas', 'radiation', 'monitor', 'sensor', 'detector'
  ];
  
  let validCount = 0;
  const sampleSize = Math.min(10, columnData.length);
  
  for (let i = 0; i < sampleSize; i++) {
    const value = columnData[i]?.toString().toLowerCase().trim();
    if (value && commonCategories.some(cat => value.includes(cat))) {
      validCount++;
    }
  }
  
  return validCount / sampleSize > 0.4; // More than 40% match common categories
}

// Helper function to detect location columns
function isLocationColumn(columnData: any[]): boolean {
  let validCount = 0;
  const sampleSize = Math.min(10, columnData.length);
  
  for (let i = 0; i < sampleSize; i++) {
    const value = columnData[i]?.toString().trim();
    if (value && value.length > 2 && value.length < 50) {
      validCount++;
    }
  }
  
  return validCount / sampleSize > 0.7; // More than 70% are valid locations
}

// Header detection functions
function isEquipmentIdHeader(header: string): boolean {
  const headerLower = header.toLowerCase();
  const keywords = [
    'equipment id', 'equipment_id', 'equipmentid', 'equip id', 'equip_id',
    'asset id', 'asset_id', 'assetid', 'id', 'identifier'
  ];
  return keywords.some(keyword => headerLower.includes(keyword));
}

function isNameHeader(header: string): boolean {
  const headerLower = header.toLowerCase();
  const keywords = [
    'name', 'equipment name', 'equipment_name', 'equipmentname',
    'title', 'description', 'device name', 'device_name'
  ];
  return keywords.some(keyword => headerLower.includes(keyword));
}

function isCategoryHeader(header: string): boolean {
  const headerLower = header.toLowerCase();
  const keywords = [
    'category', 'type', 'equipment type', 'equipment_type', 'equipmenttype',
    'class', 'classification', 'kind'
  ];
  return keywords.some(keyword => headerLower.includes(keyword));
}

function isLocationHeader(header: string): boolean {
  const headerLower = header.toLowerCase();
  const keywords = [
    'location', 'site', 'address', 'place', 'position',
    'deployment', 'installation', 'facility'
  ];
  return keywords.some(keyword => headerLower.includes(keyword));
}

// Parse date function
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try different formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (format === formats[0]) { // YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else { // DD/MM/YYYY or DD-MM-YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }
  
  return null;
}

// Main auto-detection function
function autoDetectFileStructure(jsonDataWithHeaders: any[], jsonDataRaw: any[]): DetectionResult {
  if (!jsonDataRaw || jsonDataRaw.length < 2) {
    return {
      success: false,
      error: 'File appears to be empty or has insufficient data',
      suggestions: ['Ensure your Excel file has at least 2 rows of data (header + data row)']
    };
  }

  let equipmentIdColumn = -1;
  let nameColumn = -1;
  let categoryColumn = -1;
  let locationColumn = -1;
  let startRow = 1;
  let headers: string[] = [];

  // First approach: Try to use headers if they exist
  if (jsonDataWithHeaders.length > 0) {
    const firstObject = jsonDataWithHeaders[0];
    headers = Object.keys(firstObject);
    
    console.log('Available headers:', headers);
    
    // Look for columns by header name
    for (let i = 0; i < headers.length; i++) {
      if (equipmentIdColumn === -1 && isEquipmentIdHeader(headers[i])) {
        equipmentIdColumn = i;
      }
      if (nameColumn === -1 && isNameHeader(headers[i])) {
        nameColumn = i;
      }
      if (categoryColumn === -1 && isCategoryHeader(headers[i])) {
        categoryColumn = i;
      }
      if (locationColumn === -1 && isLocationHeader(headers[i])) {
        locationColumn = i;
      }
    }
  }

  // Second approach: Analyze data content if headers didn't work
  if (equipmentIdColumn === -1 || nameColumn === -1) {
    const maxColumns = Math.max(...jsonDataRaw.map(row => (row as any[]).length));
    
    for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
      const columnData = jsonDataRaw.slice(1).map(row => (row as any[])[colIndex]).filter(cell => cell != null);
      
      if (columnData.length === 0) continue;
      
      if (equipmentIdColumn === -1 && isEquipmentIdColumn(columnData)) {
        equipmentIdColumn = colIndex;
      }
      if (nameColumn === -1 && colIndex !== equipmentIdColumn && isNameColumn(columnData)) {
        nameColumn = colIndex;
      }
      if (categoryColumn === -1 && isCategoryColumn(columnData)) {
        categoryColumn = colIndex;
      }
      if (locationColumn === -1 && isLocationColumn(columnData)) {
        locationColumn = colIndex;
      }
    }
  }

  // Validation
  if (equipmentIdColumn === -1) {
    return {
      success: false,
      error: 'Could not detect equipment ID column',
      suggestions: [
        'Ensure you have a column with equipment IDs (e.g., MON-001, EQUIP-12345)',
        'Try using headers like "Equipment ID", "Asset ID", or "ID"',
        'Equipment IDs should follow a consistent format'
      ]
    };
  }

  if (nameColumn === -1) {
    return {
      success: false,
      error: 'Could not detect equipment name column',
      suggestions: [
        'Ensure you have a column with equipment names/descriptions',
        'Try using headers like "Name", "Equipment Name", or "Description"',
        'Names should be descriptive text (3-100 characters)'
      ]
    };
  }

  // Set defaults for optional columns if not detected
  if (categoryColumn === -1) categoryColumn = 0; // Will use default category
  if (locationColumn === -1) locationColumn = 0; // Will use default location

  let detectedFormat = `Detected equipment IDs in column ${String.fromCharCode(65 + equipmentIdColumn)}`;
  if (headers[equipmentIdColumn]) {
    detectedFormat += ` ("${headers[equipmentIdColumn]}")`;
  }
  detectedFormat += ` and names in column ${String.fromCharCode(65 + nameColumn)}`;
  if (headers[nameColumn]) {
    detectedFormat += ` ("${headers[nameColumn]}")`;
  }

  return {
    success: true,
    equipmentIdColumn,
    nameColumn,
    categoryColumn,
    locationColumn,
    startRow,
    headers,
    detectedFormat
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read and parse the Excel file
    const workbook = XLSX.readFile(file.filepath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with headers
    const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
    
    // Convert to JSON as raw arrays
    const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('Raw data sample:', jsonDataRaw.slice(0, 3));
    console.log('Header data sample:', jsonDataWithHeaders.slice(0, 2));

    // Auto-detect file structure
    const detectionResult = autoDetectFileStructure(jsonDataWithHeaders, jsonDataRaw);
    
    if (!detectionResult.success) {
      return res.status(400).json({
        error: detectionResult.error,
        suggestions: detectionResult.suggestions
      });
    }

    const { equipmentIdColumn, nameColumn, categoryColumn, locationColumn, startRow } = detectionResult;

    // Get available categories and locations for mapping
    const { data: categories } = await supabaseAdmin
      .from('equipment_categories')
      .select('id, name');

    const { data: locations } = await supabaseAdmin
      .from('equipment_locations')
      .select('id, name');

    // Process equipment records
    const equipmentRecords: EquipmentRecord[] = [];
    const errors: string[] = [];

    for (let i = startRow!; i < jsonDataRaw.length; i++) {
      const row = jsonDataRaw[i] as any[];
      if (row.length > Math.max(equipmentIdColumn!, nameColumn!)) {
        const equipmentId = row[equipmentIdColumn!]?.toString().trim();
        const name = row[nameColumn!]?.toString().trim();
        
        if (equipmentId && name) {
          // Map category
          let categoryId = 'air-quality'; // default
          if (categoryColumn !== undefined && row[categoryColumn]) {
            const categoryName = row[categoryColumn].toString().toLowerCase();
            const matchedCategory = categories?.find(cat => 
              cat.name.toLowerCase().includes(categoryName) || 
              categoryName.includes(cat.name.toLowerCase())
            );
            if (matchedCategory) {
              categoryId = matchedCategory.id;
            }
          }

          // Map location
          let locationId = 'office-main'; // default
          if (locationColumn !== undefined && row[locationColumn]) {
            const locationName = row[locationColumn].toString().toLowerCase();
            const matchedLocation = locations?.find(loc => 
              loc.name.toLowerCase().includes(locationName) || 
              locationName.includes(loc.name.toLowerCase())
            );
            if (matchedLocation) {
              locationId = matchedLocation.id;
            }
          }

          equipmentRecords.push({
            equipment_id: equipmentId,
            name: name,
            category_id: categoryId,
            location_id: locationId,
            status: 'active',
            manufacturer: row[4]?.toString().trim() || undefined,
            model: row[5]?.toString().trim() || undefined,
            serial_number: row[6]?.toString().trim() || undefined,
            purchase_date: row[7] ? parseDate(row[7].toString()) : undefined,
            purchase_cost: row[8] ? parseFloat(row[8]) : undefined,
            condition_rating: row[9] ? parseInt(row[9]) : undefined,
            notes: row[10]?.toString().trim() || undefined
          });
        }
      }
    }

    if (equipmentRecords.length === 0) {
      return res.status(400).json({
        error: 'No valid equipment data found after processing',
        detectedFormat: detectionResult.detectedFormat,
        suggestions: [
          'Verify that your equipment ID column contains valid IDs',
          'Verify that your name column contains equipment names',
          'Check for empty rows or cells in your data'
        ]
      });
    }

    // Create upload batch record
    const batchId = uuidv4();
    let successfulImports = 0;
    let failedImports = 0;

    // Insert equipment records
    for (const record of equipmentRecords) {
      try {
        const { error } = await supabaseAdmin
          .from('equipment_inventory')
          .insert(record);

        if (error) {
          console.error(`Error inserting equipment ${record.equipment_id}:`, error);
          failedImports++;
          errors.push(`${record.equipment_id}: ${error.message}`);
        } else {
          successfulImports++;
        }
      } catch (error) {
        console.error(`Error processing equipment ${record.equipment_id}:`, error);
        failedImports++;
        errors.push(`${record.equipment_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Save upload batch metadata
    await supabaseAdmin
      .from('equipment_upload_batches')
      .insert({
        id: batchId,
        filename: file.originalFilename || 'unknown',
        total_equipment: equipmentRecords.length,
        successful_imports: successfulImports,
        failed_imports: failedImports
      });

    // Clean up uploaded file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      message: 'Equipment data processed successfully!',
      recordsProcessed: equipmentRecords.length,
      successfulImports,
      failedImports,
      detectedFormat: detectionResult.detectedFormat,
      summary: `Processed ${equipmentRecords.length} equipment records. ${successfulImports} successful, ${failedImports} failed.`,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit error messages
    });

  } catch (error) {
    console.error('Equipment upload error:', error);
    return res.status(500).json({
      error: 'Failed to process equipment file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 