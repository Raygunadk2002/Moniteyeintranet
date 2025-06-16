import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import * as XLSX from 'xlsx';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface EquipmentRecord {
  serial_number: string;
  equipment_id?: string;
  name: string;
  category_id: string;
  manufacturer?: string;
  model?: string;
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
  manufacturerColumn?: number;
  modelColumn?: number;
  serialNumberColumn?: number;
  purchaseDateColumn?: number;
  purchaseCostColumn?: number;
  conditionRatingColumn?: number;
  notesColumn?: number;
  statusColumn?: number;
  ownershipColumn?: number;
  endDateColumn?: number;
  calibrationDueColumn?: number;
  startRow?: number;
  headers?: string[];
  error?: string;
  suggestions?: string[];
  detectedFormat?: string;
}

// Improved date parsing with timezone handling and Excel serial number support
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const cleanDateString = dateString.toString().trim();
  if (!cleanDateString || cleanDateString === '???' || cleanDateString === 'N/A' || cleanDateString === '' || cleanDateString === 'TBC') return null;
  
  // Check if it's an Excel serial number (numeric value that could represent a date)
  // Only consider it if it's a pure number without any text/dashes/spaces
  const serialNumber = parseFloat(cleanDateString);
  if (!isNaN(serialNumber) && 
      Number.isInteger(serialNumber) && 
      cleanDateString === serialNumber.toString() && // Must be pure number, no text
      serialNumber >= 40000 && serialNumber <= 50000) { // Reasonable range for 2009-2037
    
    // Convert Excel serial number to date
    // Excel's epoch is January 1, 1900, but there's a leap year bug
    const excelEpoch = new Date(1900, 0, 1);
    const daysOffset = serialNumber - 2; // -2 to account for Excel's leap year bug and 0-indexing
    const resultDate = new Date(excelEpoch.getTime() + (daysOffset * 24 * 60 * 60 * 1000));
    
    // Only return if the result is a reasonable date (between 2020 and 2030)
    if (resultDate.getFullYear() >= 2020 && resultDate.getFullYear() <= 2030) {
      console.log(`Converted Excel serial ${serialNumber} to date: ${resultDate}`);
      return resultDate;
    }
  }
  
  // Try parsing as ISO date first
  const isoDate = new Date(cleanDateString);
  if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() > 1900 && isoDate.getFullYear() < 2100) {
    return isoDate;
  }
  
  // Try different formats with explicit parsing to avoid timezone issues
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
  ];
  
  for (let i = 0; i < formats.length; i++) {
    const format = formats[i];
    const match = cleanDateString.match(format);
    if (match) {
      let year, month, day;
      
      if (i === 2) { // YYYY-MM-DD
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else { // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
        // Assume DD/MM/YYYY format for UK dates
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]);
      }
      
      // Validate the date components
      if (year >= 1900 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        // Create date at noon UTC to avoid timezone issues
        const parsedDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
        if (parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month && parsedDate.getUTCDate() === day) {
          return parsedDate;
        }
      }
    }
  }
  
  return null;
}

// Column detection functions
function isEquipmentIdColumn(columnData: any[]): boolean {
  const validIds = columnData.filter(cell => {
    if (!cell) return false;
    const str = cell.toString().trim();
    return /^[A-Z]{2,4}-\d{3,6}$/i.test(str) || /^EQUIP-\d+$/i.test(str);
  });
  return validIds.length >= Math.min(3, columnData.length * 0.7);
}

function isSerialNumberColumn(columnData: any[]): boolean {
  const validSerials = columnData.filter(cell => {
    if (!cell) return false;
    const str = cell.toString().trim();
    // Look for patterns like ABC123-456, XYZ100-001, etc.
    return /^[A-Z]{2,4}\d{2,4}-\d{3,6}$/i.test(str) || 
           /^[A-Z]{3,5}\d{2,4}$/i.test(str) ||
           str.length >= 6; // Any string 6+ chars could be a serial
  });
  return validSerials.length >= Math.min(3, columnData.length * 0.7);
}

function isNameColumn(columnData: any[]): boolean {
  const validNames = columnData.filter(cell => {
    if (!cell) return false;
    const str = cell.toString().trim();
    return str.length >= 3 && str.length <= 100 && /[a-zA-Z]/.test(str);
  });
  return validNames.length >= Math.min(3, columnData.length * 0.8);
}

