import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type UserRole = 'admin' | 'manager' | 'employee' | 'guest'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  department: string | null
  avatar_url: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

// Client-side auth utilities
export const getSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side auth utilities  
export const getSupabaseServer = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Get current user profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const supabase = getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null
  return profile as UserProfile
}

// Check if user has specific role
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    employee: 1,
    manager: 2,
    admin: 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Check if user is admin
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'admin'
}

// Check if user is manager or admin
export const isManagerOrAdmin = (userRole: UserRole): boolean => {
  return userRole === 'manager' || userRole === 'admin'
}

// Update user's last login
export const updateLastLogin = async (userId: string) => {
  const supabase = getSupabaseClient()
  
  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId)
}

// Get all users (admin only)
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const supabase = getSupabaseClient()
  
  const { data: users, error } = await supabase
    .from('user_management')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return users as UserProfile[]
}

// Update user role (admin only)
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  return !error
}

// Create user profile (used by signup)
export const createUserProfile = async (
  userId: string, 
  email: string, 
  fullName?: string
): Promise<boolean> => {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName || email,
      role: 'employee' // Default role
    })

  return !error
}

// Update user profile
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<UserProfile>
): Promise<boolean> => {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  return !error
}

// Sign out user
export const signOut = async (): Promise<void> => {
  const supabase = getSupabaseClient()
  await supabase.auth.signOut()
}

// Role-based route protection
export const getRequiredRole = (pathname: string): UserRole | null => {
  // Define route access requirements
  const routeRoles: Record<string, UserRole> = {
    '/admin': 'admin',
    '/business-ideas': 'manager',
    '/user-management': 'admin',
    '/tasks': 'employee',
    '/equipment': 'employee',
    '/calendar': 'employee',
    '/': 'guest'
  }

  // Check for exact matches first
  if (routeRoles[pathname]) {
    return routeRoles[pathname]
  }

  // Check for path prefixes
  for (const [route, role] of Object.entries(routeRoles)) {
    if (pathname.startsWith(route + '/')) {
      return role
    }
  }

  // Default to employee access for unknown routes
  return 'employee'
} 