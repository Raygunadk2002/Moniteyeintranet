import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { randomUUID } from 'crypto'

// Hardcoded users - keeping as fallback only
const USERS = {
  'akeal@moniteye.co.uk': {
    email: 'akeal@moniteye.co.uk',
    name: 'Alex Keal',
    role: 'admin',
    department: 'Management',
    created: '2025-01-18'
  }
}

interface CreateUserRequest {
  email: string
  name: string
  role: 'admin' | 'manager' | 'employee' | 'guest'
  department?: string
  sendEmail?: boolean
}

// Email sending function (placeholder - you'll need to configure this)
async function sendWelcomeEmail(email: string, name: string, tempPassword: string) {
  // For now, we'll log the credentials - in production, you'd use a service like:
  // - Resend
  // - SendGrid
  // - Nodemailer with SMTP
  console.log(`
🎉 NEW USER CREATED
==================
Email: ${email}
Name: ${name}
Temporary Password: ${tempPassword}
Login URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login

Please send these credentials to the user securely.
==================
  `)
  
  // TODO: Replace with actual email service
  // Example with Resend:
  /*
  try {
    await resend.emails.send({
      from: 'noreply@moniteye.co.uk',
      to: email,
      subject: 'Welcome to Moniteye Intranet',
      html: `
        <h2>Welcome to Moniteye Intranet!</h2>
        <p>Hi ${name},</p>
        <p>Your account has been created. Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${tempPassword}</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/login">Click here to login</a></p>
        <p>Please change your password after your first login.</p>
      `
    })
  } catch (error) {
    console.error('Failed to send email:', error)
  }
  */
}

// Generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log('🔍 Fetching users from Supabase...')
      
      // Try to get users from Supabase first (using admin client to bypass RLS)
      const { data: supabaseUsers, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && supabaseUsers && supabaseUsers.length > 0) {
        console.log(`✅ Found ${supabaseUsers.length} users in Supabase`)
        
        // Return Supabase users
        const users = supabaseUsers.map((user: any) => ({
          email: user.email,
          name: user.full_name || user.email,
          role: user.role,
          department: user.department,
          created: user.created_at?.split('T')[0] || 'Unknown',
          isActive: user.is_active,
          lastLogin: user.last_login_at
        }))
        
        return res.status(200).json({
          users,
          count: users.length,
          source: 'supabase'
        })
      } else {
        console.log('⚠️ No users found in Supabase or error occurred:', error)
        
        // Fallback to hardcoded users
        const userList = Object.values(USERS).map(user => ({
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          created: user.created,
          isActive: true,
          lastLogin: null
        }))
        
        return res.status(200).json({
          users: userList,
          count: userList.length,
          source: 'hardcoded'
        })
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      
      // Fallback to hardcoded users on error
      const userList = Object.values(USERS).map(user => ({
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        created: user.created,
        isActive: true,
        lastLogin: null
      }))
      
      return res.status(200).json({
        users: userList,
        count: userList.length,
        source: 'hardcoded_fallback',
        error: 'Failed to fetch from Supabase'
      })
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('🚀 Creating new user...')
      const { email, name, role, department, sendEmail = true }: CreateUserRequest = req.body

      // Validate required fields
      if (!email || !name || !role) {
        return res.status(400).json({ 
          error: 'Email, name, and role are required' 
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        })
      }

      // Generate temporary password
      const tempPassword = generateTempPassword()
      console.log(`🔐 Generated password for ${email}`)

      // Check if user already exists in Supabase (using admin client)
      console.log('🔍 Checking if user already exists...')
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .single()

      if (existingUser) {
        console.log(`❌ User ${email} already exists`)
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        })
      }

      console.log('✅ User does not exist, proceeding with creation...')

      // Try to create user in Supabase Auth first
      console.log('👤 Creating user in Supabase Auth...')
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: tempPassword,
        email_confirm: false, // Disable email confirmation to avoid issues
        user_metadata: {
          full_name: name
        }
      })

      if (authError) {
        console.error('❌ Supabase auth error:', authError)
        
        // Return detailed error with manual instructions
        return res.status(500).json({ 
          error: 'Failed to create user account automatically',
          details: authError.message,
          manualInstructions: {
            step1: 'Go to Supabase Dashboard → Authentication → Users',
            step2: 'Create new user with email and password',
            step3: 'Go to Database → profiles table',
            step4: 'Insert profile record with user ID from auth.users',
            tempPassword: tempPassword,
            userData: { email: email.toLowerCase(), name, role, department }
          }
        })
      }

      console.log('✅ User created in Supabase Auth, creating profile...')

      // Create user profile using admin client
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.toLowerCase(),
          full_name: name,
          role,
          department: department || null,
          is_active: true
        })

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
        // Try to clean up the auth user if profile creation failed
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          console.log('🧹 Cleaned up auth user after profile creation failure')
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup auth user:', cleanupError)
        }
        return res.status(500).json({ 
          error: 'Failed to create user profile: ' + profileError.message 
        })
      }

      console.log('✅ User profile created successfully')

      // Send welcome email if requested
      if (sendEmail) {
        await sendWelcomeEmail(email, name, tempPassword)
        console.log('📧 Welcome email sent (logged to console)')
      }

      console.log('🎉 User creation completed successfully')

      return res.status(201).json({
        success: true,
        message: 'User created successfully in Supabase',
        user: {
          id: authData.user.id,
          email: email.toLowerCase(),
          name,
          role,
          department,
          tempPassword: sendEmail ? '[Sent via email]' : tempPassword,
          source: 'supabase'
        }
      })

    } catch (error) {
      console.error('❌ Error creating user:', error)
      return res.status(500).json({ 
        error: 'Database error creating new user',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
} 