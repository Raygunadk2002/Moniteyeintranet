import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Running man_days migration...');

    // Add man_days column to tasks table if it doesn't exist
    const { error: migrationError } = await supabaseAdmin.rpc('exec', {
      sql: `
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS man_days numeric(5,2) DEFAULT 0;
      `
    });

    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      return res.status(500).json({ 
        success: false, 
        error: `Migration failed: ${migrationError.message}` 
      });
    }

    console.log('✅ Successfully added man_days column to tasks table');

    // Test the migration by selecting from the tasks table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, man_days')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError);
      return res.status(500).json({ 
        success: false, 
        error: `Test query failed: ${testError.message}` 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      testResult: testData?.length || 0,
      details: {
        columnAdded: 'man_days (numeric(5,2) DEFAULT 0)',
        tableName: 'tasks',
        migrationDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Unexpected migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Unexpected error during migration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 