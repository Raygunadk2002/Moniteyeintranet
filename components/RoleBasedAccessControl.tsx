import React, { useState, useEffect } from 'react';

interface RoleBasedAccessControlProps {
  children: React.ReactNode;
  moduleName: string;
  requiredRole: 'admin' | 'manager' | 'employee' | 'guest';
  allowAdminOverride?: boolean; // Allow admin password override for lower roles
}

interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee' | 'guest';
  department: string;
}

export default function RoleBasedAccessControl({ 
  children, 
  moduleName, 
  requiredRole,
  allowAdminOverride = true 
}: RoleBasedAccessControlProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdminOverride, setIsAdminOverride] = useState(false);

  // Role hierarchy for access checking
  const roleHierarchy = { guest: 0, employee: 1, manager: 2, admin: 3 };

  // Check user role and admin override authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get current user data
      const userData = localStorage.getItem('moniteye-user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Check if user has required role or higher
          const userLevel = roleHierarchy[parsedUser.role as keyof typeof roleHierarchy];
          const requiredLevel = roleHierarchy[requiredRole];
          
          if (userLevel >= requiredLevel) {
            setHasAccess(true);
            return;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      // For users without sufficient role, check admin override if allowed
      if (allowAdminOverride) {
        const adminAuth = localStorage.getItem('admin-authenticated');
        const authTimestamp = localStorage.getItem('admin-auth-timestamp');
        
        if (adminAuth === 'true' && authTimestamp) {
          const authTime = parseInt(authTimestamp);
          const currentTime = Date.now();
          const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
          
          if (currentTime - authTime < fourHours) {
            setHasAccess(true);
            setIsAdminOverride(true);
          } else {
            // Admin session expired
            localStorage.removeItem('admin-authenticated');
            localStorage.removeItem('admin-auth-timestamp');
          }
        }
      }
    }
  }, [requiredRole, allowAdminOverride]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setHasAccess(true);
        setIsAdminOverride(true);
        setShowPasswordPrompt(false);
        setPassword('');
        
        // Store admin authentication with timestamp
        localStorage.setItem('admin-authenticated', 'true');
        localStorage.setItem('admin-auth-timestamp', Date.now().toString());
      } else {
        setError(data.error || 'Invalid admin password');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = () => {
    setShowPasswordPrompt(true);
    setError('');
  };

  const handleLogout = () => {
    setHasAccess(false);
    setIsAdminOverride(false);
    setShowPasswordPrompt(false);
    setPassword('');
    localStorage.removeItem('admin-authenticated');
    localStorage.removeItem('admin-auth-timestamp');
  };

  // Get access type display
  const getAccessType = () => {
    if (!user) return 'Unknown';
    
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy];
    const requiredLevel = roleHierarchy[requiredRole];
    
    if (userLevel >= requiredLevel) {
      return 'Role-based';
    } else if (isAdminOverride) {
      return 'Admin override';
    }
    return 'Unauthorized';
  };

  // If user has access, show the protected content
  if (hasAccess) {
    return (
      <div>
        {/* Access status indicator */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-green-600 text-sm">
                {getAccessType() === 'Role-based' ? (
                  <>🔓 Access granted: {user?.role} level for {moduleName}</>
                ) : (
                  <>🔐 Admin override active for {moduleName}</>
                )}
              </span>
            </div>
            {isAdminOverride && (
              <button
                onClick={handleLogout}
                className="text-green-700 hover:text-green-900 text-sm font-medium"
              >
                End Override
              </button>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Show password prompt if requested
  if (showPasswordPrompt && allowAdminOverride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">🔐</span>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Admin Override Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the admin password to override access restrictions for {moduleName}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
            <div>
              <label htmlFor="admin-password" className="sr-only">
                Admin Password
              </label>
              <input
                id="admin-password"
                name="admin-password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowPasswordPrompt(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Grant Access'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show access denied screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {moduleName} requires {requiredRole} level access or higher.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Requirements</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Required Role:</span>
              <span className="font-medium capitalize">{requiredRole}</span>
            </div>
            <div className="flex justify-between">
              <span>Your Role:</span>
              <span className="font-medium capitalize">{user?.role || 'Unknown'}</span>
            </div>
          </div>
          
          {allowAdminOverride && (
            <>
              <hr className="my-4" />
              <button
                onClick={handleRequestAccess}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                🔐 Request Admin Override
              </button>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>Contact your system administrator if you need elevated access.</p>
          {allowAdminOverride && <p>Admin overrides expire after 4 hours for security.</p>}
        </div>
      </div>
    </div>
  );
} 