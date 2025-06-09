import React from 'react';

interface ChartProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Chart({ title, subtitle, children, actions, className = '' }: ChartProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
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
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color = 'blue' 
}: MetricCardProps) {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase': return 'text-green-600 bg-green-50';
      case 'decrease': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}>
            <span className="text-xl">{icon}</span>
          </div>
        )}
        {change && (
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${getChangeColor(changeType)}`}>
            {getChangeIcon(changeType)} {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
}

export function ProgressBar({ 
  label, 
  value, 
  max = 100, 
  color = '#3B82F6', 
  showValue = true 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showValue && (
          <span className="text-sm text-gray-600">{value}{max === 100 ? '%' : `/${max}`}</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
} 