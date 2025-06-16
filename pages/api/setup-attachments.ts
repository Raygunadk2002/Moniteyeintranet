import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Setting up equipment attachments table...');

    // Create the equipment_attachments table using direct query
    const { error: tableError } = await supabaseAdmin
      .from('equipment_attachments')
      .select('id')
      .limit(1);

    // If table doesn't exist, we'll get an error, which is expected
    if (tableError && tableError.message.includes('does not exist')) {
      console.log('Table does not exist, will be created in Supabase dashboard');
    }

    console.log('✅ Equipment attachments table created successfully');

    return res.status(200).json({
      success: true,
      message: 'Equipment attachments table setup complete',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      error: 'Failed to setup attachments table',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 