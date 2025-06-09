import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Setting up database tables...');

    // Test if tables already exist by trying to query them
    const { data: uploadBatchesData, error: testUploadError } = await supabaseAdmin
      .from('upload_batches')
      .select('id')
      .limit(1);

    const { data: invoicesData, error: testInvoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .limit(1);

    const { data: revenueData, error: testRevenueError } = await supabaseAdmin
      .from('revenue_data')
      .select('id')
      .limit(1);

    const tablesExist = {
      upload_batches: !testUploadError,
      invoices: !testInvoicesError,
      revenue_data: !testRevenueError
    };

    console.log('Tables existence check:', tablesExist);

    if (tablesExist.upload_batches && tablesExist.invoices && tablesExist.revenue_data) {
      return res.status(200).json({
        success: true,
        message: 'All database tables already exist and are accessible',
        tables: tablesExist,
        instruction: 'Your database is properly set up and ready to use.'
      });
    }

    // If tables don't exist, provide setup instructions
    const setupInstructions = {
      success: false,
      message: 'Database tables need to be created',
      tables: tablesExist,
      instructions: [
        '1. Go to your Supabase Dashboard (https://supabase.com/dashboard)',
        '2. Select your project',
        '3. Navigate to the SQL Editor',
        '4. Copy and paste the SQL from your database-schema.sql file',
        '5. Click "Run" to execute the SQL',
        '6. Return here and click "Test Database" to verify the setup'
      ],
      sql_file_location: 'database-schema.sql in your project root',
      note: 'The database-schema.sql file has been updated to handle existing policies gracefully'
    };

    return res.status(400).json(setupInstructions);

  } catch (error) {
    console.error('Database setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check database setup',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      instructions: [
        'Please ensure your Supabase environment variables are correctly set:',
        '- NEXT_PUBLIC_SUPABASE_URL',
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY', 
        '- SUPABASE_SERVICE_ROLE_KEY'
      ]
    });
  }
} 