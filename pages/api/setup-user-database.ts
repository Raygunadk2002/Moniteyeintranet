import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 Setting up user database schema...')

    // Check if profiles table exists
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')

    if (!tableError && tables && tables.length > 0) {
      console.log('✅ Profiles table already exists')
      
      // Check if your admin user exists
      const { data: adminUser } = await supabaseAdmin
        .from('profiles')
        .select('email, role')
        .eq('email', 'akeal@moniteye.co.uk')
        .single()

      return res.status(200).json({
        success: true,
        message: 'User database is already set up',
        profilesTableExists: true,
        adminUserExists: !!adminUser,
        adminUserRole: adminUser?.role || null
      })
    }

    console.log('📋 Creating profiles table...')

    // Create profiles table
    const { error: createTableError } = await supabaseAdmin.rpc('exec', {
      sql: `
        -- Create profiles table for additional user data
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          role TEXT CHECK (role IN ('admin', 'manager', 'employee', 'guest')) DEFAULT 'employee',
          department TEXT,
          avatar_url TEXT,
          is_active BOOLEAN DEFAULT true,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    })

    if (createTableError) {
      console.log('⚠️ Could not use rpc exec, trying direct table creation...')
      
      // If rpc doesn't work, let's try a simpler approach
      // We'll create the admin user directly and let Supabase handle the rest
      console.log('🔐 Creating admin auth user...')
      
      // Check if admin user already exists in auth.users
      const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
      const adminAuthUser = existingAuthUser.users?.find(u => u.email === 'akeal@moniteye.co.uk')

      let adminUserId: string

      if (adminAuthUser) {
        console.log('✅ Admin auth user already exists')
        adminUserId = adminAuthUser.id
      } else {
        console.log('🔐 Creating admin auth user...')
        // Create admin user in auth
        const { data: newAdminUser, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: 'akeal@moniteye.co.uk',
          password: 'moniteye2024',
          email_confirm: true,
          user_metadata: {
            full_name: 'Alex Keal'
          }
        })

        if (adminAuthError) {
          console.error('❌ Error creating admin auth user:', adminAuthError)
          return res.status(500).json({
            success: false,
            error: 'Failed to create admin auth user: ' + adminAuthError.message,
            suggestion: 'Please create the profiles table manually in Supabase SQL Editor'
          })
        }

        adminUserId = newAdminUser.user.id
        console.log('✅ Admin auth user created')
      }

      // Try to create profile directly
      console.log('👤 Creating admin profile...')
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: adminUserId,
          email: 'akeal@moniteye.co.uk',
          full_name: 'Alex Keal',
          role: 'admin',
          department: 'Management',
          is_active: true
        })

      if (profileError) {
        console.error('❌ Error creating admin profile:', profileError)
        return res.status(500).json({
          success: false,
          error: 'Failed to create admin profile. The profiles table may not exist.',
          suggestion: 'Please run the SQL migration manually in Supabase',
          sqlToRun: `
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'employee', 'guest')) DEFAULT 'employee',
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert your admin profile
INSERT INTO profiles (id, email, full_name, role, department, is_active)
VALUES ('${adminUserId}', 'akeal@moniteye.co.uk', 'Alex Keal', 'admin', 'Management', true)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
          `
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Admin user created successfully. Profile table may need manual setup.',
        profilesTableCreated: false,
        adminUserCreated: true,
        adminCredentials: {
          email: 'akeal@moniteye.co.uk',
          password: 'moniteye2024'
        },
        note: 'If user creation fails, you may need to create the profiles table manually in Supabase SQL Editor'
      })
    }

    console.log('✅ Database schema created successfully')

    // Now create your admin profile if you don't already have a user account
    console.log('👤 Creating admin profile...')
    
    // First check if admin user already exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const adminAuthUser = existingAuthUser.users?.find(u => u.email === 'akeal@moniteye.co.uk')

    let adminUserId: string

    if (adminAuthUser) {
      console.log('✅ Admin auth user already exists')
      adminUserId = adminAuthUser.id
    } else {
      console.log('🔐 Creating admin auth user...')
      // Create admin user in auth
      const { data: newAdminUser, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: 'akeal@moniteye.co.uk',
        password: 'moniteye2024',
        email_confirm: true,
        user_metadata: {
          full_name: 'Alex Keal'
        }
      })

      if (adminAuthError) {
        console.error('❌ Error creating admin auth user:', adminAuthError)
        return res.status(500).json({
          success: false,
          error: 'Failed to create admin auth user: ' + adminAuthError.message
        })
      }

      adminUserId = newAdminUser.user.id
      console.log('✅ Admin auth user created')
    }

    // Create or update admin profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUserId,
        email: 'akeal@moniteye.co.uk',
        full_name: 'Alex Keal',
        role: 'admin',
        department: 'Management',
        is_active: true
      })

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError)
      return res.status(500).json({
        success: false,
        error: 'Failed to create admin profile: ' + profileError.message
      })
    }

    console.log('🎉 User database setup completed successfully!')

    return res.status(200).json({
      success: true,
      message: 'User database set up successfully',
      profilesTableCreated: true,
      adminUserCreated: true,
      adminCredentials: {
        email: 'akeal@moniteye.co.uk',
        password: 'moniteye2024'
      }
    })

  } catch (error) {
    console.error('❌ Setup error:', error)
    return res.status(500).json({
      success: false,
      error: 'Setup failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      suggestion: 'You may need to create the profiles table manually in Supabase SQL Editor'
    })
  }
} 