import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔧 Adding temp_password column to profiles table...')

    // First, check if the column already exists
    const { data: columnCheck, error: checkError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('column_name', 'temp_password')

    if (checkError) {
      console.log('⚠️  Could not check column existence, proceeding with migration...')
    } else if (columnCheck && columnCheck.length > 0) {
      console.log('✅ temp_password column already exists!')
      return res.status(200).json({
        success: true,
        message: 'temp_password column already exists',
        alreadyExists: true
      })
    }

    // Add the temp_password column using direct SQL
    const { error: alterError } = await supabaseAdmin.rpc('exec', {
      sql: `
        -- Add temp_password column to profiles table for database-only authentication
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_password TEXT;
        
        -- Update existing admin user to have a temp password
        UPDATE profiles 
        SET temp_password = 'moniteye2024' 
        WHERE email = 'akeal@moniteye.co.uk' AND temp_password IS NULL;
      `
    })

    if (alterError) {
      console.error('❌ Migration error with rpc exec:', alterError)
      
      // Try an alternative approach: individual operations
      console.log('🔄 Trying alternative approach...')
      
      // Try to add the column
      try {
        await supabaseAdmin.from('profiles').select('temp_password').limit(1)
        console.log('✅ Column seems to exist already')
      } catch (e) {
        console.log('Column might not exist, but we can work around this')
      }

      // Try to update the admin user with temp password (this should work even if column exists)
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ temp_password: 'moniteye2024' })
        .eq('email', 'akeal@moniteye.co.uk')

      if (updateError) {
        console.error('❌ Could not update admin user:', updateError)
        return res.status(500).json({ 
          error: 'Failed to set temp password for admin user',
          details: updateError.message,
          suggestion: 'You may need to add the temp_password column manually in Supabase SQL Editor'
        })
      }

      console.log('✅ Admin user updated with temp password (column might already exist)')
    }

    console.log('✅ temp_password setup completed!')

    return res.status(200).json({
      success: true,
      message: 'temp_password column setup completed',
      details: [
        'Column temp_password processed for profiles table',
        'Admin user updated with temp password: moniteye2024',
        'Ready for database-only user creation',
        'Users can now login with email + temp_password'
      ]
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return res.status(500).json({ 
      error: 'Unexpected error during migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 