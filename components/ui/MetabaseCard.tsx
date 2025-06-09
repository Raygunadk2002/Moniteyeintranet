import React from 'react';

interface MetabaseCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function MetabaseCard({ 
  title, 
  subtitle, 
  children, 
  actions, 
  className = '', 
  noPadding = false 
}: MetabaseCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  trend?: number[];
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  trend 
}: StatsCardProps) {
  const getChangeStyle = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return '↗️';
      case 'negative':
        return '↘️';
      default:
        return '→';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            {icon && (
              <div className="p-2 bg-blue-50 rounded-lg">
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeStyle()}`}>
                <span className="mr-1">{getChangeIcon()}</span>
                {change}
              </div>
            )}
          </div>
        </div>
        {trend && (
          <div className="ml-4">
            <svg width="80" height="40" className="text-blue-500">
              <polyline
                points={trend
                  .map((value, index) => `${(index / (trend.length - 1)) * 80},${40 - (value / Math.max(...trend)) * 40}`)
                  .join(' ')}
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  className = '' 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
} 