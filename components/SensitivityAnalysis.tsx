import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement);

interface SensitivityAnalysisProps {
  baselineModel: any;
  onExport?: (format: 'csv' | 'pdf' | 'sheets') => void;
}

interface SensitivityParams {
  growthRate: number;
  churnRate: number;
  cac: number;
  upfrontCosts: number;
  pricingMultiplier: number;
}

interface Scenario {
  name: string;
  params: SensitivityParams;
  color: string;
}

const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({ baselineModel, onExport }) => {
  const [activeTab, setActiveTab] = useState<'sensitivity' | 'scenarios' | 'cac-ltv' | 'monte-carlo' | 'benchmarks'>('sensitivity');
  
  // Sensitivity Analysis State
  const [sensitivityParams, setSensitivityParams] = useState<SensitivityParams>({
    growthRate: 0, // ±% adjustment
    churnRate: 0,
    cac: 0,
    upfrontCosts: 0,
    pricingMultiplier: 0
  });

  // Scenario Comparison State
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      name: 'Base Case',
      params: { growthRate: 0, churnRate: 0, cac: 0, upfrontCosts: 0, pricingMultiplier: 0 },
      color: '#3B82F6'
    },
    {
      name: 'Aggressive Growth',
      params: { growthRate: 25, churnRate: -10, cac: 15, upfrontCosts: 50, pricingMultiplier: 20 },
      color: '#10B981'
    },
    {
      name: 'Conservative',
      params: { growthRate: -15, churnRate: 10, cac: -5, upfrontCosts: -20, pricingMultiplier: -10 },
      color: '#F59E0B'
    }
  ]);

  // Monte Carlo State
  const [monteCarloRuns, setMonteCarloRuns] = useState(1000);
  const [monteCarloResults, setMonteCarloResults] = useState<any[]>([]);

  // Calculate adjusted metrics based on sensitivity parameters
  const calculateAdjustedModel = (params: SensitivityParams) => {
    if (!baselineModel) return null;

    const baseGrowthRate = baselineModel.modelInputs?.saas?.growthRatesByYear?.[0]?.monthlyGrowthRate || 2;
    const baseChurnRate = baselineModel.modelInputs?.saas?.userChurnRate || 5;
    const baseCac = baselineModel.modelInputs?.saas?.cac || 50;
    const basePrice = baselineModel.modelInputs?.saas?.monthlyPriceTiers?.[0]?.price || 29;
    const baseUpfrontCosts = baselineModel.globalCosts?.upfrontCosts || 10000;

    const adjustedGrowthRate = baseGrowthRate * (1 + params.growthRate / 100);
    const adjustedChurnRate = Math.max(0, baseChurnRate * (1 + params.churnRate / 100));
    const adjustedCac = baseCac * (1 + params.cac / 100);
    const adjustedPrice = basePrice * (1 + params.pricingMultiplier / 100);
    const adjustedUpfrontCosts = baseUpfrontCosts * (1 + params.upfrontCosts / 100);

    // Calculate 5-year projections
    const projections = [];
    let users = baselineModel.modelInputs?.saas?.monthlyNewUserAcquisition || 100;
    let totalUsers = users;
    let totalRevenue = 0;
    let totalCosts = adjustedUpfrontCosts;

    for (let month = 1; month <= 60; month++) {
      // User growth with churn
      const newUsers = users * (1 + adjustedGrowthRate / 100);
      const churnedUsers = totalUsers * (adjustedChurnRate / 100 / 12);
      totalUsers = Math.max(0, totalUsers - churnedUsers + newUsers);
      
      // Revenue calculation
      const monthlyRevenue = totalUsers * adjustedPrice;
      totalRevenue += monthlyRevenue;
      
      // Cost calculation
      const acquisitionCosts = newUsers * adjustedCac;
      totalCosts += acquisitionCosts;
      
      users = newUsers;

      if (month % 12 === 0) {
        const year = month / 12;
        projections.push({
          year,
          users: Math.round(totalUsers),
          monthlyRevenue: Math.round(monthlyRevenue),
          annualRevenue: Math.round(monthlyRevenue * 12),
          totalRevenue: Math.round(totalRevenue),
          totalCosts: Math.round(totalCosts),
          profit: Math.round(totalRevenue - totalCosts),
          ltv: Math.round(adjustedPrice * 12 / (adjustedChurnRate / 100)),
          cacPaybackMonths: Math.round(adjustedCac / adjustedPrice)
        });
      }
    }

    return {
      params: {
        growthRate: adjustedGrowthRate,
        churnRate: adjustedChurnRate,
        cac: adjustedCac,
        price: adjustedPrice,
        upfrontCosts: adjustedUpfrontCosts
      },
      projections
    };
  };

  const currentModel = useMemo(() => calculateAdjustedModel(sensitivityParams), [sensitivityParams, baselineModel]);
  const scenarioModels = useMemo(() => scenarios.map(scenario => ({
    ...scenario,
    model: calculateAdjustedModel(scenario.params)
  })), [scenarios, baselineModel]);

  // Monte Carlo Simulation
  const runMonteCarloSimulation = () => {
    if (!baselineModel) return;

    const results = [];
    for (let i = 0; i < monteCarloRuns; i++) {
      // Random variations (normal distribution approximation)
      const randomParams: SensitivityParams = {
        growthRate: (Math.random() - 0.5) * 40, // ±20%
        churnRate: (Math.random() - 0.5) * 20, // ±10%
        cac: (Math.random() - 0.5) * 30, // ±15%
        upfrontCosts: (Math.random() - 0.5) * 60, // ±30%
        pricingMultiplier: (Math.random() - 0.5) * 40 // ±20%
      };

      const model = calculateAdjustedModel(randomParams);
      if (model && model.projections.length > 0) {
        const finalYear = model.projections[model.projections.length - 1];
        results.push({
          run: i + 1,
          finalRevenue: finalYear.totalRevenue,
          finalProfit: finalYear.profit,
          finalUsers: finalYear.users,
          ltv: finalYear.ltv,
          params: randomParams
        });
      }
    }
    setMonteCarloResults(results);
  };

  // CAC vs LTV Analysis
  const cacLtvAnalysis = useMemo(() => {
    if (!currentModel) return null;

    const analysis = currentModel.projections.map(projection => ({
      year: projection.year,
      cac: currentModel.params.cac,
      ltv: projection.ltv,
      ratio: projection.ltv / currentModel.params.cac,
      paybackMonths: projection.cacPaybackMonths
    }));

    return analysis;
  }, [currentModel]);

  // Market Benchmarks Integration
  const [marketBenchmarks, setMarketBenchmarks] = useState<any[]>([]);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  // Fetch market benchmarks on component mount
  useEffect(() => {
    const fetchBenchmarks = async () => {
      setBenchmarkLoading(true);
      try {
        const response = await fetch('/api/market-benchmarks');
        const data = await response.json();
        setMarketBenchmarks(data.benchmarks || []);
      } catch (error) {
        console.error('Failed to fetch market benchmarks:', error);
      } finally {
        setBenchmarkLoading(false);
      }
    };

    fetchBenchmarks();
  }, []);

  // Export Functions
  const handleExport = (format: 'csv' | 'pdf' | 'sheets') => {
    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      exportToPDF();
    } else if (format === 'sheets') {
      exportToGoogleSheets();
    }
  };

  const exportToCSV = () => {
    if (!currentModel) return;

    const csvData = [
      ['Year', 'Users', 'Monthly Revenue', 'Annual Revenue', 'Total Revenue', 'Total Costs', 'Profit', 'LTV', 'CAC Payback (months)'],
      ...currentModel.projections.map(p => [
        p.year, p.users, p.monthlyRevenue, p.annualRevenue, p.totalRevenue, p.totalCosts, p.profit, p.ltv, p.cacPaybackMonths
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensitivity_analysis.csv';
    a.click();
  };

  const exportToPDF = () => {
    // Implementation would use a PDF library like jsPDF
    alert('PDF export functionality would be implemented with jsPDF library');
  };

  const exportToGoogleSheets = () => {
    // Implementation would use Google Sheets API
    alert('Google Sheets integration would require Google Sheets API setup');
  };

  if (!baselineModel) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No baseline model available for sensitivity analysis.</p>
          <p className="text-sm mt-2">Please configure and save a business model first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">📊 Advanced Analytics & Sensitivity Analysis</h2>
        <p className="text-gray-600 mt-1">Analyze scenarios, test assumptions, and export insights</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'sensitivity', name: '🎚️ Sensitivity Analysis', desc: 'Adjust parameters with sliders' },
            { id: 'scenarios', name: '📈 Scenario Comparison', desc: 'Base vs Aggressive vs Conservative' },
            { id: 'cac-ltv', name: '💰 CAC vs LTV', desc: 'Customer economics analysis' },
            { id: 'monte-carlo', name: '🎲 Monte Carlo', desc: 'Risk & probability modeling' },
            { id: 'benchmarks', name: '📊 Market Benchmarks', desc: 'Industry comparison data' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div>
                <div>{tab.name}</div>
                <div className="text-xs text-gray-400 mt-1">{tab.desc}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Sensitivity Analysis Tab */}
        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parameter Sliders */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Adjust Parameters</h3>
                
                {/* Growth Rate Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Growth Rate: {sensitivityParams.growthRate > 0 ? '+' : ''}{sensitivityParams.growthRate.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="0.5"
                    value={sensitivityParams.growthRate}
                    onChange={(e) => setSensitivityParams(prev => ({ ...prev, growthRate: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>

                {/* Churn Rate Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Churn Rate: {sensitivityParams.churnRate > 0 ? '+' : ''}{sensitivityParams.churnRate.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={sensitivityParams.churnRate}
                    onChange={(e) => setSensitivityParams(prev => ({ ...prev, churnRate: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-20%</span>
                    <span>0%</span>
                    <span>+20%</span>
                  </div>
                </div>

                {/* CAC Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Acquisition Cost: {sensitivityParams.cac > 0 ? '+' : ''}{sensitivityParams.cac.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={sensitivityParams.cac}
                    onChange={(e) => setSensitivityParams(prev => ({ ...prev, cac: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-30%</span>
                    <span>0%</span>
                    <span>+30%</span>
                  </div>
                </div>

                {/* Upfront Costs Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upfront Costs: {sensitivityParams.upfrontCosts > 0 ? '+' : ''}{sensitivityParams.upfrontCosts.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    step="5"
                    value={sensitivityParams.upfrontCosts}
                    onChange={(e) => setSensitivityParams(prev => ({ ...prev, upfrontCosts: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+100%</span>
                  </div>
                </div>

                {/* Pricing Multiplier Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing: {sensitivityParams.pricingMultiplier > 0 ? '+' : ''}{sensitivityParams.pricingMultiplier.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="2"
                    value={sensitivityParams.pricingMultiplier}
                    onChange={(e) => setSensitivityParams(prev => ({ ...prev, pricingMultiplier: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-40%</span>
                    <span>0%</span>
                    <span>+40%</span>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => setSensitivityParams({ growthRate: 0, churnRate: 0, cac: 0, upfrontCosts: 0, pricingMultiplier: 0 })}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Reset to Baseline
                </button>
              </div>

              {/* Impact Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Impact Summary</h3>
                {currentModel && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Adjusted Growth Rate</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {currentModel.params.growthRate.toFixed(2)}%/month
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Adjusted Churn Rate</div>
                        <div className="text-lg font-semibold text-red-600">
                          {currentModel.params.churnRate.toFixed(2)}%/year
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Adjusted CAC</div>
                        <div className="text-lg font-semibold text-purple-600">
                          ${currentModel.params.cac.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Adjusted Price</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${currentModel.params.price.toFixed(0)}/month
                        </div>
                      </div>
                    </div>
                    
                    {currentModel.projections.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">5-Year Projections</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Total Revenue</div>
                            <div className="text-xl font-bold text-green-600">
                              ${currentModel.projections[currentModel.projections.length - 1].totalRevenue.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Total Profit</div>
                            <div className={`text-xl font-bold ${currentModel.projections[currentModel.projections.length - 1].profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${currentModel.projections[currentModel.projections.length - 1].profit.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Chart */}
            {currentModel && currentModel.projections.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Projection</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: currentModel.projections.map(p => `Year ${p.year}`),
                      datasets: [
                        {
                          label: 'Total Revenue',
                          data: currentModel.projections.map(p => p.totalRevenue),
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4
                        },
                        {
                          label: 'Total Costs',
                          data: currentModel.projections.map(p => p.totalCosts),
                          borderColor: '#EF4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '$' + (value as number).toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scenario Comparison Tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Scenario Comparison</h3>
              <button
                onClick={() => {/* Add custom scenario logic */}}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Custom Scenario
              </button>
            </div>

            {/* Scenario Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarioModels.map((scenario, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4" style={{ borderLeft: `4px solid ${scenario.color}` }}>
                  <h4 className="font-medium text-gray-900 mb-2">{scenario.name}</h4>
                  {scenario.model && scenario.model.projections.length > 0 && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">5-Year Revenue</div>
                        <div className="text-lg font-semibold" style={{ color: scenario.color }}>
                          ${scenario.model.projections[scenario.model.projections.length - 1].totalRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">5-Year Profit</div>
                        <div className="text-sm font-medium">
                          ${scenario.model.projections[scenario.model.projections.length - 1].profit.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Final Users</div>
                        <div className="text-sm font-medium">
                          {scenario.model.projections[scenario.model.projections.length - 1].users.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Comparison Chart */}
            {scenarioModels.length > 0 && scenarioModels[0].model && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Comparison</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: scenarioModels[0].model.projections.map(p => `Year ${p.year}`),
                      datasets: scenarioModels.map(scenario => ({
                        label: scenario.name,
                        data: scenario.model?.projections.map(p => p.totalRevenue) || [],
                        borderColor: scenario.color,
                        backgroundColor: scenario.color + '20',
                        tension: 0.4
                      }))
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '$' + (value as number).toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CAC vs LTV Tab */}
        {activeTab === 'cac-ltv' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Customer Acquisition Cost vs Lifetime Value Analysis</h3>
            
            {cacLtvAnalysis && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium">Current CAC</div>
                    <div className="text-2xl font-bold text-blue-900">
                      ${currentModel?.params.cac.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Current LTV</div>
                    <div className="text-2xl font-bold text-green-900">
                      ${cacLtvAnalysis[cacLtvAnalysis.length - 1]?.ltv.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 font-medium">LTV:CAC Ratio</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.ratio.toFixed(1)}:1
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.ratio >= 3 ? '✅ Healthy' : '⚠️ Needs improvement'}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-orange-600 font-medium">Payback Period</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.paybackMonths} months
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.paybackMonths <= 12 ? '✅ Good' : '⚠️ Too long'}
                    </div>
                  </div>
                </div>

                {/* LTV:CAC Ratio Chart */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">LTV:CAC Ratio Over Time</h4>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: cacLtvAnalysis.map(p => `Year ${p.year}`),
                        datasets: [
                          {
                            label: 'LTV:CAC Ratio',
                            data: cacLtvAnalysis.map(p => p.ratio),
                            borderColor: '#8B5CF6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            tension: 0.4
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return (value as number).toFixed(1) + ':1';
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="inline-block w-3 h-3 bg-green-200 rounded mr-2"></span>
                    Healthy ratio is typically 3:1 or higher
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">💡 Recommendations</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.ratio < 3 && (
                      <div>• Consider reducing CAC through more efficient marketing channels</div>
                    )}
                    {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.ratio < 3 && (
                      <div>• Increase LTV by improving retention or expanding revenue per customer</div>
                    )}
                    {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.paybackMonths > 12 && (
                      <div>• Payback period is too long - consider pricing optimization</div>
                    )}
                    {cacLtvAnalysis[cacLtvAnalysis.length - 1]?.ratio >= 3 && (
                      <div>• ✅ Healthy unit economics - consider scaling acquisition</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Monte Carlo Tab */}
        {activeTab === 'monte-carlo' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Monte Carlo Simulation</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm text-gray-600">Simulation Runs</label>
                  <select
                    value={monteCarloRuns}
                    onChange={(e) => setMonteCarloRuns(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={100}>100 runs</option>
                    <option value={500}>500 runs</option>
                    <option value={1000}>1,000 runs</option>
                    <option value={5000}>5,000 runs</option>
                  </select>
                </div>
                <button
                  onClick={runMonteCarloSimulation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Run Simulation
                </button>
              </div>
            </div>

            {monteCarloResults.length > 0 && (
              <>
                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(() => {
                    const revenues = monteCarloResults.map(r => r.finalRevenue);
                    const profits = monteCarloResults.map(r => r.finalProfit);
                    const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
                    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
                    const profitableRuns = profits.filter(p => p > 0).length;
                    const profitability = (profitableRuns / profits.length) * 100;

                    return (
                      <>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm text-blue-600 font-medium">Avg 5-Year Revenue</div>
                          <div className="text-2xl font-bold text-blue-900">
                            ${avgRevenue.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm text-green-600 font-medium">Avg 5-Year Profit</div>
                          <div className="text-2xl font-bold text-green-900">
                            ${avgProfit.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-sm text-purple-600 font-medium">Profitability Rate</div>
                          <div className="text-2xl font-bold text-purple-900">
                            {profitability.toFixed(1)}%
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            {profitableRuns} of {monteCarloRuns} runs
                          </div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="text-sm text-orange-600 font-medium">Risk Level</div>
                          <div className="text-2xl font-bold text-orange-900">
                            {profitability >= 80 ? 'Low' : profitability >= 60 ? 'Medium' : 'High'}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            Based on profitability rate
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Distribution Chart */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Revenue Distribution</h4>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: (() => {
                          const revenues = monteCarloResults.map(r => r.finalRevenue);
                          const min = Math.min(...revenues);
                          const max = Math.max(...revenues);
                          const buckets = 10;
                          const bucketSize = (max - min) / buckets;
                          return Array.from({length: buckets}, (_, i) => 
                            `$${((min + i * bucketSize) / 1000).toFixed(0)}k`
                          );
                        })(),
                        datasets: [{
                          label: 'Frequency',
                          data: (() => {
                            const revenues = monteCarloResults.map(r => r.finalRevenue);
                            const min = Math.min(...revenues);
                            const max = Math.max(...revenues);
                            const buckets = 10;
                            const bucketSize = (max - min) / buckets;
                            const distribution = new Array(buckets).fill(0);
                            
                            revenues.forEach(revenue => {
                              const bucketIndex = Math.min(Math.floor((revenue - min) / bucketSize), buckets - 1);
                              distribution[bucketIndex]++;
                            });
                            
                            return distribution;
                          })(),
                          backgroundColor: 'rgba(59, 130, 246, 0.6)',
                          borderColor: '#3B82F6',
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          title: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Simulations'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: '5-Year Revenue'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Market Benchmarks Tab */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Market Benchmarks & Industry Comparison</h3>
              {benchmarkLoading && (
                <div className="text-sm text-gray-500">Loading benchmarks...</div>
              )}
            </div>

            {marketBenchmarks.length > 0 && (
              <>
                {/* Benchmark Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketBenchmarks.slice(0, 6).map((benchmark, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{benchmark.industry}</h4>
                          <p className="text-sm text-gray-600">{benchmark.businessModel}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {benchmark.source?.split(' ')[0]}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {benchmark.metrics.cac && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">CAC:</span>
                            <span className="text-sm font-medium">${benchmark.metrics.cac}</span>
                          </div>
                        )}
                        {benchmark.metrics.ltv && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">LTV:</span>
                            <span className="text-sm font-medium">${benchmark.metrics.ltv}</span>
                          </div>
                        )}
                        {benchmark.metrics.ltvCacRatio && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">LTV:CAC:</span>
                            <span className="text-sm font-medium">{benchmark.metrics.ltvCacRatio}:1</span>
                          </div>
                        )}
                        {benchmark.metrics.monthlyChurnRate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Churn:</span>
                            <span className="text-sm font-medium">{benchmark.metrics.monthlyChurnRate}%/mo</span>
                          </div>
                        )}
                        {benchmark.metrics.monthlyGrowthRate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Growth:</span>
                            <span className="text-sm font-medium">{benchmark.metrics.monthlyGrowthRate}%/mo</span>
                          </div>
                        )}
                        {benchmark.metrics.grossMargin && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Gross Margin:</span>
                            <span className="text-sm font-medium">{benchmark.metrics.grossMargin}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Your Model vs Industry Average */}
                {currentModel && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Your Model vs Industry Benchmarks</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* CAC Comparison */}
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Customer Acquisition Cost</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              ${currentModel.params.cac.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500">Your Model</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">
                              ${marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.cac || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Industry Avg</div>
                          </div>
                        </div>
                      </div>

                      {/* Growth Rate Comparison */}
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Monthly Growth Rate</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {currentModel.params.growthRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Your Model</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">
                              {marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.monthlyGrowthRate || 'N/A'}%
                            </div>
                            <div className="text-xs text-gray-500">Industry Avg</div>
                          </div>
                        </div>
                      </div>

                      {/* Churn Rate Comparison */}
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Monthly Churn Rate</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-red-600">
                              {currentModel.params.churnRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Your Model</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">
                              {marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.monthlyChurnRate || 'N/A'}%
                            </div>
                            <div className="text-xs text-gray-500">Industry Avg</div>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Comparison */}
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Monthly Price</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-purple-600">
                              ${currentModel.params.price.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500">Your Model</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">
                              ${marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.averageRevenuePerUser || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Industry Avg</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Indicators */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          currentModel.params.cac < (marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.cac || Infinity) 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentModel.params.cac < (marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.cac || Infinity) ? '✅' : '⚠️'}
                        </div>
                        <div className="text-sm text-gray-600">CAC vs Industry</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          currentModel.params.growthRate > (marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.monthlyGrowthRate || 0) 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentModel.params.growthRate > (marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.monthlyGrowthRate || 0) ? '✅' : '⚠️'}
                        </div>
                        <div className="text-sm text-gray-600">Growth vs Industry</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          currentModel.params.churnRate < (marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.monthlyChurnRate || 0) 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentModel.params.churnRate < (marketBenchmarks.find(b => b.businessModel === 'SAAS')?.metrics.monthlyChurnRate || 0) ? '✅' : '⚠️'}
                        </div>
                        <div className="text-sm text-gray-600">Churn vs Industry</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Sources */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📊 Data Sources</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                    {Array.from(new Set(marketBenchmarks.map(b => b.source))).map((source, index) => (
                      <div key={index}>• {source}</div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Benchmark data is updated regularly from industry reports and surveys. 
                    Use this data as guidance - your specific market conditions may vary.
                  </p>
                </div>
              </>
            )}

            {!benchmarkLoading && marketBenchmarks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>No benchmark data available</p>
                <p className="text-sm">Market benchmarks will be loaded automatically</p>
              </div>
            )}
          </div>
        )}

        {/* Export Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Analysis</h3>
              <p className="text-sm text-gray-600">Download your analysis in various formats</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                📊 Export CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                📄 Export PDF
              </button>
              <button
                onClick={() => handleExport('sheets')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                📈 Google Sheets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitivityAnalysis; 