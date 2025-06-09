import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

interface RevenueData {
  month: string;
  revenue: number;
  timestamp: string;
}

interface RevenueDataFile {
  monthlyRevenue: RevenueData[];
  lastUpdated: string;
  totalRevenue: number;
  revenueChange: string;
  revenueData: number[];
}

interface DetectionResult {
  success: boolean;
  dateColumn?: number;
  valueColumn?: number;
  startRow?: number;
  headers?: string[];
  error?: string;
  suggestions?: string[];
  detectedFormat?: string;
}

// Helper function to detect date columns (invoices/transactions)
function isDateColumn(columnData: any[]): boolean {
  let dateCount = 0;
  const sampleSize = Math.min(10, columnData.length);
  
  for (let i = 0; i < sampleSize; i++) {
    if (columnData[i] && parseInvoiceDate(columnData[i].toString())) {
      dateCount++;
    }
  }
  
  return dateCount / sampleSize > 0.5; // More than 50% are valid dates
}

// Helper function to detect value/amount columns
function isValueColumn(columnData: any[]): boolean {
  let numericCount = 0;
  const sampleSize = Math.min(10, columnData.length);
  
  for (let i = 0; i < sampleSize; i++) {
    if (columnData[i] && !isNaN(parseFloat(columnData[i])) && parseFloat(columnData[i]) > 0) {
      numericCount++;
    }
  }
  
  return numericCount / sampleSize > 0.7; // More than 70% are valid positive numbers
}

// Helper function to identify headers that might contain date info
function isDateHeader(header: string): boolean {
  const headerLower = header.toLowerCase();
  
  // Highest priority: Specific invoice date terms
  const invoiceDateKeywords = [
    'invoice date', 'invoice_date', 'invoicedate',
    'bill date', 'bill_date', 'billdate',
    'date invoice', 'date_invoice',
    'transaction date', 'transaction_date'
  ];
  
  // Check for exact invoice date matches first
  if (invoiceDateKeywords.some(keyword => headerLower.includes(keyword))) {
    return true;
  }
  
  // Medium priority: General date keywords combined with invoice terms
  if (headerLower.includes('invoice') && headerLower.includes('date')) {
    return true;
  }
  if (headerLower.includes('bill') && headerLower.includes('date')) {
    return true;
  }
  
  // Lower priority: General date terms
  const generalDateKeywords = ['date', 'created', 'issued', 'fecha', 'datum', 'time', 'when', 'day'];
  return generalDateKeywords.some(keyword => 
    headerLower.includes(keyword)
  );
}

// Helper function to identify headers that might contain value info
function isValueHeader(header: string): boolean {
  const headerLower = header.toLowerCase();
  
  // Highest priority: Specific gross/source amount terms
  const grossSourceKeywords = [
    'gross (source)', 'gross(source)', 'gross source',
    'gross_source', 'gross-source', 'grosssource',
    'gross amount', 'gross_amount', 'gross-amount'
  ];
  
  // Check for exact gross source matches first
  if (grossSourceKeywords.some(keyword => headerLower.includes(keyword))) {
    return true;
  }
  
  // Medium priority: General gross terms
  if (headerLower.includes('gross') && (headerLower.includes('amount') || headerLower.includes('value') || headerLower.includes('total'))) {
    return true;
  }
  
  // Lower priority: General amount/value terms
  const generalValueKeywords = ['amount', 'value', 'total', 'sum', 'revenue', 'sales', 'income', 'price', 'cost', 'money', 'valor', 'monto', 'importe'];
  return generalValueKeywords.some(keyword => 
    headerLower.includes(keyword)
  );
}