function isCategoryColumn(columnData: any[]): boolean {
  const categories = ['air quality', 'water quality', 'noise', 'vibration', 'weather', 'dust', 'gas', 'radiation'];
  const validCategories = columnData.filter(cell => {
    if (!cell) return false;
    const str = cell.toString().toLowerCase();
    return categories.some(cat => str.includes(cat) || cat.includes(str));
  });
  return validCategories.length >= Math.min(2, columnData.length * 0.5);
}

function isLocationColumn(columnData: any[]): boolean {
  const locations = ['office', 'warehouse', 'field', 'main', 'site', 'building'];
  const validLocations = columnData.filter(cell => {
    if (!cell) return false;
    const str = cell.toString().toLowerCase();
    return locations.some(loc => str.includes(loc) || loc.includes(str));
  });
  return validLocations.length >= Math.min(2, columnData.length * 0.5);
}

// Header detection functions
function isEquipmentIdHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('equipment') && h.includes('id') || h === 'id' || h.includes('asset');
}

function isSerialNumberHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('serial') || h.includes('s/n') || h.includes('sn');
}

function isNameHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('name') || h.includes('description') || h.includes('title');
}

function isCategoryHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('category') || h.includes('type') || h.includes('class');
}

function isLocationHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('location') || h.includes('site') || h.includes('place') || h.includes('current location');
}

function isManufacturerHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('manufacturer') || h.includes('make') || h.includes('brand');
}

function isModelHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('model') || h.includes('version');
}

function isPurchaseDateHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('purchase') && h.includes('date') || h.includes('bought');
}

function isPurchaseCostHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('cost') || h.includes('price') || h.includes('purchase') && h.includes('cost');
}

function isConditionRatingHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('condition') || h.includes('rating');
}

function isNotesHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('notes') || h.includes('comments') || h.includes('remarks');
}

// Moniteye-specific header detection functions
function isStatusHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('status') || h.includes('state');
}

function isOwnershipHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('ownership') || h.includes('owner');
}

function isEndDateHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('end date') || h.includes('expiry') || h.includes('expires');
}

function isCalibrationDueHeader(header: string): boolean {
  const h = header.toLowerCase();
  // Be more specific to avoid confusion with end dates
  return (h.includes('calibration') && h.includes('due')) ||
         (h.includes('cal') && h.includes('due')) ||
         h.includes('calibration due') ||
         h.includes('cal due') ||
         h.includes('next calibration') ||
         h.includes('cert due') ||
         h.includes('certificate due') ||
         h === 'calibration due' ||
         h === 'cal due';
}

// Enhanced location mapping
function mapLocationToId(locationName: string): { id: string; name: string } {
  if (!locationName) return { id: 'unknown', name: 'Unknown' };
  
  const cleanLocationName = locationName.toString().trim();
  
  // Create a simple ID from the location name
  const locationId = cleanLocationName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Use the original location name verbatim for display
  return { id: locationId || 'unknown', name: cleanLocationName };
}

// Enhanced status mapping
function mapLocationToStatus(locationName: string): 'active' | 'maintenance' | 'retired' | 'lost' {
  if (!locationName) return 'active';
  
  const location = locationName.toString().toLowerCase().trim();
  
  if (location.includes('calibration') || location.includes('sigicom') || location.includes('cal lab')) {
    return 'maintenance'; // At calibration
  }
  
  if (location.includes('office') || location.includes('warehouse') || location.includes('stock')) {
    return 'active'; // In stock
  }
  
  if (location.includes('lost') || location.includes('missing')) {
    return 'lost';
  }
  
  if (location.includes('retired') || location.includes('decommissioned')) {
    return 'retired';
  }
  
  return 'active'; // Default for field deployments
}

