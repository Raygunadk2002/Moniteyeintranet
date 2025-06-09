import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import * as XLSX from 'xlsx';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
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
    
    // Get raw data (arrays)
    const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Get data with headers
    const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet);

    // Extract first few rows for analysis
    const maxRows = Math.min(10, jsonDataRaw.length);
    const sampleRows = jsonDataRaw.slice(0, maxRows);
    
    // Get column info
    const maxColumns = Math.max(...jsonDataRaw.map(row => (row as any[]).length));
    const columnInfo = [];
    
    for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
      const columnData = jsonDataRaw.slice(1, 6).map(row => (row as any[])[colIndex]).filter(cell => cell != null);
      const header = jsonDataRaw[0] ? (jsonDataRaw[0] as any[])[colIndex] : null;
      
      columnInfo.push({
        index: colIndex,
        letter: String.fromCharCode(65 + colIndex),
        header: header,
        sampleData: columnData.slice(0, 3),
        totalNonEmptyRows: columnData.length
      });
    }

    // Return debug information
    return res.status(200).json({
      success: true,
      debug: {
        sheetName,
        totalRows: jsonDataRaw.length,
        totalColumns: maxColumns,
        sampleRows: sampleRows,
        columnInfo: columnInfo,
        firstRowAsHeaders: jsonDataRaw[0],
        headerObjectKeys: Object.keys(jsonDataWithHeaders[0] || {}),
        sampleDataWithHeaders: jsonDataWithHeaders.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Debug upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze uploaded file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 