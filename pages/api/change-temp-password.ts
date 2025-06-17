import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, currentPassword, newPassword } = req.body

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      error: 'Email, current password, and new password are required' 
    })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      error: 'New password must be at least 6 characters long' 
    })
  }

  try {
    console.log('🔐 Changing temporary password for:', email)

    // First, verify the current temporary password
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!profile.temp_password) {
      return res.status(400).json({ 
        error: 'User does not have a temporary password' 
      })
    }

    if (profile.temp_password !== currentPassword) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      })
    }

    console.log('✅ Temporary password verified')

    // Now create a proper Supabase Auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: newPassword,
      email_confirm: true, // Auto-confirm since we're creating from admin
      user_metadata: {
        full_name: profile.full_name
      }
    })

    if (authError) {
      console.error('❌ Failed to create Supabase Auth user:', authError)
      return res.status(500).json({ 
        error: 'Failed to create secure account',
        details: authError.message 
      })
    }

    console.log('✅ Supabase Auth user created:', authUser.user?.id)

    // Update the profile with the new auth user ID and clear temp password
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        id: authUser.user!.id, // Link to the new auth user
        temp_password: null,   // Clear the temporary password
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())

    if (updateError) {
      console.error('❌ Failed to update profile:', updateError)
      
      // Clean up the auth user if profile update failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
      
      return res.status(500).json({ 
        error: 'Failed to update user profile',
        details: updateError.message 
      })
    }

    console.log('✅ Password changed successfully!')

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully! You can now login with your new password.',
      user: {
        id: authUser.user!.id,
        email: profile.email,
        name: profile.full_name
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error changing password:', error)
    return res.status(500).json({ 
      error: 'Unexpected error changing password',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 