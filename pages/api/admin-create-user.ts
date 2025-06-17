import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'
import { randomUUID } from 'crypto'

// Generate a secure random password
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name, role = 'employee', department } = req.body

  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Email, name, and role are required' })
  }

  try {
    console.log('🚀 Creating temp password user in database...')
    
    // Check if user already exists in profiles table
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Generate user data
    const userId = randomUUID() // Use proper UUID
    const password = generatePassword()
    const now = new Date().toISOString()

    console.log('👤 Generated user ID:', userId)
    console.log('🔐 Generated password:', password)

    // Create user directly in profiles table (standalone, no auth.users dependency)
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          email: email.toLowerCase(),
          full_name: name,
          role: role,
          department: department || null,
          is_active: true,
          is_temp_user: true, // Mark as temporary user
          created_at: now,
          updated_at: now,
          temp_password: password // Store temporarily for the user
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('❌ Database error:', createError)
      return res.status(500).json({ 
        error: 'Failed to create user in database',
        details: createError.message 
      })
    }

    console.log('✅ Temp password user created successfully!')

    return res.status(201).json({
      success: true,
      message: 'Temp password user created successfully!',
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name,
        role: role,
        department: department,
        tempPassword: password,
        isTemporaryUser: true
      },
      instructions: [
        '1. User has been created as a temporary password user',
        '2. They can login immediately with email + temporary password',
        '3. No Supabase Auth account needed initially',
        '4. User can upgrade to permanent password later',
        '5. Send these credentials securely to the user'
      ],
      credentials: {
        email: email.toLowerCase(),
        password: password,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return res.status(500).json({ 
      error: 'Unexpected error creating user',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 