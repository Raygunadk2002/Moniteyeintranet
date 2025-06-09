import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    console.log('Environment variables check:', envCheck);

    // Test basic connection by trying to access our tables
    const { data: uploadBatchesData, error: uploadBatchesError } = await supabaseAdmin
      .from('upload_batches')
      .select('*')
      .limit(1);

    const { data: invoicesData, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .limit(1);

    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from('revenue_data')
      .select('*')
      .limit(1);

    const tablesStatus = {
      upload_batches: {
        accessible: !uploadBatchesError,
        error: uploadBatchesError?.message || null,
        recordCount: uploadBatchesData?.length || 0
      },
      invoices: {
        accessible: !invoicesError,
        error: invoicesError?.message || null,
        recordCount: invoicesData?.length || 0
      },
      revenue_data: {
        accessible: !revenueError,
        error: revenueError?.message || null,
        recordCount: revenueData?.length || 0
      }
    };

    const allTablesAccessible = tablesStatus.upload_batches.accessible && 
                               tablesStatus.invoices.accessible && 
                               tablesStatus.revenue_data.accessible;

    return res.status(200).json({
      success: allTablesAccessible,
      message: allTablesAccessible ? 'Supabase connection successful' : 'Some tables are not accessible',
      env: envCheck,
      tables: tablesStatus,
      instructions: allTablesAccessible ? null : [
        'Some database tables are missing or not accessible.',
        'Please run the database-schema.sql in your Supabase SQL Editor.',
        'See setup-instructions.md for detailed steps.'
      ]
    });

  } catch (error) {
    console.error('Supabase connection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Supabase connection failed',
      details: error,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      instructions: [
        'Check your environment variables in .env.local',
        'Ensure your Supabase project is active',
        'Run the database setup SQL in your Supabase dashboard'
      ]
    });
  }
} 