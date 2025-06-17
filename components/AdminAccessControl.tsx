import React, { useState, useEffect } from 'react';

interface AdminAccessControlProps {
  children: React.ReactNode;
  moduleName: string;
}

export default function AdminAccessControl({ children, moduleName }: AdminAccessControlProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if admin is already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin-authenticated');
    const authTimestamp = localStorage.getItem('admin-auth-timestamp');
    
    if (adminAuth === 'true' && authTimestamp) {
      const authTime = parseInt(authTimestamp);
      const currentTime = Date.now();
      const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
      
      if (currentTime - authTime < fourHours) {
        setIsAdminAuthenticated(true);
      } else {
        // Admin session expired
        localStorage.removeItem('admin-authenticated');
        localStorage.removeItem('admin-auth-timestamp');
      }
    }
  }, []);

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
        setIsAdminAuthenticated(true);
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
    setIsAdminAuthenticated(false);
    setShowPasswordPrompt(false);
    setPassword('');
    localStorage.removeItem('admin-authenticated');
    localStorage.removeItem('admin-auth-timestamp');
  };

  // If admin is authenticated, show the protected content
  if (isAdminAuthenticated) {
    return (
      <div>
        {/* Admin logout option */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-amber-600 text-sm">
                🔐 Admin access active for {moduleName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-amber-700 hover:text-amber-900 text-sm font-medium"
            >
              Logout Admin
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Show password prompt if requested
  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">🔐</span>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Admin Access Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the master admin password to access {moduleName}
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
                  'Access Admin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show access request screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Restricted Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {moduleName} requires master admin privileges to access.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Module</h3>
          <p className="text-sm text-gray-600 mb-4">
            This module contains sensitive business and administrative functions that require elevated permissions.
          </p>
          <button
            onClick={handleRequestAccess}
            className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            🔐 Request Admin Access
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Admin sessions expire after 4 hours for security.</p>
          <p>Contact your system administrator if you need access.</p>
        </div>
      </div>
    </div>
  );
} 