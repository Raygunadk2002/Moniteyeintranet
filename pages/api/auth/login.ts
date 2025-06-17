import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

// Hardcoded users - in production, this would be in a database
const USERS = {
  'akeal@moniteye.co.uk': {
    email: 'akeal@moniteye.co.uk',
    name: 'Alex Keal',
    role: 'admin',
    password: 'moniteye2024', // In production, this would be hashed
    department: 'Management'
  }
  // Add more users here as needed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password, email } = req.body

  // If email is provided, try user authentication
  if (email) {
    try {
      console.log('🔐 Attempting login for:', email)

      // FIRST: Try temporary password authentication (database-only)
      console.log('🔍 Checking for temporary password in database...')
      const { data: tempProfile, error: tempError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (!tempError && tempProfile && tempProfile.temp_password) {
        console.log('🔑 Found user with temporary password')
        
        if (tempProfile.temp_password === password) {
          console.log('✅ Temporary password match! Database-only login successful')
          
          // Update last login
          await supabaseAdmin
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('email', email.toLowerCase())

          return res.status(200).json({
            success: true,
            user: {
              email: tempProfile.email,
              name: tempProfile.full_name || tempProfile.email,
              role: tempProfile.role,
              department: tempProfile.department,
              id: tempProfile.id,
              hasTemporaryPassword: true // Flag to indicate they should change password
            },
            source: 'temp_password',
            message: 'Login successful with temporary password. Please change your password.'
          })
        } else {
          console.log('❌ Temporary password does not match')
        }
      } else {
        console.log('ℹ️  No temporary password found, trying Supabase Auth...')
      }

      // SECOND: Try Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      })

      if (!authError && authData.user) {
        console.log('✅ Supabase Auth login successful')
        
        // Get user profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (!profileError && profile) {
          // Update last login
          await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', authData.user.id)

          return res.status(200).json({
            success: true,
            user: {
              email: profile.email,
              name: profile.full_name || profile.email,
              role: profile.role,
              department: profile.department,
              id: profile.id
            },
            source: 'supabase'
          })
        }
      } else {
        console.log('❌ Supabase Auth failed:', authError?.message)
      }

      // THIRD: Try hardcoded users (fallback)
      console.log('🔍 Checking hardcoded users...')
      const user = USERS[email.toLowerCase() as keyof typeof USERS]
      
      if (user && user.password === password) {
        console.log('✅ Hardcoded user login successful')
        
        return res.status(200).json({
          success: true,
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department
          },
          source: 'hardcoded'
        })
      }

      console.log('❌ All authentication methods failed')
      return res.status(401).json({ error: 'Invalid login credentials' })

    } catch (error) {
      console.error('❌ Authentication error:', error)
      return res.status(500).json({ error: 'Authentication failed' })
    }
  }

  // Password-only authentication (legacy)
  const SITE_PASSWORD = process.env.SITE_PASSWORD || 'moniteye2024'
  
  if (password === SITE_PASSWORD) {
    return res.status(200).json({
      success: true,
      source: 'password'
    })
  }

  return res.status(401).json({ error: 'Invalid password' })
} 