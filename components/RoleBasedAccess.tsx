import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserRole, hasRole } from '../lib/auth'

interface RoleBasedAccessProps {
  children: React.ReactNode
  requiredRole: UserRole
  moduleName: string
  fallbackMessage?: string
}

export default function RoleBasedAccess({ 
  children, 
  requiredRole, 
  moduleName, 
  fallbackMessage 
}: RoleBasedAccessProps) {
  const { user, profile, loading } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // User not authenticated
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">🔐</span>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please sign in to access {moduleName}
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Secure Access</h3>
            <p className="text-sm text-blue-700 mb-4">
              This module requires user authentication to ensure data security and proper access control.
            </p>
            <a
              href="/auth/login"
              className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-block text-center"
            >
              🔑 Sign In
            </a>
          </div>

          <div className="text-xs text-gray-500">
            <p>New to the team? Contact your administrator for an account.</p>
          </div>
        </div>
      </div>
    )
  }

  // User doesn't have required role
  if (!hasRole(profile.role, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-20 w-20 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">⚠️</span>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Insufficient Permissions
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {fallbackMessage || `Your role (${profile.role}) doesn't have access to ${moduleName}`}
            </p>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
            <h3 className="text-lg font-medium text-amber-900 mb-2">Access Requirements</h3>
            <div className="text-sm text-amber-800 space-y-2">
              <p><strong>Required Role:</strong> {requiredRole} or higher</p>
              <p><strong>Your Role:</strong> {profile.role}</p>
              <p><strong>Your Access:</strong> {getAccessDescription(profile.role)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">👥 Role Hierarchy</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div className={`${profile.role === 'admin' ? 'font-bold text-green-600' : ''}`}>
                🔑 <strong>Admin:</strong> Full system access
              </div>
              <div className={`${profile.role === 'manager' ? 'font-bold text-green-600' : ''}`}>
                📊 <strong>Manager:</strong> Business tools + team management
              </div>
              <div className={`${profile.role === 'employee' ? 'font-bold text-green-600' : ''}`}>
                👤 <strong>Employee:</strong> Standard access to tasks & tools
              </div>
              <div className={`${profile.role === 'guest' ? 'font-bold text-green-600' : ''}`}>
                👁️ <strong>Guest:</strong> Read-only dashboard access
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              ← Go Back
            </button>
          </div>

          <div className="text-xs text-gray-500">
            <p>Need higher access? Contact your administrator to request a role change.</p>
          </div>
        </div>
      </div>
    )
  }

  // User has access - show the content with role indicator
  return (
    <div>
      {/* Role indicator for privileged access */}
      {(requiredRole === 'admin' || requiredRole === 'manager') && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 text-sm">
                {getRoleIcon(profile.role)} {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} access to {moduleName}
              </span>
              <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded">
                {profile.full_name || profile.email}
              </span>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

// Helper functions
function getAccessDescription(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Full system administration'
    case 'manager':
      return 'Business tools and team management'
    case 'employee':
      return 'Standard tools and features'
    case 'guest':
      return 'Read-only dashboard access'
    default:
      return 'Limited access'
  }
}

function getRoleIcon(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '🔑'
    case 'manager':
      return '📊'
    case 'employee':
      return '👤'
    case 'guest':
      return '👁️'
    default:
      return '❓'
  }
} 