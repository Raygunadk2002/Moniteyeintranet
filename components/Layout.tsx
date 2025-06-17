import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check admin authentication status
  useEffect(() => {
    const checkAdminAuth = () => {
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
          setIsAdminAuthenticated(false);
        }
      } else {
        setIsAdminAuthenticated(false);
      }
    };

    checkAdminAuth();
    
    // Check every minute for session expiry
    const interval = setInterval(checkAdminAuth, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const baseNavigation = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Tasks", href: "/tasks", icon: "📋" },
    { name: "Equipment", href: "/equipment", icon: "📊" },
    { name: "Calendar", href: "/calendar", icon: "📅" },
    { name: "About", href: "/about", icon: "ℹ️" },
  ];

  const adminNavigation = [
    { name: "Business Ideas", href: "/business-ideas", icon: "💡", adminOnly: true },
    { name: "Admin", href: "/admin", icon: "⚙️", adminOnly: true },
  ];

  const navigation = [
    ...baseNavigation,
    ...(isAdminAuthenticated ? adminNavigation : [])
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Moniteye</h1>
          <p className="text-gray-400 text-sm mt-1">Intranet Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">AK</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Alex Keal</p>
                <p className="text-gray-400 text-xs">Admin</p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  document.cookie = 'moniteye-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict';
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }}
              className="text-gray-400 hover:text-white text-xs p-1 rounded hover:bg-gray-700"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
} 