// Main auto-detection function for invoice data
function autoDetectFileStructure(jsonDataWithHeaders: any[], jsonDataRaw: any[]): DetectionResult {
  if (!jsonDataRaw || jsonDataRaw.length < 2) {
    return {
      success: false,
      error: 'File appears to be empty or has insufficient data',
      suggestions: ['Ensure your Excel file has at least 2 rows of data (header + data row)']
    };
  }

  let dateColumn = -1;
  let valueColumn = -1;
  let startRow = 1; // Assume first row is header
  let headers: string[] = [];

  // First approach: Try to use headers if they exist
  if (jsonDataWithHeaders.length > 0) {
    const firstObject = jsonDataWithHeaders[0];
    headers = Object.keys(firstObject);
    
    console.log('Available headers:', headers);
    
    // Look for date column by header name
    for (let i = 0; i < headers.length; i++) {
      if (isDateHeader(headers[i])) {
        console.log(`Found date header: "${headers[i]}" at column ${i}`);
        dateColumn = i;
        break;
      }
    }
    
    // Look for value column by header name with gross (source) prioritization
    let foundGrossSource = false;
    for (let i = 0; i < headers.length; i++) {
      const headerLower = headers[i].toLowerCase();
      const grossSourceKeywords = [
        'gross (source)', 'gross(source)', 'gross source',
        'gross_source', 'gross-source', 'grosssource'
      ];
      
      // Check for gross (source) first - highest priority
      if (grossSourceKeywords.some(keyword => headerLower.includes(keyword))) {
        console.log(`Found gross source header: "${headers[i]}" at column ${i}`);
        valueColumn = i;
        foundGrossSource = true;
        break;
      }
    }
    
    // If no gross (source) column found, use regular value detection
    if (!foundGrossSource) {
      for (let i = 0; i < headers.length; i++) {
        if (isValueHeader(headers[i])) {
          console.log(`Found value header: "${headers[i]}" at column ${i}`);
          valueColumn = i;
          break;
        }
      }
    }
  }

  // Second approach: Analyze data content if headers didn't work
  if (dateColumn === -1 || valueColumn === -1) {
    // Extract column data for analysis
    const maxColumns = Math.max(...jsonDataRaw.map(row => (row as any[]).length));
    
    for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
      const columnData = jsonDataRaw.slice(1).map(row => (row as any[])[colIndex]).filter(cell => cell != null);
      
      if (columnData.length === 0) continue;
      
      // Skip columns that were already detected for the other type
      if (colIndex === dateColumn || colIndex === valueColumn) continue;
      
      // Check if this column contains date data
      if (dateColumn === -1 && isDateColumn(columnData)) {
        dateColumn = colIndex;
      }
      
      // Check if this column contains value data (but not if it's the date column)
      if (valueColumn === -1 && colIndex !== dateColumn && isValueColumn(columnData)) {
        valueColumn = colIndex;
      }
    }
  }

  // Third approach: Hardcoded fallback for specific file structure
  // If we only found one header or wrong detection, force specific columns
  if (headers.length === 1 || (dateColumn === valueColumn && dateColumn === 0)) {
    console.log('Using hardcoded column mapping: Column C (2) for dates, Column G (6) for amounts');
    
    // Check if the file has enough columns
    const maxColumns = Math.max(...jsonDataRaw.map(row => (row as any[]).length));
    if (maxColumns >= 7) { // Need at least 7 columns for G (index 6)
      dateColumn = 2;  // Column C (0-indexed)
      valueColumn = 6; // Column G (0-indexed)
      
      // Create proper headers array if we don't have them
      if (headers.length === 1) {
        headers = [];
        for (let i = 0; i < maxColumns; i++) {
          headers.push(`Column ${String.fromCharCode(65 + i)}`);
        }
        // Override with known column names
        headers[2] = 'Invoice Date (Column C)';
        headers[6] = 'Gross Amount (Column G)';
      }
    }
  }

  // Validate detection results
  if (dateColumn === -1 && valueColumn === -1) {
    return {
      success: false,
      error: 'Could not detect date or value columns',
      suggestions: [
        'Ensure your Excel file has a column with invoice dates (e.g., "2025-01-15", "15/01/2025", "January 15, 2025")',
        'Ensure your Excel file has a column with invoice amounts/values',
        'Try using headers like "Date", "Invoice Date", "Amount", "Value", "Total"',
        'Make sure data starts from row 2 if row 1 contains headers'
      ]
    };
  }

  // Critical check: Ensure date and value columns are different
  if (dateColumn === valueColumn) {
    return {
      success: false,
      error: 'Date and amount columns cannot be the same. Both were detected in the same column.',
      suggestions: [
        'Ensure your Excel file has separate columns for dates and amounts',
        'Check that your date column only contains dates, not mixed date/amount data',
        'Check that your amount column only contains numeric values',
        'Your file should have at least 2 columns: one for dates, one for amounts'
      ]
    };
  }

  if (dateColumn === -1) {
    return {
      success: false,
      error: 'Could not detect date column',
      suggestions: [
        'Ensure you have a column with invoice dates in formats like "2025-01-15", "15/01/2025", "January 15, 2025"',
        'Try adding a header like "Date", "Invoice Date", or "Transaction Date"',
        'Check that your date column contains recognizable date formats'
      ]
    };
  }

  if (valueColumn === -1) {
    return {
      success: false,
      error: 'Could not detect value/amount column',
      suggestions: [
        'Ensure you have a column with numeric values representing invoice amounts',
        'Try using headers like "Gross (Source)", "Gross Amount", "Amount", "Value", "Total", or "Revenue"',
        'For best results, use "Gross (Source)" as your amount column header',
        'Check that your numeric column contains positive numbers without currency symbols'
      ]
    };
  }

  // Determine the format description for user feedback
  let detectedFormat = `Detected invoice dates in column ${String.fromCharCode(65 + dateColumn)} `;
  if (headers[dateColumn]) {
    detectedFormat += `("${headers[dateColumn]}") `;
  }
  detectedFormat += `and invoice amounts in column ${String.fromCharCode(65 + valueColumn)}`;
  if (headers[valueColumn]) {
    detectedFormat += ` ("${headers[valueColumn]}")`;
  }

  return {
    success: true,
    dateColumn,
    valueColumn,
    startRow,
    headers,
    detectedFormat
  };
}

