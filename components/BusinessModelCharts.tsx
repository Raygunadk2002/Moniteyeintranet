import React, { useRef, useCallback, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { ForecastResult } from './AdvancedBusinessModelingEngine';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface BusinessModelChartsProps {
  forecastResults: ForecastResult[];
  selectedModels: string[];
  launchYear: number;
}

export default function BusinessModelCharts({ 
  forecastResults, 
  selectedModels, 
  launchYear 
}: BusinessModelChartsProps) {
  const revenueChartRef = useRef<ChartJS<'line'>>(null);
  const breakEvenChartRef = useRef<ChartJS<'line'>>(null);
  const customerChartRef = useRef<ChartJS<'line'>>(null);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      revenueChartRef.current?.destroy();
      breakEvenChartRef.current?.destroy();
      customerChartRef.current?.destroy();
    };
  }, []);

  // Export chart as PNG
  const exportChart = useCallback((chartRef: React.RefObject<ChartJS<'line'>>, filename: string) => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Prepare data for charts
  const prepareChartData = () => {
    if (!forecastResults || forecastResults.length === 0) {
      return {
        revenueData: { labels: [], datasets: [] },
        breakEvenData: { labels: [], datasets: [] },
        customerData: { labels: [], datasets: [] }
      };
    }

    const months = forecastResults.map(result => 
      `${result.year}-${result.month.toString().padStart(2, '0')}`
    );

    // Revenue by Model Data
    const revenueData = {
      labels: months,
      datasets: (selectedModels || []).map((model, index) => {
        const colors = [
          'rgb(59, 130, 246)',   // Blue
          'rgb(16, 185, 129)',   // Green
          'rgb(245, 158, 11)',   // Yellow
          'rgb(239, 68, 68)',    // Red
          'rgb(139, 92, 246)',   // Purple
          'rgb(236, 72, 153)',   // Pink
          'rgb(14, 165, 233)',   // Sky
          'rgb(34, 197, 94)',    // Emerald
          'rgb(168, 85, 247)',   // Violet
        ];
        
        return {
          label: model,
          data: forecastResults.map(result => result.revenueByModel[model] || 0),
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length] + '20',
          fill: true,
          tension: 0.4,
        };
      })
    };

    // Break-even Analysis Data
    const breakEvenData = {
      labels: months,
      datasets: [
        {
          label: 'Total Revenue',
          data: forecastResults.map(result => result.totalRevenue),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Total Costs',
          data: forecastResults.map(result => result.totalCosts),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Net Profit',
          data: forecastResults.map(result => result.netProfit),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: (context: any) => {
            const value = context.parsed?.y ?? context.raw;
            return (value >= 0) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
          },
          fill: true,
          tension: 0.4,
        }
      ]
    };

    // Customer Growth Data
    const customerData = {
      labels: months,
      datasets: (selectedModels || []).map((model, index) => {
        const colors = [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ];
        
        return {
          label: `${model} Customers`,
          data: forecastResults.map(result => result.customerBase[model] || 0),
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length] + '40',
          fill: false,
          tension: 0.4,
        };
      })
    };

    return { revenueData, breakEvenData, customerData };
  };

  const { revenueData, breakEvenData, customerData } = prepareChartData();

  // Chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animations to prevent canvas conflicts
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = context.parsed?.y ?? context.raw ?? 0;
            if (typeof value === 'number') {
              label += new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
            }
            return label;
          }
        }
      }
    }
  };

  const revenueOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Revenue by Business Model Over Time'
      }
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: 'Revenue (£)'
        }
      }
    }
  };

  const breakEvenOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Break-Even Analysis'
      }
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: 'Amount (£)'
        }
      }
    }
  };

  const customerOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Customer Growth by Business Model'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = context.parsed?.y ?? context.raw ?? 0;
            if (typeof value === 'number') {
              label += new Intl.NumberFormat('en-GB').format(value);
            }
            return label;
          }
        }
      }
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: 'Number of Customers'
        }
      }
    }
  };

  if (forecastResults.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Interactive Charts</h3>
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium">No forecast data available</p>
          <p className="text-sm">Configure your business models and costs to see interactive charts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Revenue by Model Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">📈 Revenue by Business Model</h3>
          <button
            onClick={() => exportChart(revenueChartRef, 'revenue-by-model')}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            📥 Export PNG
          </button>
        </div>
        <div className="h-96">
          <Line 
            ref={revenueChartRef}
            key={`revenue-${(selectedModels || []).join('-')}-${forecastResults.length}`}
            data={revenueData} 
            options={revenueOptions} 
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-medium text-blue-900">Peak Monthly Revenue</div>
            <div className="text-blue-700">
              £{Math.max(...forecastResults.map(r => r.totalRevenue)).toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-medium text-green-900">Total 5-Year Revenue</div>
            <div className="text-green-700">
              £{forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-medium text-purple-900">Active Models</div>
            <div className="text-purple-700">{(selectedModels || []).length}</div>
          </div>
        </div>
      </div>

      {/* Break-Even Analysis Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">⚖️ Break-Even Analysis</h3>
          <button
            onClick={() => exportChart(breakEvenChartRef, 'break-even-analysis')}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            📥 Export PNG
          </button>
        </div>
        <div className="h-96">
          <Line 
            ref={breakEvenChartRef}
            key={`breakeven-${(selectedModels || []).join('-')}-${forecastResults.length}`}
            data={breakEvenData} 
            options={breakEvenOptions} 
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-medium text-green-900">Break-Even Month</div>
            <div className="text-green-700">
              {forecastResults.findIndex(r => r.breakEvenReached) >= 0 ? 
                `Month ${forecastResults.findIndex(r => r.breakEvenReached) + 1}` : 
                'Not reached'
              }
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="font-medium text-yellow-900">Time to Profitability</div>
            <div className="text-yellow-700">
              {forecastResults.findIndex(r => r.breakEvenReached) >= 0 ? 
                `${Math.ceil(forecastResults.findIndex(r => r.breakEvenReached) / 12)} years` : 
                'Not reached'
              }
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="font-medium text-red-900">Max Monthly Loss</div>
            <div className="text-red-700">
              £{Math.abs(Math.min(...forecastResults.map(r => r.netProfit), 0)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Growth Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">👥 Customer Growth</h3>
          <button
            onClick={() => exportChart(customerChartRef, 'customer-growth')}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            📥 Export PNG
          </button>
        </div>
        <div className="h-96">
          <Line 
            ref={customerChartRef}
            key={`customer-${(selectedModels || []).join('-')}-${forecastResults.length}`}
            data={customerData} 
            options={customerOptions} 
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-medium text-blue-900">Peak Customer Base</div>
            <div className="text-blue-700">
              {Math.max(...forecastResults.map(r => 
                Object.values(r.customerBase || {}).reduce((sum: number, customers: any) => sum + (Number(customers) || 0), 0)
              )).toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-medium text-green-900">Customer Growth Rate</div>
            <div className="text-green-700">
              {forecastResults.length > 12 ? 
                `${(((Object.values(forecastResults[forecastResults.length - 1].customerBase || {}).reduce((sum: number, c: any) => sum + (Number(c) || 0), 0)) / 
                     (Object.values(forecastResults[11]?.customerBase || {}).reduce((sum: number, c: any) => sum + (Number(c) || 0), 0) || 1) - 1) * 100).toFixed(1)}%` :
                'Calculating...'
              }
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-medium text-purple-900">Avg. Customer Value</div>
            <div className="text-purple-700">
              £{forecastResults.length > 0 ? 
                (forecastResults[forecastResults.length - 1].totalRevenue / 
                 Math.max(Object.values(forecastResults[forecastResults.length - 1].customerBase || {}).reduce((sum: number, c: any) => sum + (Number(c) || 0), 0), 1)
                ).toLocaleString() : '0'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Export All Charts */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">📊 Export All Charts</h3>
            <p className="text-sm text-gray-600 mt-1">Download all charts as PNG images for presentations and reports</p>
          </div>
          <button
            onClick={() => {
              exportChart(revenueChartRef, 'revenue-by-model');
              setTimeout(() => exportChart(breakEvenChartRef, 'break-even-analysis'), 500);
              setTimeout(() => exportChart(customerChartRef, 'customer-growth'), 1000);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Export All Charts
          </button>
        </div>
      </div>
    </div>
  );
} 