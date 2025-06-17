import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
}

interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee' | 'guest';
  department: string;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Load user info from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('moniteye-user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  const baseNavigation = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Tasks", href: "/tasks", icon: "📋" },
    { name: "Equipment", href: "/equipment", icon: "📊" },
    { name: "Calendar", href: "/calendar", icon: "📅" },
    { name: "About", href: "/about", icon: "ℹ️" },
  ];

  const adminNavigation = [
    { name: "Business Ideas", href: "/business-ideas", icon: "💡", requiredRole: 'manager' },
    { name: "Users", href: "/users", icon: "👥", requiredRole: 'admin' },
    { name: "Admin", href: "/admin", icon: "⚙️", requiredRole: 'admin' },
  ];

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    if (!user) return [...baseNavigation, ...adminNavigation]; // Show all if no user (old system)
    
    const roleHierarchy = { guest: 0, employee: 1, manager: 2, admin: 3 };
    const userLevel = roleHierarchy[user.role];
    
    const filteredAdmin = adminNavigation.filter(item => {
      const requiredLevel = roleHierarchy[item.requiredRole as keyof typeof roleHierarchy];
      return userLevel >= requiredLevel;
    });
    
    return [...baseNavigation, ...filteredAdmin];
  };

  const navigation = getFilteredNavigation();

  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  };

  const handleLogout = () => {
    // Clear authentication
    document.cookie = 'moniteye-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('moniteye-user');
    setUser(null);
    router.push('/login');
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
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {user.name}
                  </p>
                  <p className="text-gray-400 text-xs capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-xs p-1 rounded hover:bg-gray-700"
                title="Sign Out"
              >
                🚪
              </button>
            </div>
          ) : (
            <div className="text-center">
              <a
                href="/login"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                🔑 Login
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
} 