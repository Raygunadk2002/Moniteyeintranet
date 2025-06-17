import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🧪 Simple User Creation Test')
    
    // Test with minimal configuration
    const testEmail = `test-${Date.now()}@moniteye.co.uk`
    const testPassword = 'TestPassword123!'
    
    console.log('📧 Test email:', testEmail)
    
    // Try the simplest possible user creation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword
    })

    if (error) {
      console.log('❌ Simple creation failed:', error)
      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name
        },
        testEmail
      })
    }

    console.log('✅ Simple creation succeeded:', data.user?.id)
    
    // Clean up the test user
    try {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      console.log('🧹 Cleaned up test user')
    } catch (cleanupError) {
      console.log('⚠️ Cleanup failed:', cleanupError)
    }

    return res.status(200).json({
      success: true,
      message: 'Simple user creation test passed',
      userId: data.user?.id,
      testEmail
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 