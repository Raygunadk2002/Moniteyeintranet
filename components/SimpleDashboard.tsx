import { useEffect, useState, useCallback } from 'react';
import { Card } from './ui/card';

interface DashboardMetric {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  count?: number;
}

interface RevenueTimeSeriesData {
  month: string;
  revenue: number;
  timestamp: string;
}

export default function SimpleDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([45, 52, 48, 67, 73, 81, 94, 87, 95, 102, 89, 124]); // Default fallback
  const [revenueTimeSeriesData, setRevenueTimeSeriesData] = useState<RevenueTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    // Fetch real dashboard data from API
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard-metrics');
        const data = await response.json();
        
        if (data.metrics) {
          setMetrics([
            {
              title: 'Total Revenue',
              value: data.metrics.totalRevenue.value,
              change: data.metrics.totalRevenue.change,
              changeType: data.metrics.totalRevenue.changeType as any,
              icon: '💰'
            },
            {
              title: 'Active Users',
              value: data.metrics.activeUsers.value,
              change: data.metrics.activeUsers.change,
              changeType: data.metrics.activeUsers.changeType as any,
              icon: '👥'
            },
            {
              title: 'New Deals (30d)',
              value: data.metrics.newDeals.value,
              change: data.metrics.newDeals.change,
              changeType: data.metrics.newDeals.changeType as any,
              icon: '🤝'
            },
            {
              title: 'Deals Value (30d)',
              value: data.metrics.dealsValue.value,
              change: data.metrics.dealsValue.change,
              changeType: data.metrics.dealsValue.changeType as any,
              icon: '💼'
            },
            {
              title: 'Open Tasks',
              value: data.metrics.openTasks.value,
              change: data.metrics.openTasks.change,
              changeType: data.metrics.openTasks.changeType as any,
              icon: '✅'
            },
            {
              title: 'Team Holidays (14d)',
              value: data.metrics.teamHolidays.value,
              change: data.metrics.teamHolidays.change,
              changeType: data.metrics.teamHolidays.changeType as any,
              icon: '🏖️'
            },
            {
              title: '3M Avg Revenue',
              value: data.metrics.sixMonthAverage.value,
              change: data.metrics.sixMonthAverage.change,
              changeType: data.metrics.sixMonthAverage.changeType as any,
              icon: '📊'
            },
            {
              title: '12M Total Revenue',
              value: data.metrics.twelveMonthTotal.value,
              change: data.metrics.twelveMonthTotal.change,
              changeType: data.metrics.twelveMonthTotal.changeType as any,
              icon: '💼'
            }
          ]);
          
          setChartData(data.charts.taskDistribution);
          
          // Update revenue chart data if available
          if (data.charts.revenueData && Array.isArray(data.charts.revenueData) && data.charts.revenueData.length > 0) {
            setRevenueData(data.charts.revenueData);
          }
        }
        
        // Fetch detailed revenue time series data
        const revenueResponse = await fetch('/api/revenue-data');
        if (revenueResponse.ok) {
          const revenueData = await revenueResponse.json();
          if (revenueData.monthlyRevenue && Array.isArray(revenueData.monthlyRevenue)) {
            setRevenueTimeSeriesData(revenueData.monthlyRevenue);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Fallback to static data
        setMetrics([
          {
            title: 'Total Revenue',
            value: '£124,563',
            change: '+12.5%',
            changeType: 'increase',
            icon: '💰'
          },
          {
            title: 'Active Users',
            value: '2,847',
            change: '+8.2%',
            changeType: 'increase',
            icon: '👥'
          },
          {
            title: 'New Deals (30d)',
            value: '12',
            change: '+8.7%',
            changeType: 'increase',
            icon: '🤝'
          },
          {
            title: 'Deals Value (30d)',
            value: '$45,230',
            change: '+12.4%',
            changeType: 'increase',
            icon: '💼'
          },
          {
            title: 'Open Tasks',
            value: '23',
            change: '-15.3%',
            changeType: 'decrease',
            icon: '✅'
          },
          {
            title: 'Team Holidays (14d)',
            value: '2',
            change: '5 in 30d',
            changeType: 'neutral',
            icon: '🏖️'
          },
          {
            title: '3M Avg Revenue',
            value: '£72,564',
            change: '+8.3%',
            changeType: 'increase',
            icon: '📊'
          },
          {
            title: '12M Total Revenue',
            value: '£864,379',
            change: '+12.1%',
            changeType: 'increase',
            icon: '💼'
          }
        ]);

        setChartData([
          { name: 'Completed', value: 65, color: '#10B981' },
          { name: 'In Progress', value: 23, color: '#3B82F6' },
          { name: 'Pending', value: 12, color: '#F59E0B' }
        ]);
        // Keep default revenue data on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Update time every second to avoid hydration issues
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase': return 'text-green-600 bg-green-50';
      case 'decrease': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase': return '↗️';
      case 'decrease': return '↘️';
      default: return '→';
    }
  };

  const navigateToTasks = useCallback(() => {
    window.location.href = '/tasks';
  }, []);

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor your business performance and key metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                {['24h', '7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      timeRange === range
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                📊 New Report
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="p-6 bg-white border border-gray-200">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              metrics.map((metric, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-white border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{metric.icon}</span>
                                          <span className={`text-xs font-medium ${getChangeColor(metric.changeType)} flex items-center px-2 py-1 rounded`}>
                      {getChangeIcon(metric.changeType)} {metric.change}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm text-gray-600">{metric.title}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span>Revenue</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {revenueData.map((value, index) => {
                const maxValue = Math.max(...revenueData);
                return (
                  <div key={index} className="flex-1 bg-blue-100 rounded-t relative group">
                    <div 
                      className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${(value / maxValue) * 200}px` }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      £{value}k
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              {revenueData.length > 0 && (
                <>
                  <span>{new Date(new Date().getFullYear(), new Date().getMonth() - revenueData.length + 1, 1).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short' })}</span>
                </>
              )}
            </div>
          </Card>

          {/* Task Distribution */}
          <Card className="p-6 bg-white cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToTasks}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Distribution</h3>
              <div className="text-sm text-gray-600 flex items-center space-x-1">
                <span>Click to view all</span>
                <span>→</span>
              </div>
            </div>
            <div className="space-y-4">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${item.value}%`, 
                          backgroundColor: item.color 
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center space-x-1 min-w-[60px] justify-end">
                      <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                      {item.count !== undefined && (
                        <span className="text-xs text-gray-500">({item.count})</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tasks</span>
                <span className="font-semibold text-gray-900">
                  {chartData.reduce((total, item) => total + (item.count || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold text-green-600">
                  {chartData.find(item => item.name === 'Completed')?.value || 0}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Click to view tasks</span>
                <span>Auto-refreshing</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Time Series Chart - Full Width */}
        <section className="mb-8">
          <Card className="p-6 bg-white hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Revenue Time Series</h3>
                <p className="text-sm text-gray-600 mt-1">Monthly revenue breakdown over time (VAT excluded)</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></span>
                  <span>Revenue</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                  <span>Trend</span>
                </div>
                <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  {revenueTimeSeriesData.length} months
                </div>
              </div>
            </div>
            
            <div className="relative w-full overflow-hidden">
              <svg 
                width="100%" 
                height="320" 
                viewBox="0 0 800 320"
                className="transition-all duration-300 hover:scale-[1.01]"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <line
                      x1="80"
                      y1={60 + (i * (220 / 4))}
                      x2="720"
                      y2={60 + (i * (220 / 4))}
                      stroke="#f3f4f6"
                      strokeWidth="1"
                      className="transition-opacity duration-300"
                    />
                    <text
                      x="70"
                      y={65 + (i * (220 / 4))}
                      fill="#9ca3af"
                      fontSize="12"
                      textAnchor="end"
                      className="transition-colors duration-300"
                    >
                      £{Math.round((Math.max(...revenueTimeSeriesData.map(d => d.revenue)) - (i * (Math.max(...revenueTimeSeriesData.map(d => d.revenue)) / 4))) / 1000)}k
                    </text>
                  </g>
                ))}

                {/* Area Fill */}
                <path
                  d={`M 80 280 ${revenueTimeSeriesData.map((_, i) => {
                    const chartWidth = 640; // Chart area width (720 - 80)
                    const x = 80 + (chartWidth / (revenueTimeSeriesData.length - 1)) * i;
                    const y = 60 + (220 * (1 - revenueTimeSeriesData[i].revenue / Math.max(...revenueTimeSeriesData.map(d => d.revenue))));
                    return `L ${x} ${y}`;
                  }).join(' ')} L ${80 + (640 / (revenueTimeSeriesData.length - 1)) * (revenueTimeSeriesData.length - 1)} 280 Z`}
                  fill="url(#revenueGradient)"
                  className="transition-all duration-300"
                />

                {/* Trend Line */}
                {(() => {
                  // Calculate linear trend
                  const n = revenueTimeSeriesData.length;
                  const sumX = revenueTimeSeriesData.reduce((sum, _, i) => sum + i, 0);
                  const sumY = revenueTimeSeriesData.reduce((sum, item) => sum + item.revenue, 0);
                  const sumXY = revenueTimeSeriesData.reduce((sum, item, i) => sum + (i * item.revenue), 0);
                  const sumXX = revenueTimeSeriesData.reduce((sum, _, i) => sum + (i * i), 0);
                  
                  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                  const intercept = (sumY - slope * sumX) / n;
                  
                  const startTrend = intercept;
                  const endTrend = intercept + slope * (n - 1);
                  
                  const chartWidth = 640;
                  const startX = 80;
                  const endX = 80 + (chartWidth / (revenueTimeSeriesData.length - 1)) * (revenueTimeSeriesData.length - 1);
                  const maxRevenue = Math.max(...revenueTimeSeriesData.map(d => d.revenue));
                  const startY = 60 + (220 * (1 - startTrend / maxRevenue));
                  const endY = 60 + (220 * (1 - endTrend / maxRevenue));
                  
                  return (
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="transition-all duration-300 hover:stroke-width-3"
                      opacity="0.8"
                    />
                  );
                })()}

                {/* Revenue Line */}
                <path
                  d={`M ${revenueTimeSeriesData.map((_, i) => {
                    const chartWidth = 640;
                    const x = 80 + (chartWidth / (revenueTimeSeriesData.length - 1)) * i;
                    const y = 60 + (220 * (1 - revenueTimeSeriesData[i].revenue / Math.max(...revenueTimeSeriesData.map(d => d.revenue))));
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  className="transition-all duration-300 hover:stroke-width-4"
                />
                
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                  </linearGradient>
                </defs>

                {/* Data Points */}
                {revenueTimeSeriesData.map((item, i) => {
                  const chartWidth = 640;
                  const x = 80 + (chartWidth / (revenueTimeSeriesData.length - 1)) * i;
                  const y = 60 + (220 * (1 - item.revenue / Math.max(...revenueTimeSeriesData.map(d => d.revenue))));
                  const isHovered = hoveredPoint === i;
                  
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? "8" : "5"}
                        fill={isHovered ? "#3b82f6" : "#ffffff"}
                        stroke={isHovered ? "#1d4ed8" : "#3b82f6"}
                        strokeWidth={isHovered ? "3" : "2"}
                        className="transition-all duration-200 cursor-pointer hover:scale-110"
                        onMouseEnter={() => setHoveredPoint(i)}
                        style={{
                          filter: isHovered ? 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))' : 'none',
                          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                      
                      {/* Hover Tooltip */}
                      {isHovered && (
                        <g className="animate-fade-in">
                          <rect
                            x={x - 60}
                            y={y - 45}
                            width="120"
                            height="35"
                            fill="rgba(0, 0, 0, 0.9)"
                            rx="6"
                            className="drop-shadow-lg"
                          />
                          <text
                            x={x}
                            y={y - 30}
                            fill="white"
                            fontSize="12"
                            textAnchor="middle"
                            fontWeight="600"
                          >
                            {item.month}
                          </text>
                          <text
                            x={x}
                            y={y - 15}
                            fill="#60a5fa"
                            fontSize="14"
                            textAnchor="middle"
                            fontWeight="700"
                          >
                            £{(item.revenue / 1000).toFixed(1)}k
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* X-axis Labels */}
                {revenueTimeSeriesData.length > 0 && [0, Math.floor(revenueTimeSeriesData.length / 2), revenueTimeSeriesData.length - 1].map((i) => (
                  <text
                    key={i}
                    x={80 + (640 / (revenueTimeSeriesData.length - 1)) * i}
                    y="300"
                    fill="#6b7280"
                    fontSize="12"
                    textAnchor="middle"
                    className="transition-colors duration-300 hover:fill-gray-900"
                  >
                    {revenueTimeSeriesData[i]?.month.split(' ')[0]}
                  </text>
                ))}
              </svg>
            </div>
            
            {/* Summary Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-4 gap-6 text-center">
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Latest</div>
                  <div className="text-xl font-semibold text-blue-600 group-hover:text-blue-700">
                    £{((revenueTimeSeriesData[revenueTimeSeriesData.length - 1]?.revenue || 0) / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Average</div>
                  <div className="text-xl font-semibold text-purple-600 group-hover:text-purple-700">
                    £{(revenueTimeSeriesData.reduce((sum, item) => sum + item.revenue, 0) / revenueTimeSeriesData.length / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Peak</div>
                  <div className="text-xl font-semibold text-green-600 group-hover:text-green-700">
                    £{(Math.max(...revenueTimeSeriesData.map(item => item.revenue)) / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Total</div>
                  <div className="text-xl font-semibold text-indigo-600 group-hover:text-indigo-700">
                    £{(revenueTimeSeriesData.reduce((sum, item) => sum + item.revenue, 0) / 1000).toFixed(1)}k
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { action: 'New task assigned', user: 'Alex Keal', time: '2 minutes ago', type: 'task' },
                { action: 'Report generated', user: 'System', time: '15 minutes ago', type: 'report' },
                { action: 'Holiday approved', user: 'Lucy Foster', time: '1 hour ago', type: 'holiday' },
                { action: 'Energy alert triggered', user: 'Monitoring', time: '2 hours ago', type: 'alert' },
                { action: 'New user registered', user: 'Mark Nockles', time: '3 hours ago', type: 'user' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    activity.type === 'task' ? 'bg-blue-500' :
                    activity.type === 'report' ? 'bg-green-500' :
                    activity.type === 'holiday' ? 'bg-yellow-500' :
                    activity.type === 'alert' ? 'bg-red-500' : 'bg-purple-500'
                  }`}>
                    {activity.type === 'task' ? '📋' :
                     activity.type === 'report' ? '📊' :
                     activity.type === 'holiday' ? '🏖️' :
                     activity.type === 'alert' ? '⚠️' : '👤'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { title: 'Create Task', icon: '➕', color: 'bg-blue-500', href: '/tasks' },
                { title: 'View Calendar', icon: '📅', color: 'bg-green-500', href: '/calendar' },
                { title: 'Generate Report', icon: '📄', color: 'bg-purple-500', href: '#' },
                { title: 'System Settings', icon: '⚙️', color: 'bg-gray-500', href: '#' }
              ].map((action, index) => (
                <button
                  key={index}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  onClick={() => action.href !== '#' && (window.location.href = action.href)}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white`}>
                    {action.icon}
                  </div>
                  <span className="font-medium text-gray-900">{action.title}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <span>Last updated: {currentTime || '--:--:--'}</span>
              <span>•</span>
              <span>Auto-refresh: On</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}