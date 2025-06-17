import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseClient, UserRole } from '../lib/auth'

interface Invitation {
  id: string
  email: string
  role: UserRole
  department: string | null
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export default function UserInvitationManager() {
  const { profile } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('employee')
  const [newDepartment, setNewDepartment] = useState('')

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadInvitations()
    }
  }, [profile])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Failed to load invitations')
        console.error('Error loading invitations:', error)
      } else {
        setInvitations(data || [])
      }
    } catch (error) {
      setError('Failed to load invitations')
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
          department: newDepartment || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Invitation created! Share this link: ${data.invite_url}`)
        setNewEmail('')
        setNewRole('employee')
        setNewDepartment('')
        loadInvitations() // Refresh the list
      } else {
        setError(data.error || 'Failed to create invitation')
      }
    } catch (error) {
      setError('Failed to create invitation')
      console.error('Error creating invitation:', error)
    } finally {
      setCreating(false)
    }
  }

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/auth/login?invite=${token}`
    navigator.clipboard.writeText(inviteUrl)
    setSuccess('Invite link copied to clipboard!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.used_at) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Used</span>
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date()
    if (isExpired) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Expired</span>
    }
    
    return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Active</span>
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">Admin access required to manage user invitations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Invitation Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          👥 Invite New Team Member
        </h3>
        
        <form onSubmit={createInvitation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="colleague@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <option value="guest">Guest (Read-only)</option>
                <option value="employee">Employee (Standard access)</option>
                <option value="manager">Manager (Business tools)</option>
                <option value="admin">Admin (Full access)</option>
              </select>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department (Optional)
              </label>
              <input
                type="text"
                id="department"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Engineering, Sales, etc."
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating Invitation...' : 'Create Invitation'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            📧 Pending Invitations
          </h3>
          <button
            onClick={loadInvitations}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No invitations yet. Create one above to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invitation.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {invitation.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invitation.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invitation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {!invitation.used_at && new Date(invitation.expires_at) > new Date() && (
                        <button
                          onClick={() => copyInviteLink(invitation.token)}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Create invitations for specific email addresses</li>
          <li>• Share the invitation link with your colleague</li>
          <li>• They can only sign up using the invited email</li>
          <li>• Their role is automatically assigned based on the invitation</li>
          <li>• Invitations expire after 7 days for security</li>
        </ul>
      </div>
    </div>
  )
} 