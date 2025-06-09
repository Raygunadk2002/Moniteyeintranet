import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Setting up database tables directly...');

    const results = {
      upload_batches: { created: false, error: null as string | null },
      invoices: { created: false, error: null as string | null },
      revenue_data: { created: false, error: null as string | null }
    };

    // First check if tables already exist
    const { data: uploadBatchesData, error: uploadBatchesError } = await supabaseAdmin
      .from('upload_batches')
      .select('id')
      .limit(1);

    if (!uploadBatchesError) {
      results.upload_batches = { created: true, error: 'Table already exists' };
    }

    const { data: invoicesData, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .limit(1);

    if (!invoicesError) {
      results.invoices = { created: true, error: 'Table already exists' };
    }

    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from('revenue_data')
      .select('id')
      .limit(1);

    if (!revenueError) {
      results.revenue_data = { created: true, error: 'Table already exists' };
    }

    // If all tables exist, return success
    if (results.upload_batches.created && results.invoices.created && results.revenue_data.created) {
      return res.status(200).json({
        success: true,
        message: 'All database tables already exist',
        results: results
      });
    }

    // Since Supabase doesn't allow DDL through the JS client, provide instructions
    return res.status(200).json({
      success: false,
      message: 'Database tables need to be created manually',
      instructions: {
        step1: 'Go to your Supabase Dashboard > SQL Editor',
        step2: 'Run the SQL script from database-schema.sql',
        step3: 'The script will create all necessary tables and policies',
        sqlFile: 'database-schema.sql contains the complete setup script'
      },
      results: results,
      note: 'Supabase JS client cannot execute DDL commands directly. Please use the SQL Editor in your dashboard.'
    });

  } catch (error) {
    console.error('Database setup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Failed to check database setup'
    });
  }
} 