// Helper function to parse invoice dates
function parseInvoiceDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const str = dateStr.toString().trim();
  
  // Check if it's an Excel serial date number (5-digit number)
  const numericValue = parseFloat(str);
  if (!isNaN(numericValue) && numericValue > 40000 && numericValue < 50000) {
    // Excel serial date: days since January 1, 1900 (with leap year bug correction)
    // Excel treats 1900 as a leap year, so we need to subtract 1 day for dates after Feb 28, 1900
    const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    
    // Excel serial dates start from 1 = January 1, 1900
    // But need to account for Excel's leap year bug (it thinks 1900 was a leap year)
    let daysToAdd = numericValue - 1; // Convert from 1-based to 0-based
    if (numericValue > 59) { // After Feb 28, 1900
      daysToAdd -= 1; // Correct for Excel's leap year bug
    }
    
    const resultDate = new Date(excelEpoch.getTime() + (daysToAdd * millisecondsPerDay));
    
    // Validate the result is reasonable
    if (resultDate.getFullYear() >= 1990 && resultDate.getFullYear() <= 2100) {
      return resultDate;
    }
  }
  
  // Try different date formats
  const formats = [
    // ISO format
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/i, // "2025-01-15"
    // UK/European format
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/i, // "15/01/2025"
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/i, // "15-01-2025"
    // US format
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/i, // "01/15/2025"
    // Long format
    /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i, // "January 15, 2025"
    /^(\d{1,2})\s+(\w+)\s+(\d{4})$/i, // "15 January 2025"
  ];

  // Try parsing with native Date constructor first
  const nativeDate = new Date(str);
  if (!isNaN(nativeDate.getTime()) && nativeDate.getFullYear() > 1900) {
    return nativeDate;
  }

  // Try manual parsing for specific formats
  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      let year, month, day;
      
      if (format.source.includes('\\w')) {
        // Month name format
        if (match[1] && isNaN(parseInt(match[1]))) {
          // "January 15, 2025"
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                            'july', 'august', 'september', 'october', 'november', 'december'];
          const monthIndex = monthNames.findIndex(m => m === match[1].toLowerCase());
          if (monthIndex !== -1) {
            month = monthIndex + 1;
            day = parseInt(match[2]);
            year = parseInt(match[3]);
          }
        } else {
          // "15 January 2025"
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                            'july', 'august', 'september', 'october', 'november', 'december'];
          const monthIndex = monthNames.findIndex(m => m === match[2].toLowerCase());
          if (monthIndex !== -1) {
            day = parseInt(match[1]);
            month = monthIndex + 1;
            year = parseInt(match[3]);
          }
        }
      } else {
        // Numeric format
        if (match[1].length === 4) {
          // ISO format: YYYY-MM-DD
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else {
          // Try to determine if DD/MM/YYYY or MM/DD/YYYY
          const part1 = parseInt(match[1]);
          const part2 = parseInt(match[2]);
          year = parseInt(match[3]);
          
          // If first part > 12, it must be day
          if (part1 > 12) {
            day = part1;
            month = part2;
          } else if (part2 > 12) {
            // If second part > 12, it must be day
            month = part1;
            day = part2;
          } else {
            // Ambiguous - assume DD/MM/YYYY (European format)
            day = part1;
            month = part2;
          }
        }
      }
      
      if (year && month && day && 
          year >= 1990 && year <= 2100 && // Reasonable year range
          month >= 1 && month <= 12 && 
          day >= 1 && day <= 31) {
        const date: Date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && date.getFullYear() === year) {
          return date;
        }
      }
    }
  }
  
  return null;
}

