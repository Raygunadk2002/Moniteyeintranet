import React, { useState, useEffect } from 'react';
import { BusinessIdea } from '../pages/business-ideas';

interface RevenueModelingEngineProps {
  idea: BusinessIdea;
  onUpdateModel: (revenueModel: any) => void;
  onBack: () => void;
}

export default function RevenueModelingEngine({ idea, onUpdateModel, onBack }: RevenueModelingEngineProps) {
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [growthAssumptions, setGrowthAssumptions] = useState({
    monthlyGrowthRate: 5,
    seasonalUplift: 0,
    churnRate: 5
  });
  const [forecastPeriod, setForecastPeriod] = useState(36);
  const [forecast, setForecast] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'parameters' | 'forecast' | 'charts'>('parameters');

  useEffect(() => {
    const defaultParams = getDefaultParameters(idea.businessModel);
    if (idea.revenueModel?.parameters) {
      setParameters({ ...defaultParams, ...idea.revenueModel.parameters });
    } else {
      setParameters(defaultParams);
    }
  }, [idea]);

  function getDefaultParameters(businessModel: string): Record<string, number> {
    switch (businessModel) {
      case 'SAAS':
        return {
          usersPerMonth: 100,
          churnRate: 5,
          pricingTier: 29,
          upsellPercentage: 15,
          freeTrialConversionRate: 25
        };
      case 'Hardware + SAAS':
        return {
          hardwareUnitCost: 200,
          hardwareMarkup: 100,
          monthlySaasPrice: 19,
          averageUnitsPerMonth: 50
        };
      case 'Straight Sales':
        return {
          unitPrice: 100,
          unitsPerMonth: 200,
          seasonalUplift: 20
        };
      case 'Subscription Product':
        return {
          subscribersPerMonth: 500,
          monthlySubscriptionPrice: 9.99,
          churnRate: 3,
          upsellPercentage: 10
        };
      case 'Marketplace':
        return {
          gmv: 50000,
          takeRate: 3,
          monthlyGrowthRate: 8
        };
      default:
        return {
          monthlyRevenue: 10000,
          growthRate: 5
        };
    }
  }

  function getParameterFields(businessModel: string) {
    switch (businessModel) {
      case 'SAAS':
        return [
          { key: 'usersPerMonth', label: 'New Users per Month', type: 'number', min: 0 },
          { key: 'churnRate', label: 'Monthly Churn Rate (%)', type: 'number', min: 0, max: 100 },
          { key: 'pricingTier', label: 'Average Monthly Price (£)', type: 'number', min: 0 },
          { key: 'upsellPercentage', label: 'Upsell Rate (%)', type: 'number', min: 0, max: 100 },
          { key: 'freeTrialConversionRate', label: 'Free Trial Conversion (%)', type: 'number', min: 0, max: 100 }
        ];
      case 'Hardware + SAAS':
        return [
          { key: 'hardwareUnitCost', label: 'Hardware Unit Cost (£)', type: 'number', min: 0 },
          { key: 'hardwareMarkup', label: 'Hardware Markup (%)', type: 'number', min: 0 },
          { key: 'monthlySaasPrice', label: 'Monthly SAAS Price (£)', type: 'number', min: 0 },
          { key: 'averageUnitsPerMonth', label: 'Units Sold per Month', type: 'number', min: 0 }
        ];
      case 'Straight Sales':
        return [
          { key: 'unitPrice', label: 'Unit Price (£)', type: 'number', min: 0 },
          { key: 'unitsPerMonth', label: 'Units per Month', type: 'number', min: 0 },
          { key: 'seasonalUplift', label: 'Seasonal Uplift (%)', type: 'number', min: 0 }
        ];
      case 'Subscription Product':
        return [
          { key: 'subscribersPerMonth', label: 'New Subscribers per Month', type: 'number', min: 0 },
          { key: 'monthlySubscriptionPrice', label: 'Monthly Price (£)', type: 'number', min: 0 },
          { key: 'churnRate', label: 'Monthly Churn Rate (%)', type: 'number', min: 0, max: 100 },
          { key: 'upsellPercentage', label: 'Upsell Rate (%)', type: 'number', min: 0, max: 100 }
        ];
      case 'Marketplace':
        return [
          { key: 'gmv', label: 'Monthly GMV (£)', type: 'number', min: 0 },
          { key: 'takeRate', label: 'Take Rate (%)', type: 'number', min: 0, max: 100 },
          { key: 'monthlyGrowthRate', label: 'Monthly Growth Rate (%)', type: 'number', min: 0 }
        ];
      default:
        return [
          { key: 'monthlyRevenue', label: 'Monthly Revenue (£)', type: 'number', min: 0 },
          { key: 'growthRate', label: 'Monthly Growth Rate (%)', type: 'number', min: 0 }
        ];
    }
  }

  function calculateRevenue(month: number, cumulativeUsers: number = 0): { revenue: number; newCumulativeUsers: number } {
    const { businessModel } = idea;
    let revenue = 0;
    let newCumulativeUsers = cumulativeUsers;

    switch (businessModel) {
      case 'SAAS':
        const newUsers = parameters.usersPerMonth * (parameters.freeTrialConversionRate / 100);
        const churnedUsers = cumulativeUsers * (parameters.churnRate / 100);
        newCumulativeUsers = Math.max(0, cumulativeUsers + newUsers - churnedUsers);
        revenue = newCumulativeUsers * parameters.pricingTier;
        revenue += revenue * (parameters.upsellPercentage / 100);
        break;

      case 'Hardware + SAAS':
        const hardwareRevenue = parameters.averageUnitsPerMonth * (parameters.hardwareUnitCost * (1 + parameters.hardwareMarkup / 100));
        const saasRevenue = parameters.averageUnitsPerMonth * parameters.monthlySaasPrice;
        revenue = hardwareRevenue + saasRevenue;
        break;

      case 'Straight Sales':
        revenue = parameters.unitPrice * parameters.unitsPerMonth;
        if (month % 12 >= 9) {
          revenue *= (1 + parameters.seasonalUplift / 100);
        }
        break;

      case 'Subscription Product':
        const newSubs = parameters.subscribersPerMonth;
        const churnedSubs = cumulativeUsers * (parameters.churnRate / 100);
        newCumulativeUsers = Math.max(0, cumulativeUsers + newSubs - churnedSubs);
        revenue = newCumulativeUsers * parameters.monthlySubscriptionPrice;
        revenue += revenue * (parameters.upsellPercentage / 100);
        break;

      case 'Marketplace':
        const gmv = parameters.gmv * Math.pow(1 + parameters.monthlyGrowthRate / 100, month - 1);
        revenue = gmv * (parameters.takeRate / 100);
        break;

      default:
        revenue = parameters.monthlyRevenue * Math.pow(1 + parameters.growthRate / 100, month - 1);
        break;
    }

    revenue *= Math.pow(1 + growthAssumptions.monthlyGrowthRate / 100, month - 1);
    return { revenue, newCumulativeUsers };
  }

  function generateForecast() {
    const monthlyForecast = [];
    const annualForecast = [];
    let cumulativeUsers = 0;
    let breakEvenMonth: number | undefined;

    for (let month = 1; month <= forecastPeriod; month++) {
      const { revenue, newCumulativeUsers } = calculateRevenue(month, cumulativeUsers);
      cumulativeUsers = newCumulativeUsers;
      
      const costs = idea.ongoingMonthlyCost + (idea.ongoingAnnualCost / 12);
      const profit = revenue - costs;

      if (!breakEvenMonth && profit > 0) {
        breakEvenMonth = month;
      }

      monthlyForecast.push({
        month: ((month - 1) % 12) + 1,
        year: Math.floor((month - 1) / 12) + 1,
        revenue: Math.round(revenue),
        costs: Math.round(costs),
        profit: Math.round(profit)
      });
    }

    const years = Math.ceil(forecastPeriod / 12);
    for (let year = 1; year <= years; year++) {
      const yearlyData = monthlyForecast.filter(m => m.year === year);
      const annualRevenue = yearlyData.reduce((sum, m) => sum + m.revenue, 0);
      const annualCosts = yearlyData.reduce((sum, m) => sum + m.costs, 0);
      const annualProfit = annualRevenue - annualCosts;

      annualForecast.push({
        year,
        revenue: Math.round(annualRevenue),
        costs: Math.round(annualCosts),
        profit: Math.round(annualProfit)
      });
    }

    return {
      monthly: monthlyForecast,
      annual: annualForecast,
      breakEvenMonth
    };
  }

  const handleParameterChange = (key: string, value: number) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleGrowthAssumptionChange = (key: string, value: number) => {
    setGrowthAssumptions(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateForecast = () => {
    const newForecast = generateForecast();
    setForecast(newForecast);
    setActiveTab('forecast');
  };

  const handleSaveModel = () => {
    if (!forecast) return;

    const revenueModel = {
      businessModel: idea.businessModel,
      parameters,
      growthAssumptions,
      forecast,
      createdAt: idea.revenueModel?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onUpdateModel(revenueModel);
  };

  const exportToCSV = () => {
    if (!forecast) return;

    const csvData = [
      ['Year', 'Month', 'Revenue (£)', 'Costs (£)', 'Profit (£)'],
      ...forecast.monthly.map((row: any) => [
        row.year,
        row.month,
        row.revenue,
        row.costs,
        row.profit
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_revenue_forecast.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const parameterFields = getParameterFields(idea.businessModel);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{idea.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Revenue modeling for {idea.businessModel} business
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ← Back to Ideas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('parameters')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'parameters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Parameters
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'forecast'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!forecast}
            >
              📈 Forecast {forecast ? '✓' : ''}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {idea.businessModel} Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parameterFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.key.includes('Rate') || field.key.includes('Percentage') ? 0.1 : 1}
                        value={parameters[field.key] || 0}
                        onChange={(e) => handleParameterChange(field.key, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Assumptions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Growth Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={growthAssumptions.monthlyGrowthRate}
                      onChange={(e) => handleGrowthAssumptionChange('monthlyGrowthRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seasonal Uplift (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={growthAssumptions.seasonalUplift}
                      onChange={(e) => handleGrowthAssumptionChange('seasonalUplift', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forecast Period (months)
                    </label>
                    <select
                      value={forecastPeriod}
                      onChange={(e) => setForecastPeriod(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={12}>1 Year</option>
                      <option value={24}>2 Years</option>
                      <option value={36}>3 Years</option>
                      <option value={48}>4 Years</option>
                      <option value={60}>5 Years</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleGenerateForecast}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Forecast
                </button>
              </div>
            </div>
          )}

          {activeTab === 'forecast' && forecast && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-600">Year 1 Revenue</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(forecast.annual[0]?.revenue || 0)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">Year 1 Profit</div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(forecast.annual[0]?.profit || 0)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-600">Break-even</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {forecast.breakEvenMonth ? `Month ${forecast.breakEvenMonth}` : 'Not reached'}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">Total Forecast</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatCurrency(forecast.annual.reduce((sum: number, year: any) => sum + year.revenue, 0))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Forecast</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Costs
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {forecast.annual.map((year: any) => (
                        <tr key={year.year}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Year {year.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(year.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(year.costs)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            year.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(year.profit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {year.revenue > 0 ? ((year.profit / year.revenue) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  📊 Export CSV
                </button>
                <button
                  onClick={handleSaveModel}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  💾 Save Model
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 