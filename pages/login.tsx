import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'password' | 'user'>('user')
  const router = useRouter()

  // Check if already authenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('moniteye-auth='))
      
      if (authCookie && authCookie.split('=')[1] === 'authenticated') {
        router.push('/')
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          email: authMode === 'user' ? email : undefined
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Set authentication cookie
        document.cookie = 'moniteye-auth=authenticated; path=/; max-age=86400'
        
        // Store user data if available
        if (data.user) {
          localStorage.setItem('moniteye-user', JSON.stringify(data.user))
          
          // Show temporary password warning if applicable
          if (data.user.hasTemporaryPassword) {
            // You might want to redirect to password change page or show a modal
            console.log('User has temporary password - consider prompting for change')
          }
        } else {
          // Clear any existing user data for password-only auth
          localStorage.removeItem('moniteye-user')
        }

        // Redirect to dashboard
        router.push('/')
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Moniteye Intranet</h1>
          <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
        </div>

        {/* Authentication Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setAuthMode('user')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'user'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User Account
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'password'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quick Access
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {authMode === 'user' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="you@moniteye.co.uk"
                required={authMode === 'user'}
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {authMode === 'password' ? 'Access Code' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={authMode === 'password' ? 'Enter access code' : 'Enter your password'}
              required
              autoComplete={authMode === 'user' ? 'current-password' : 'off'}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {authMode === 'password' ? (
            <p>Use the quick access code for immediate entry.</p>
          ) : (
            <div>
              <p>Sign in with your individual user account.</p>
              <p className="mt-1">
                Don't have an account? Contact your administrator.
              </p>
            </div>
          )}
        </div>

        {/* Info Box - More Secure */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">🔐 Account Information:</h3>
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>New Users:</strong> Use credentials provided by your admin</p>
            <p><strong>Existing Users:</strong> Use your email and password to sign in</p>
            <p><strong>Need Help?</strong> Contact your system administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
} 