// Main auto-detection function
function autoDetectFileStructure(jsonDataWithHeaders: any[], jsonDataRaw: any[]): DetectionResult {
  if (!jsonDataRaw || jsonDataRaw.length < 2) {
    return {
      success: false,
      error: 'File appears to be empty or has insufficient data',
      suggestions: ['Ensure your CSV file has at least 2 rows of data (header + data row)']
    };
  }

  let equipmentIdColumn = -1;
  let nameColumn = -1;
  let categoryColumn = -1;
  let locationColumn = -1;
  let manufacturerColumn = -1;
  let modelColumn = -1;
  let serialNumberColumn = -1;
  let purchaseDateColumn = -1;
  let purchaseCostColumn = -1;
  let conditionRatingColumn = -1;
  let notesColumn = -1;
  let statusColumn = -1;
  let ownershipColumn = -1;
  let endDateColumn = -1;
  let calibrationDueColumn = -1;
  let startRow = 1;
  let headers: string[] = [];

  // First approach: Try to use headers if they exist
  if (jsonDataWithHeaders.length > 0) {
    const firstObject = jsonDataWithHeaders[0];
    headers = Object.keys(firstObject);
    
    console.log('Available headers:', headers);
    
    // Look for columns by header name
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (equipmentIdColumn === -1 && isEquipmentIdHeader(header)) {
        equipmentIdColumn = i;
      }
      if (serialNumberColumn === -1 && isSerialNumberHeader(header)) {
        serialNumberColumn = i;
      }
      if (nameColumn === -1 && isNameHeader(header)) {
        nameColumn = i;
      }
      if (categoryColumn === -1 && isCategoryHeader(header)) {
        categoryColumn = i;
      }
      if (locationColumn === -1 && isLocationHeader(header)) {
        locationColumn = i;
      }
      if (manufacturerColumn === -1 && isManufacturerHeader(header)) {
        manufacturerColumn = i;
      }
      if (modelColumn === -1 && isModelHeader(header)) {
        modelColumn = i;
      }
      if (purchaseDateColumn === -1 && isPurchaseDateHeader(header)) {
        purchaseDateColumn = i;
      }
      if (purchaseCostColumn === -1 && isPurchaseCostHeader(header)) {
        purchaseCostColumn = i;
      }
      if (conditionRatingColumn === -1 && isConditionRatingHeader(header)) {
        conditionRatingColumn = i;
      }
      if (notesColumn === -1 && isNotesHeader(header)) {
        notesColumn = i;
      }
      if (statusColumn === -1 && isStatusHeader(header)) {
        statusColumn = i;
      }
      if (ownershipColumn === -1 && isOwnershipHeader(header)) {
        ownershipColumn = i;
      }
      if (endDateColumn === -1 && isEndDateHeader(header)) {
        endDateColumn = i;
      }
      if (calibrationDueColumn === -1 && isCalibrationDueHeader(header)) {
        calibrationDueColumn = i;
      }
      // Check for date columns that could be location data (like "18/08/2025")
      if (locationColumn === -1 && header && header.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        locationColumn = i;
        console.log(`Found date column for location at index ${i}: ${header}`);
      }
    }
  }

  // Second approach: Analyze data content if headers didn't work
  if (serialNumberColumn === -1 || nameColumn === -1) {
    const maxColumns = Math.max(...jsonDataRaw.map(row => (row as any[]).length));
    
    for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
      const columnData = jsonDataRaw.slice(1).map(row => (row as any[])[colIndex]).filter(cell => cell != null);
      
      if (columnData.length === 0) continue;
      
      if (equipmentIdColumn === -1 && isEquipmentIdColumn(columnData)) {
        equipmentIdColumn = colIndex;
      }
      if (serialNumberColumn === -1 && colIndex !== equipmentIdColumn && isSerialNumberColumn(columnData)) {
        serialNumberColumn = colIndex;
      }
      if (nameColumn === -1 && colIndex !== equipmentIdColumn && colIndex !== serialNumberColumn && isNameColumn(columnData)) {
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

  // Serial number is now REQUIRED - must be detected
  if (serialNumberColumn === -1) {
    return {
      success: false,
      error: 'Could not detect serial number column - REQUIRED for equipment identification',
      suggestions: [
        'Ensure you have a column with serial numbers',
        'Try using headers like "Serial Number", "Serial", "SN", or "Asset Number"',
        'Serial numbers should be unique identifiers (3-50 characters)',
        'Serial number is now the primary key and must be present for all equipment'
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
  if (equipmentIdColumn === -1) equipmentIdColumn = 0; // Will generate if needed
  if (categoryColumn === -1) categoryColumn = 2; // Default position
  if (locationColumn === -1) locationColumn = 3; // Default position

  let detectedFormat = `Detected REQUIRED serial numbers in column ${String.fromCharCode(65 + serialNumberColumn)}`;
  if (headers[serialNumberColumn]) {
    detectedFormat += ` ("${headers[serialNumberColumn]}")`;
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
    manufacturerColumn,
    modelColumn,
    serialNumberColumn,
    purchaseDateColumn,
    purchaseCostColumn,
    conditionRatingColumn,
    notesColumn,
    statusColumn,
    ownershipColumn,
    endDateColumn,
    calibrationDueColumn,
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

    // Read and parse the CSV/Excel file
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

    const { 
      equipmentIdColumn, 
      nameColumn, 
      categoryColumn, 
      locationColumn,
      manufacturerColumn,
      modelColumn,
      serialNumberColumn,
      purchaseDateColumn,
      purchaseCostColumn,
      conditionRatingColumn,
      notesColumn,
      statusColumn,
      ownershipColumn,
      endDateColumn,
      calibrationDueColumn,
      startRow 
    } = detectionResult;

    // Get available categories and locations for mapping
    const { data: categories } = await supabaseAdmin
      .from('equipment_categories')
      .select('id, name');

    const { data: locations } = await supabaseAdmin
      .from('equipment_locations')
      .select('id, name');

    // Function to ensure location exists in database or return the text as-is for free text locations
    const ensureLocationExists = async (locationName: string): Promise<string> => {
      if (!locationName || locationName.trim() === '') return 'Field Site';
      
      const cleanLocationName = locationName.toString().trim();
      
      // For free text locations, we can just return the clean location name
      // The database schema should support storing location as free text
      return cleanLocationName;
    };

    // Process equipment records with location history from date columns
    const equipmentRecords: EquipmentRecord[] = [];
    const errors: string[] = [];
    let equipmentCounter = 1; // Counter for generating unique equipment IDs

    for (let i = startRow!; i < jsonDataRaw.length; i++) {
      const row = jsonDataRaw[i] as any[];
      if (row.length > Math.max(serialNumberColumn!, nameColumn!)) {
        const serialNumber = row[serialNumberColumn!]?.toString().trim();
        let name = row[nameColumn!]?.toString().trim();
        
        // Serial number is now REQUIRED
        if (!serialNumber) {
          console.log(`Skipping row ${i + 1}: Missing required serial number`);
          continue;
        }
        
        // Generate name if missing
        if (!name && serialNumber) {
          const manufacturer = manufacturerColumn !== undefined ? row[manufacturerColumn]?.toString().trim() : 'Unknown';
          const model = modelColumn !== undefined ? row[modelColumn]?.toString().trim() : 'Unknown';
          name = `${manufacturer} ${model} ${serialNumber}`;
        }
        
        if (serialNumber && name) {
          // Equipment ID is now optional - generate if not provided
          let equipmentId = row[equipmentIdColumn!]?.toString().trim();
          if (!equipmentId) {
            // Generate optional equipment ID based on serial number
            equipmentId = `EQ-${serialNumber}`;
          }

          // Parse location history from date columns
          const locationHistory: Array<{date: Date, location: string, locationId: string}> = [];
          
          // Look for date columns (starting from column after basic info)
          const basicColumns = [equipmentIdColumn, nameColumn, statusColumn, manufacturerColumn, modelColumn, serialNumberColumn, ownershipColumn, endDateColumn, calibrationDueColumn].filter(col => col !== undefined);
          const maxBasicColumn = Math.max(...basicColumns);
          
          // Process date columns (typically start after column H in your sheet)
          for (let colIndex = maxBasicColumn + 1; colIndex < row.length; colIndex++) {
            const cellValue = row[colIndex];
            if (cellValue && cellValue.toString().trim()) {
              const cellStr = cellValue.toString().trim();
              
              // Check if this looks like a date
              const parsedDate = parseDate(cellStr);
              if (parsedDate) {
                // Use the header as location name if available
                let locationName = detectionResult.headers?.[colIndex] || `Location ${colIndex}`;
                
                // Clean up location name (remove date format)
                locationName = locationName.replace(/^\d{2}\/\d{2}\/\d{4}$/, `Date Column ${colIndex}`);
                
                locationHistory.push({
                  date: parsedDate,
                  location: locationName,
                  locationId: 'Field Site' // Default to field site
                });
              } else {
                // This might be a location name for this date column
                const headerDate = detectionResult.headers?.[colIndex];
                if (headerDate && parseDate(headerDate)) {
                  // Header is a date, cell content is location
                  const parsedHeaderDate = parseDate(headerDate);
                  if (parsedHeaderDate) {
                    locationHistory.push({
                      date: parsedHeaderDate,
                      location: cellStr,
                      locationId: 'Field Site'
                    });
                  }
                }
              }
            }
          }

          // Sort location history by date (most recent first)
          locationHistory.sort((a, b) => b.date.getTime() - a.date.getTime());

          // Determine current location and status using improved mapping
          let currentLocationId = 'Field Site'; // default
          let currentLocationName = 'Field Site';
          let status: 'active' | 'maintenance' | 'retired' | 'lost' = 'active';

          // Check if we have a location column with direct location data
          if (locationColumn !== undefined && row[locationColumn]) {
            const locationValue = row[locationColumn].toString().trim();
            if (locationValue && locationValue !== '???' && locationValue !== '') {
              currentLocationName = locationValue;
              currentLocationId = await ensureLocationExists(locationValue);
              status = mapLocationToStatus(locationValue);
            }
          } else if (locationHistory.length > 0) {
            // Fall back to location history if no direct location column
            const mostRecentLocation = locationHistory[0];
            currentLocationName = mostRecentLocation.location;
            currentLocationId = await ensureLocationExists(mostRecentLocation.location);
            status = mapLocationToStatus(mostRecentLocation.location);
          }

          // Map category
          let categoryId = 'vibration'; // default for monitoring equipment
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

          // Handle calibration due date - check multiple possible columns
          let calibrationDue: Date | undefined;
          
          // First try the detected calibration column
          if (calibrationDueColumn !== undefined && row[calibrationDueColumn]) {
            calibrationDue = parseDate(row[calibrationDueColumn].toString()) || undefined;
            console.log(`Using detected calibration column ${calibrationDueColumn}: ${row[calibrationDueColumn]} -> ${calibrationDue}`);
          }
          
          // If no calibration date found, scan ALL columns for future dates (likely calibration dates)
          // BUT exclude the end date column to avoid confusion
          if (!calibrationDue) {
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
              // Skip the end date column to avoid using project end dates as calibration dates
              if (colIndex === endDateColumn) continue;
              
              if (row[colIndex]) {
                const cellValue = row[colIndex].toString().trim();
                const parsedDate = parseDate(cellValue);
                
                // Look for dates that could be calibration dates
                // Accept any future date, but prefer dates within reasonable calibration timeframes
                if (parsedDate && parsedDate > new Date()) {
                  calibrationDue = parsedDate;
                  console.log(`Found calibration date in column ${colIndex}: ${cellValue} -> ${calibrationDue}`);
                  break;
                }
              }
            }
          }

          // Handle end date (project end date for Gantt chart)
          let endDate: Date | undefined;
          if (endDateColumn !== undefined && row[endDateColumn]) {
            const endDateStr = row[endDateColumn].toString();
            if (endDateStr !== '???' && endDateStr.trim() !== '') {
              endDate = parseDate(endDateStr) || undefined;
              console.log(`Using end date column ${endDateColumn}: ${endDateStr} -> ${endDate}`);
            }
          }

          // Combine notes with ownership and location history
          let combinedNotes = '';
          if (notesColumn !== undefined && row[notesColumn]) {
            combinedNotes = row[notesColumn].toString().trim();
          }
          if (ownershipColumn !== undefined && row[ownershipColumn]) {
            const ownership = row[ownershipColumn].toString().trim();
            if (ownership && ownership !== 'Moniteye') {
              combinedNotes = combinedNotes ? `${combinedNotes}. Ownership: ${ownership}` : `Ownership: ${ownership}`;
            }
          }
          
          // Add location history summary to notes
          if (locationHistory.length > 1) {
            const historyText = locationHistory.slice(1, 4).map(h => 
              `${h.location} (${h.date.toLocaleDateString()})`
            ).join(', ');
            combinedNotes = combinedNotes ? `${combinedNotes}. Recent locations: ${historyText}` : `Recent locations: ${historyText}`;
          }

          equipmentRecords.push({
            serial_number: serialNumber,
            equipment_id: equipmentId,
            name: name,
            category_id: categoryId,
            location_id: currentLocationId,
            status: status,
            manufacturer: manufacturerColumn !== undefined ? row[manufacturerColumn]?.toString().trim() : 'Sigicom',
            model: modelColumn !== undefined ? row[modelColumn]?.toString().trim() : 'C22',
            purchase_date: purchaseDateColumn !== undefined && row[purchaseDateColumn] ? parseDate(row[purchaseDateColumn].toString()) || undefined : undefined,
            purchase_cost: purchaseCostColumn !== undefined && row[purchaseCostColumn] ? parseFloat(row[purchaseCostColumn]) : undefined,
            warranty_expiry: endDate,
            next_calibration_due: calibrationDue,
            condition_rating: conditionRatingColumn !== undefined && row[conditionRatingColumn] ? parseInt(row[conditionRatingColumn]) : 5,
            notes: combinedNotes || `${endDate ? `Project ends: ${endDate.toLocaleDateString()}` : ''}`
          });

          // Store location history in separate records for historical tracking
          for (const historyItem of locationHistory) {
            // We'll process this in the database insertion section
          }
        }
      }
    }

    if (equipmentRecords.length === 0) {
      return res.status(400).json({
        error: 'No valid equipment data found after processing',
        detectedFormat: detectionResult.detectedFormat,
        suggestions: [
          'Verify that your serial number column contains valid serial numbers (REQUIRED)',
          'Verify that your name column contains equipment names',
          'Check for empty rows or cells in your data',
          'Serial numbers must be unique and present for all equipment'
        ]
      });
    }

    // Create upload batch record
    const batchId = uuidv4();
    let successfulImports = 0;
    let failedImports = 0;
    let updatedRecords = 0;

    // Process equipment records
    for (const record of equipmentRecords) {
      try {
        // Check if equipment with this serial number already exists
        const { data: existingEquipment, error: checkError } = await supabaseAdmin
          .from('equipment_inventory')
          .select('serial_number, name, status')
          .eq('serial_number', record.serial_number)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing equipment:', checkError);
          failedImports++;
          continue;
        }

        if (existingEquipment) {
          // Update existing equipment
          const { error: updateError } = await supabaseAdmin
            .from('equipment_inventory')
            .update({
              equipment_id: record.equipment_id,
              name: record.name,
              category_id: record.category_id,
              manufacturer: record.manufacturer,
              model: record.model,
              purchase_date: record.purchase_date,
              purchase_cost: record.purchase_cost,
              warranty_expiry: record.warranty_expiry,
              location_id: record.location_id,
              status: record.status,
              condition_rating: record.condition_rating,
              last_calibration_date: record.last_calibration_date,
              next_calibration_due: record.next_calibration_due,
              calibration_frequency_months: record.calibration_frequency_months,
              notes: record.notes,
              specifications: record.specifications,
              updated_at: new Date().toISOString()
            })
            .eq('serial_number', record.serial_number);

          if (updateError) {
            console.error('Error updating equipment:', updateError);
            failedImports++;
          } else {
            updatedRecords++;
            successfulImports++;
          }
        } else {
          // Insert new equipment
          const { error: insertError } = await supabaseAdmin
            .from('equipment_inventory')
            .insert([record]);

          if (insertError) {
            console.error('Error inserting equipment:', insertError);
            failedImports++;
          } else {
            successfulImports++;
          }
        }
      } catch (error) {
        console.error('Error processing equipment record:', error);
        failedImports++;
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
      success: true,
      message: `Successfully processed ${successfulImports} equipment records (${updatedRecords} updated, ${successfulImports - updatedRecords} new). ${failedImports} failed.`,
      batchId,
      totalProcessed: equipmentRecords.length,
      successfulImports,
      failedImports,
      updatedRecords,
      detectedFormat: detectionResult.detectedFormat
    });

  } catch (error) {
    console.error('Equipment upload error:', error);
    return res.status(500).json({
      error: 'Failed to process equipment file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 