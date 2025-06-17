import { useState, useEffect } from 'react'
// Temporarily removed useAuth since AuthProvider is disabled
// import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

interface User {
  email: string
  name: string
  role: string
  department: string
  created: string
  isActive: boolean
  lastLogin: string | null
}

export default function Users() {
  // Temporarily removed auth check since AuthProvider is disabled
  // const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'employee',
    department: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)
  const [manualUserData, setManualUserData] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ User ${newUser.email} created successfully!`)
        if (data.user?.tempPassword) {
          setMessage(prev => prev + `\n\n🔑 Temporary Password: ${data.user.tempPassword}`)
        }
        setMessage(prev => prev + '\n\n📋 User can now login with their email and temporary password.')
        setNewUser({ email: '', name: '', role: 'employee', department: '' })
        fetchUsers()
      } else {
        setError(`❌ ${data.error || 'Failed to create user'}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setError('❌ Network error creating user')
    } finally {
      setCreating(false)
    }
  }

  // Temporarily disabled admin check since useAuth is disabled
  // if (!user || user.role !== 'admin') {
  //   return (
  //     <Layout>
  //       <div className="min-h-screen bg-gray-50 py-12 px-4">
  //         <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
  //           <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
  //           <p className="text-gray-600">You need admin privileges to access user management.</p>
  //         </div>
  //       </div>
  //     </Layout>
  //   )
  // }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>
            
            {/* Create User Form */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New User</h2>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {creating ? 'Creating User...' : 'Create User'}
                </button>
              </form>
              
              {message && (
                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded whitespace-pre-line">
                  {message}
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
                  {error}
                </div>
              )}
            </div>

            {/* Manual Creation Instructions */}
            <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Manual User Creation (Alternative)</h3>
              <p className="text-sm text-gray-700 mb-3">
                If automatic creation fails, you can create users manually in Supabase:
              </p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Go to <strong>Supabase Dashboard → Authentication → Users</strong></li>
                <li>Click "Create new user"</li>
                <li>Enter email and password</li>
                <li>Go to <strong>Database → profiles table</strong></li>
                <li>Click "Insert row" and fill in:
                  <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                    <li><code>id</code>: Copy from auth.users table</li>
                    <li><code>email</code>: Same as auth user</li>
                    <li><code>full_name</code>: User's full name</li>
                    <li><code>role</code>: admin, manager, employee, or guest</li>
                    <li><code>department</code>: Optional department</li>
                    <li><code>is_active</code>: true</li>
                  </ul>
                </li>
              </ol>
            </div>
            
            {/* Users List */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Users</h2>
              
              {loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'employee' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.department || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {users.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 