import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '../../lib/supabase';

interface TableTest {
  exists: boolean;
  error: string | null;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== SUPABASE CONNECTION DIAGNOSTIC ===');
    
    // Test environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    };

    console.log('Environment variables:', envCheck);

    // Test basic connectivity
    const { data: healthData, error: healthError } = await supabaseAdmin
      .from('health_check')
      .select('*')
      .limit(1);

    console.log('Health check result:', { healthData, healthError });

    // Test table existence with simple queries
    const tables = ['upload_batches', 'invoices', 'revenue_data'];
    const tableTests: Record<string, TableTest> = {};

    for (const table of tables) {
      try {
        const { data, error, count } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        tableTests[table] = {
          exists: !error,
          error: error?.message || null,
          count: count || 0
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        tableTests[table] = {
          exists: false,
          error: errorMessage,
          count: 0
        };
      }
    }

    console.log('Table test results:', tableTests);

    return res.status(200).json({
      success: true,
      environment: envCheck,
      tables: tableTests,
      message: 'Connection test completed'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Connection test error:', error);
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorStack,
      message: 'Connection test failed'
    });
  }
} 