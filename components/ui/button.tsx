import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  size = 'md', 
  variant = 'primary',
  className = "" 
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={`
        rounded font-medium transition-colors flex items-center justify-center
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${className}
      `}
    >
      {children}
    </button>
  );
} 