import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing database connections...');

    // Test each table
    const tests = [];

    // Test upload_batches table
    try {
      const { data, error } = await supabaseAdmin
        .from('upload_batches')
        .select('id')
        .limit(1);
      
      tests.push({
        table: 'upload_batches',
        success: !error,
        error: error?.message,
        recordCount: data?.length || 0
      });
    } catch (e) {
      tests.push({
        table: 'upload_batches',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }

    // Test invoices table
    try {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('id')
        .limit(1);
      
      tests.push({
        table: 'invoices',
        success: !error,
        error: error?.message,
        recordCount: data?.length || 0
      });
    } catch (e) {
      tests.push({
        table: 'invoices',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }

    // Test revenue_data table
    try {
      const { data, error } = await supabaseAdmin
        .from('revenue_data')
        .select('id')
        .limit(1);
      
      tests.push({
        table: 'revenue_data',
        success: !error,
        error: error?.message,
        recordCount: data?.length || 0
      });
    } catch (e) {
      tests.push({
        table: 'revenue_data',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }

    const allTablesReady = tests.every(test => test.success);

    if (allTablesReady) {
      res.status(200).json({
        success: true,
        message: '✅ All database tables are ready! Upload should work now.',
        tables: tests
      });
    } else {
      res.status(500).json({
        success: false,
        message: '❌ Database tables are missing. Please create them first.',
        tables: tests,
        instructions: [
          '1. Go to your Supabase Dashboard → SQL Editor',
          '2. Run the SQL script from database-schema.sql',
          '3. Or create the tables manually using the CREATE TABLE statements',
          '4. Test again using this endpoint'
        ]
      });
    }

  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 