// Helper function to group invoices by month and sum values
function groupInvoicesByMonth(invoices: { date: Date; value: number }[]): RevenueData[] {
  const monthlyTotals = new Map<string, number>();
  const timestamp = new Date().toISOString();

  // Group invoices by month-year key
  invoices.forEach(invoice => {
    const year = invoice.date.getFullYear();
    const month = invoice.date.getMonth() + 1; // 1-12
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    const currentTotal = monthlyTotals.get(monthKey) || 0;
    monthlyTotals.set(monthKey, currentTotal + invoice.value);
  });

  // Convert to array and sort by date
  const monthlyRevenue: RevenueData[] = Array.from(monthlyTotals.entries())
    .map(([monthKey, total]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      
      const date = new Date(year, month - 1, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      return {
        month: monthName,
        revenue: Math.round(total * 100) / 100, // Round to 2 decimal places
        timestamp
      };
    })
    .sort((a, b) => {
      // Sort by creating dates from the month names for comparison
      const dateA = new Date(a.month + ' 1');
      const dateB = new Date(b.month + ' 1');
      return dateA.getTime() - dateB.getTime();
    });

  return monthlyRevenue;
}

// Helper function to get data file path
function getDataFilePath(): string {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'revenue-data.json');
}

// Helper function to calculate metrics from monthly data
function calculateMetrics(revenueData: RevenueData[]): { totalRevenue: number; revenueChange: string; revenueData: number[] } {
  if (revenueData.length === 0) {
    return { totalRevenue: 0, revenueChange: '0%', revenueData: [] };
  }

  // Sort by month to ensure chronological order
  const sortedData = [...revenueData].sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Calculate total revenue for the period
  const totalRevenue = sortedData.reduce((sum, item) => sum + item.revenue, 0);
  
  // Calculate change from previous to latest month
  let revenueChange = '0%';
  if (sortedData.length >= 2) {
    const current = sortedData[sortedData.length - 1].revenue;
    const previous = sortedData[sortedData.length - 2].revenue;
    if (previous > 0) {
      const change = ((current - previous) / previous) * 100;
      revenueChange = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    }
  }
  
  // Create chart data (all months, convert to thousands for chart)
  const chartData = sortedData.map(item => Math.round(item.revenue / 1000));
  
  return { totalRevenue, revenueChange, revenueData: chartData };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit for invoice files
      filter: ({ mimetype }) => {
        return !!(mimetype && (
          mimetype.includes('spreadsheet') ||
          mimetype.includes('excel') ||
          mimetype.includes('vnd.ms-excel') ||
          mimetype.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ));
      }
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read Excel file
    const workbook = XLSX.readFile(file.filepath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers and raw format
    const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
    const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Auto-detect file structure
    const detectionResult = autoDetectFileStructure(jsonDataWithHeaders, jsonDataRaw);
    
    if (!detectionResult.success) {
      return res.status(400).json({ 
        error: detectionResult.error,
        suggestions: detectionResult.suggestions 
      });
    }

    // Process the invoice data
    const invoices: { date: Date; value: number }[] = [];
    const { dateColumn, valueColumn, startRow } = detectionResult;
    
    for (let i = startRow!; i < jsonDataRaw.length; i++) {
      const row = jsonDataRaw[i] as any[];
      if (row.length > Math.max(dateColumn!, valueColumn!) && row[dateColumn!] && row[valueColumn!]) {
        const date = parseInvoiceDate(row[dateColumn!]);
        const value = parseFloat(row[valueColumn!]);
        
        if (date && !isNaN(value) && value > 0) {
          invoices.push({ date, value });
        }
      }
    }

    if (invoices.length === 0) {
      return res.status(400).json({ 
        error: 'No valid invoice data found after processing. Please check the detected format matches your data.',
        detectedFormat: detectionResult.detectedFormat,
        suggestions: [
          'Verify that your date column contains recognizable date formats (YYYY-MM-DD, DD/MM/YYYY, etc.)',
          'Verify that your value column contains numeric amounts',
          'Check for empty rows or cells in your data'
        ]
      });
    }

    // Group invoices by month and sum values
    const monthlyRevenue = groupInvoicesByMonth(invoices);

    // Calculate metrics
    const metrics = calculateMetrics(monthlyRevenue);

    // Create upload batch record
    const batchId = uuidv4();
    const sortedInvoices = invoices.sort((a, b) => a.date.getTime() - b.date.getTime());
    const earliestDate = sortedInvoices[0].date.toISOString().split('T')[0];
    const latestDate = sortedInvoices[sortedInvoices.length - 1].date.toISOString().split('T')[0];

    // Save to Supabase
    const { error: batchError } = await supabaseAdmin
      .from('upload_batches')
      .insert({
        id: batchId,
        filename: file.originalFilename || 'unknown',
        total_invoices: invoices.length,
        total_amount: metrics.totalRevenue,
        months_generated: monthlyRevenue.length,
        date_range_start: earliestDate,
        date_range_end: latestDate
      });

    if (batchError) {
      console.error('Error saving upload batch raw:', batchError);
      console.error('Error saving upload batch JSON:', JSON.stringify(batchError, null, 2));
      const errorMessage = batchError.message || 'Unknown Supabase error';
      const errorCode = batchError.code || 'No code';
      console.error(`Supabase error: ${errorMessage} (code: ${errorCode})`);
      throw new Error(`Failed to save upload batch: ${errorMessage}`);
    }

    // Save individual invoices
    const invoiceRecords = invoices.map(invoice => ({
      invoice_date: invoice.date.toISOString().split('T')[0],
      amount: invoice.value,
      month_reference: `${invoice.date.getFullYear()}-${(invoice.date.getMonth() + 1).toString().padStart(2, '0')}`,
      upload_batch_id: batchId
    }));

    const { error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .insert(invoiceRecords);

    if (invoicesError) {
      console.error('Error saving invoices raw:', invoicesError);
      console.error('Error saving invoices JSON:', JSON.stringify(invoicesError, null, 2));
      const errorMessage = invoicesError.message || 'Unknown Supabase error';
      const errorCode = invoicesError.code || 'No code';
      console.error(`Supabase error: ${errorMessage} (code: ${errorCode})`);
      throw new Error(`Failed to save invoices: ${errorMessage}`);
    }

    // Clear existing revenue data and insert new monthly totals
    const { error: deleteError } = await supabaseAdmin
      .from('revenue_data')
      .delete()
      .gte('id', 0); // Delete all existing records

    if (deleteError) {
      console.error('Error clearing revenue data raw:', deleteError);
      console.error('Error clearing revenue data JSON:', JSON.stringify(deleteError, null, 2));
      const errorMessage = deleteError.message || 'Unknown Supabase error';
      const errorCode = deleteError.code || 'No code';
      console.error(`Supabase error: ${errorMessage} (code: ${errorCode})`);
      throw new Error(`Failed to clear existing revenue data: ${errorMessage}`);
    }

    // Insert new monthly revenue records
    const revenueRecords = monthlyRevenue.map(item => {
      const dateParts = item.month.split(' ');
      const monthName = dateParts[0];
      const year = parseInt(dateParts[1]);
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;

      return {
        month: item.month,
        revenue: item.revenue,
        year: year,
        month_number: monthNumber,
        invoice_count: invoices.filter(inv => {
          const invYear = inv.date.getFullYear();
          const invMonth = inv.date.getMonth() + 1;
          return invYear === year && invMonth === monthNumber;
        }).length
      };
    });

    const { error: revenueError } = await supabaseAdmin
      .from('revenue_data')
      .insert(revenueRecords);

    if (revenueError) {
      console.error('Error saving revenue data raw:', revenueError);
      console.error('Error saving revenue data JSON:', JSON.stringify(revenueError, null, 2));
      const errorMessage = revenueError.message || 'Unknown Supabase error';
      const errorCode = revenueError.code || 'No code';
      console.error(`Supabase error: ${errorMessage} (code: ${errorCode})`);
      throw new Error(`Failed to save revenue data: ${errorMessage}`);
    }

    // Clean up uploaded file
    fs.unlinkSync(file.filepath);

    res.status(200).json({ 
      message: 'Invoice data processed and saved to database successfully!',
      recordsProcessed: invoices.length,
      monthsGenerated: monthlyRevenue.length,
      totalRevenue: metrics.totalRevenue,
      dateRange: `${earliestDate} to ${latestDate}`,
      detectedFormat: detectionResult.detectedFormat
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: `Failed to process uploaded file. ${errorMessage}` });
  }
} 