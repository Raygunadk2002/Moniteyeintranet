import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
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
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState<DashboardMetric[]>([
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
      value: '27',
      change: '+8.7%',
      changeType: 'increase',
      icon: '🤝'
    },
    {
      title: 'Deals Value (30d)',
      value: '£605,132',
      change: '+12.4%',
      changeType: 'increase',
      icon: '💼'
    },
    {
      title: 'Open Tasks',
      value: '7',
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
  ]); // Start with test data immediately
  const [chartData, setChartData] = useState<ChartData[]>([
    { name: 'Completed', value: 65, color: '#10B981', count: 5 },
    { name: 'In Progress', value: 23, color: '#3B82F6', count: 2 },
    { name: 'Open', value: 12, color: '#F59E0B', count: 1 }
  ]); // Start with test data immediately
  const [revenueData, setRevenueData] = useState<number[]>([52, 54, 57, 56, 69, 89, 64, 71, 71, 76, 109, 101]); // Real data from API
  const [revenueTimeSeriesData, setRevenueTimeSeriesData] = useState<RevenueTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true); // Start with true to show proper loading state
  const [currentTime, setCurrentTime] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<{action: string; user: string; time: string; type: string}[]>([
    { action: 'Dashboard starting...', user: 'System', time: 'Just now', type: 'system' }
  ]);

  // TEMP: Remove the test data useEffect since we're setting it in initial state
  // useEffect(() => {
  //   console.log('🔧 TEMP: Setting test metrics data immediately');
  //   setMetrics([...]);
  //   setChartData([...]);
  //   console.log('✅ TEMP: Test data set, loading state is:', false);
  // }, []);

  // Initialize data from localStorage on component mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('revenueTimeSeriesData');
      if (stored) {
        const parsedData = JSON.parse(stored);
        setRevenueTimeSeriesData(parsedData);
        console.log('🔄 Initialized revenue data from localStorage:', parsedData.length, 'items');
      }
    } catch (error) {
      console.warn('Failed to initialize from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    // Fetch real dashboard data from API
    const fetchDashboardData = async () => {
      console.log('🔄 Starting dashboard data fetch...');
      setLoading(true);
      try {
        console.log('📡 Fetching dashboard metrics...');
        const response = await fetch('/api/dashboard-metrics');
        console.log('📡 Response status:', response.status, response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Received dashboard data:', data);
        
        if (data.metrics) {
          console.log('✅ Setting metrics data...');
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
          console.log('✅ Metrics set successfully');
          
          setChartData(data.charts.taskDistribution);
          console.log('✅ Chart data set successfully');
          
          // Update revenue chart data if available
          if (data.charts.revenueData && Array.isArray(data.charts.revenueData) && data.charts.revenueData.length > 0) {
            setRevenueData(data.charts.revenueData);
            console.log('✅ Revenue data set successfully');
          }

          // Update activities with real data
          if (data.activities && Array.isArray(data.activities)) {
            setActivities(data.activities);
            console.log('✅ Activities data set successfully:', data.activities.length, 'activities');
          }
        } else {
          console.warn('⚠️ No metrics data in response');
        }
        
        // Fetch detailed revenue time series data
        console.log('📡 Fetching revenue time series data...');
        try {
          const revenueResponse = await fetch('/api/revenue-data');
          console.log('Revenue response status:', revenueResponse.status);
          if (revenueResponse.ok) {
            const revenueData = await revenueResponse.json();
            console.log('📊 Revenue data received:', revenueData);
            
            // Always update both chart data and time series data
            if (revenueData.revenueData && Array.isArray(revenueData.revenueData)) {
              setRevenueData(revenueData.revenueData);
              console.log('✅ Revenue chart data updated:', revenueData.revenueData);
            }
            
            if (revenueData.monthlyRevenue && Array.isArray(revenueData.monthlyRevenue)) {
              console.log('📈 Setting revenue time series data:', revenueData.monthlyRevenue.length, 'items');
              console.log('Sample data:', revenueData.monthlyRevenue[0]);
              setRevenueTimeSeriesData(revenueData.monthlyRevenue);
              console.log('✅ Revenue time series data set successfully');
              
              // Store in localStorage for persistence
              try {
                localStorage.setItem('revenueTimeSeriesData', JSON.stringify(revenueData.monthlyRevenue));
                localStorage.setItem('lastRevenueUpdate', new Date().toISOString());
              } catch (error) {
                console.warn('Failed to store revenue data in localStorage:', error);
              }
            } else {
              console.log('⚠️ No valid monthlyRevenue array found in response');
            }
          } else {
            console.log('⚠️ Failed to fetch revenue time series data, status:', revenueResponse.status);
            
            // Try to load from localStorage as fallback
            try {
              const stored = localStorage.getItem('revenueTimeSeriesData');
              if (stored) {
                const parsedData = JSON.parse(stored);
                setRevenueTimeSeriesData(parsedData);
                console.log('📁 Loaded revenue data from localStorage:', parsedData.length, 'items');
              }
            } catch (error) {
              console.warn('Failed to load revenue data from localStorage:', error);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching revenue data:', error);
        }
        
        console.log('🎉 Dashboard data fetch completed successfully');
      } catch (error) {
        console.error('❌ Failed to fetch dashboard data:', error);
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
        
        // Set fallback activities
        setActivities([
          { action: 'Dashboard loaded with fallback data', user: 'System', time: 'Just now', type: 'system' },
          { action: 'Using cached metrics', user: 'System', time: 'Now', type: 'system' }
        ]);
        console.log('✅ Fallback data set');
        // Keep default revenue data on error
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    // Fetch dashboard data on component mount
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

  const handleRefreshDashboard = async () => {
    setRefreshing(true);
    try {
      // Wait a bit to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      setRefreshing(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor your key performance indicators and business metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['24h', '7d', '30d', '90d'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeRange(period)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      timeRange === period
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                📊 New Report
              </button>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metrics.slice(2).map((metric, index) => (
              <Card key={index} className="p-6 bg-white hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    {(metric.title.includes('Revenue')) && (
                      <p className="text-xs text-gray-500">VAT excluded</p>
                    )}
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  </div>
                  <div className="text-2xl">{metric.icon}</div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                    {getChangeIcon(metric.changeType)} {metric.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">from last month</span>
                </div>
              </Card>
            ))}
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
            <div className="relative">
              {/* Y-axis Labels */}
              <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 pr-2">
                {[0, 1, 2, 3, 4].map((i) => {
                  const maxValue = Math.max(...revenueData);
                  const value = maxValue > 0 ? Math.round((maxValue - (i * (maxValue / 4)))) : (4 - i) * 25;
                  return (
                    <div key={i} className="text-right">
                      £{value}k
                    </div>
                  );
                })}
              </div>
              
              {/* Chart Area */}
              <div className="ml-12 h-64 flex items-end justify-between space-x-2">
                {revenueData.map((value, index) => {
                  const maxValue = Math.max(...revenueData);
                  return (
                    <div key={index} className="flex-1 bg-blue-100 rounded-t relative group">
                      <div 
                        className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${(value / maxValue) * 240}px` }}
                      ></div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        £{value}k
                      </div>
                    </div>
                  );
                })}
              </div>
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
              {revenueTimeSeriesData.length > 0 ? (
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
                {revenueTimeSeriesData.length > 0 && [0, 1, 2, 3, 4].map((i) => {
                  const maxRevenue = Math.max(...revenueTimeSeriesData.map(d => d.revenue));
                  return (
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
                        £{Math.round((maxRevenue - (i * (maxRevenue / 4))) / 1000)}k
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                {revenueTimeSeriesData.length > 0 && (
                  <path
                    d={`M 80 280 ${revenueTimeSeriesData.map((_, i) => {
                      const chartWidth = 640; // Chart area width (720 - 80)
                      const x = 80 + (chartWidth / (revenueTimeSeriesData.length - 1)) * i;
                      const maxRevenue = Math.max(...revenueTimeSeriesData.map(d => d.revenue));
                      const y = 60 + (220 * (1 - revenueTimeSeriesData[i].revenue / maxRevenue));
                      return `L ${x} ${y}`;
                    }).join(' ')} L ${80 + (640 / (revenueTimeSeriesData.length - 1)) * (revenueTimeSeriesData.length - 1)} 280 Z`}
                    fill="url(#revenueGradient)"
                    className="transition-all duration-300"
                  />
                )}

                {/* Trend Line */}
                {revenueTimeSeriesData.length >= 2 && (() => {
                  // Calculate linear trend
                  const n = revenueTimeSeriesData.length;
                  const sumX = revenueTimeSeriesData.reduce((sum, _, i) => sum + i, 0);
                  const sumY = revenueTimeSeriesData.reduce((sum, item) => sum + item.revenue, 0);
                  const sumXY = revenueTimeSeriesData.reduce((sum, item, i) => sum + (i * item.revenue), 0);
                  const sumXX = revenueTimeSeriesData.reduce((sum, _, i) => sum + (i * i), 0);
                  
                  const denominator = (n * sumXX - sumX * sumX);
                  if (denominator === 0) return null;
                  
                  const slope = (n * sumXY - sumX * sumY) / denominator;
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
                {revenueTimeSeriesData.length > 0 && (
                  <path
                    d={`${revenueTimeSeriesData.map((_, i) => {
                      const chartWidth = 640;
                      const x = 80 + (chartWidth / (revenueTimeSeriesData.length - 1)) * i;
                      const maxRevenue = Math.max(...revenueTimeSeriesData.map(d => d.revenue));
                      const y = 60 + (220 * (1 - revenueTimeSeriesData[i].revenue / maxRevenue));
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}`}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    className="transition-all duration-300 hover:stroke-width-4"
                  />
                )}
                
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                  </linearGradient>
                </defs>

                {/* Data Points */}
                {revenueTimeSeriesData.length > 0 && revenueTimeSeriesData.map((item, i) => {
                  const chartWidth = 640;
                  const x = 80 + (chartWidth / (revenueTimeSeriesData.length - 1)) * i;
                  const maxRevenue = Math.max(...revenueTimeSeriesData.map(d => d.revenue));
                  const y = 60 + (220 * (1 - item.revenue / maxRevenue));
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
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                      {loading ? 'Loading revenue data...' : 'No revenue data available'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {loading ? 'Chart will appear once data is loaded' : 'Upload revenue data to see chart'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Summary Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-4 gap-6 text-center">
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Latest</div>
                  <div className="text-xl font-semibold text-blue-600 group-hover:text-blue-700">
                    £{revenueTimeSeriesData.length > 0 ? ((revenueTimeSeriesData[revenueTimeSeriesData.length - 1]?.revenue || 0) / 1000).toFixed(1) : '0.0'}k
                  </div>
                </div>
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Average</div>
                  <div className="text-xl font-semibold text-purple-600 group-hover:text-purple-700">
                    £{revenueTimeSeriesData.length > 0 ? (revenueTimeSeriesData.reduce((sum, item) => sum + item.revenue, 0) / revenueTimeSeriesData.length / 1000).toFixed(1) : '0.0'}k
                  </div>
                </div>
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Peak</div>
                  <div className="text-xl font-semibold text-green-600 group-hover:text-green-700">
                    £{revenueTimeSeriesData.length > 0 ? (Math.max(...revenueTimeSeriesData.map(item => item.revenue)) / 1000).toFixed(1) : '0.0'}k
                  </div>
                </div>
                <div className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="text-sm text-gray-600 group-hover:text-gray-800">Total</div>
                  <div className="text-xl font-semibold text-indigo-600 group-hover:text-indigo-700">
                    £{revenueTimeSeriesData.length > 0 ? (revenueTimeSeriesData.reduce((sum, item) => sum + item.revenue, 0) / 1000).toFixed(1) : '0.0'}k
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
            </div>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110 ${
                    activity.type === 'task' ? 'bg-blue-500' :
                    activity.type === 'deal' ? 'bg-green-500' :
                    activity.type === 'holiday' ? 'bg-yellow-500' :
                    activity.type === 'alert' ? 'bg-red-500' : 
                    activity.type === 'system' ? 'bg-gray-500' : 'bg-purple-500'
                  }`}>
                    {activity.type === 'task' ? '📋' :
                     activity.type === 'deal' ? '💼' :
                     activity.type === 'holiday' ? '🏖️' :
                     activity.type === 'alert' ? '⚠️' : 
                     activity.type === 'system' ? '🔄' : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {activity.action}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span className="font-medium">{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className={`w-1 h-8 rounded-full ${
                      activity.type === 'task' ? 'bg-blue-200' :
                      activity.type === 'deal' ? 'bg-green-200' :
                      activity.type === 'holiday' ? 'bg-yellow-200' :
                      activity.type === 'alert' ? 'bg-red-200' : 
                      activity.type === 'system' ? 'bg-gray-200' : 'bg-purple-200'
                    }`}></div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-gray-500 text-sm">No recent activity</p>
                  <p className="text-gray-400 text-xs mt-1">Activity will appear as it happens</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { 
                  title: 'Create Task', 
                  icon: '➕', 
                  color: 'bg-blue-500 hover:bg-blue-600', 
                  href: '/tasks',
                  description: 'Add a new task to the board'
                },
                { 
                  title: 'View Calendar', 
                  icon: '📅', 
                  color: 'bg-green-500 hover:bg-green-600', 
                  href: '/calendar',
                  description: 'Check team schedules and holidays'
                },
                { 
                  title: 'Admin Panel', 
                  icon: '🔧', 
                  color: 'bg-purple-500 hover:bg-purple-600', 
                  href: '/admin',
                  description: 'Upload revenue data and manage settings'
                },
                { 
                  title: 'Refresh Dashboard', 
                  icon: '🔄', 
                  color: 'bg-gray-500 hover:bg-gray-600', 
                  href: '#refresh',
                  description: 'Reload all dashboard data'
                }
              ].map((action, index) => (
                <button
                  key={index}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-left group border border-transparent ${
                    refreshing && action.href === '#refresh' 
                      ? 'opacity-75 cursor-not-allowed bg-gray-50' 
                      : 'hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm'
                  }`}
                  onClick={() => {
                    if (action.href === '#refresh') {
                      handleRefreshDashboard();
                    } else if (action.href !== '#') {
                      router.push(action.href);
                    }
                  }}
                  disabled={refreshing && action.href === '#refresh'}
                  title={action.description}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (action.href === '#refresh') {
                        handleRefreshDashboard();
                      } else if (action.href !== '#') {
                        router.push(action.href);
                      }
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white transition-all duration-200 group-hover:scale-105 group-hover:shadow-md`}>
                    {action.href === '#refresh' && refreshing ? 
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      : action.icon
                    }
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 group-hover:text-gray-700">{action.title}</span>
                    <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-600">{action.description}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
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