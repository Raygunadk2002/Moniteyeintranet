import React from "react";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Tasks", href: "/tasks", icon: "📋" },
    { name: "Calendar", href: "/calendar", icon: "📅" },
    { name: "Admin", href: "/admin", icon: "⚙️" },
    { name: "About", href: "/about", icon: "ℹ️" },
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
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">AK</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Alex Keal</p>
              <p className="text-gray-400 text-xs">Admin</p>
            </div>
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