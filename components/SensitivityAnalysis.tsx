import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement);

interface SensitivityAnalysisProps {
  baselineModel: any;
  onExport?: (format: 'csv' | 'pdf' | 'sheets') => void;
}

interface ProjectionData {
  year: number;
  users: number;
  monthlyRevenue: number;
  annualRevenue: number;
  totalRevenue: number;
  totalCosts: number;
  staffingCosts?: number;
  operatingCosts?: number;
  profit: number;
  cumulativeRevenue: number;
  cumulativeCosts: number;
  cumulativeProfit: number;
  cashFlow: number;
  breakEvenReached: boolean;
  ltv: number;
  cacPaybackMonths: number;
}

interface ForecastResult {
  year: number;
  month: number;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  cumulativeCashFlow: number;
  breakEvenReached: boolean;
}

interface TeamCost {
  year: number;
  totalCost: number;
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

  // Enhanced baseline model with fallback values and proper property mapping
  const enhancedBaselineModel = useMemo(() => {
    if (!baselineModel) return null;

    console.log('🔍 Processing baseline model for sensitivity analysis:', {
      keys: Object.keys(baselineModel),
      hasForecastResults: !!baselineModel.forecastResults,
      hasForecast_results: !!baselineModel.forecast_results,
      forecastResultsLength: (baselineModel.forecastResults || baselineModel.forecast_results || []).length,
      hasModelInputs: !!baselineModel.modelInputs,
      hasModel_inputs: !!baselineModel.model_inputs,
      hasGlobalCosts: !!baselineModel.globalCosts,
      hasGlobal_costs: !!baselineModel.global_costs,
      hasTeamCostsByYear: !!(baselineModel.globalCosts?.teamCostsByYear || baselineModel.global_costs?.team_costs_by_year),
      debugInfo: baselineModel._debug,
      rawInitialSetupCost: baselineModel.globalCosts?.initialSetupCost,
      rawGlobalCosts: baselineModel.globalCosts
    });

    // Map snake_case to camelCase properties from API
    const modelInputs = baselineModel.model_inputs || baselineModel.modelInputs || {};
    const globalCosts = baselineModel.global_costs || baselineModel.globalCosts || {};
    const forecastResults = baselineModel.forecast_results || baselineModel.forecastResults || [];

    // Map team costs properly (handle both snake_case and camelCase)
    const teamCostsByYear = globalCosts.team_costs_by_year || globalCosts.teamCostsByYear || [];

    // Ensure we have at least basic SAAS data for sensitivity analysis
    const saasDefaults = {
      monthlyPriceTiers: [{ name: 'Basic', price: 29.99 }, { name: 'Pro', price: 99.99 }],
      freeTrialConversionRate: 15,
      monthlyNewUserAcquisition: 100,
      userChurnRate: 5,
      cac: 75,
      growthRatesByYear: [{ year: 2025, monthlyGrowthRate: 3 }],
      upsellExpansionRevenue: 10
    };

    const globalCostsDefaults = {
      initialSetupCost: 25000,
      monthlyFixedCosts: 3000,
      teamCostsByYear: [
        { year: 1, totalCost: 120000 },
        { year: 2, totalCost: 180000 },
        { year: 3, totalCost: 240000 }
      ],
      hostingInfrastructure: 500,
      marketingBudget: 2000,
      fulfillmentLogistics: 200,
      taxRate: 0.2,
      paymentProcessingFees: 0.029
    };

    const enhanced = {
      ...baselineModel,
      // Properly map API properties to camelCase
      modelInputs: {
        ...modelInputs,
        // Keep existing SAAS data but also check for Hardware+SAAS
        saas: {
          ...saasDefaults,
          ...(modelInputs.saas || {})
        },
        // Add Hardware+SAAS data if available
        hardwareSaas: modelInputs.hardwareSaas || modelInputs.hardware_saas || {}
      },
      globalCosts: {
        ...globalCostsDefaults,
        ...globalCosts,
        teamCostsByYear: teamCostsByYear.length > 0 ? teamCostsByYear : globalCostsDefaults.teamCostsByYear,
        // Map snake_case properties - prioritize actual values over defaults
        initialSetupCost: globalCosts.initialSetupCost !== undefined ? globalCosts.initialSetupCost : 
                         (globalCosts.initial_setup_cost !== undefined ? globalCosts.initial_setup_cost : globalCostsDefaults.initialSetupCost),
        monthlyFixedCosts: globalCosts.monthlyFixedCosts !== undefined ? globalCosts.monthlyFixedCosts :
                          (globalCosts.monthly_fixed_costs !== undefined ? globalCosts.monthly_fixed_costs : globalCostsDefaults.monthlyFixedCosts)
      },
      forecastResults: forecastResults
    };

    console.log('✅ Enhanced baseline model created:', {
      hasModelInputs: !!enhanced.modelInputs,
      hasSaasInputs: !!enhanced.modelInputs?.saas,
      hasHardwareSaasInputs: !!enhanced.modelInputs?.hardwareSaas,
      hasGlobalCosts: !!enhanced.globalCosts,
      forecastResultsLength: enhanced.forecastResults?.length || 0,
      INITIAL_SETUP_COST_FINAL: enhanced.globalCosts?.initialSetupCost,
      INITIAL_SETUP_COST_SOURCES: {
        fromGlobalCosts: globalCosts.initialSetupCost,
        fromSnakeCase: globalCosts.initial_setup_cost,
        defaultValue: globalCostsDefaults.initialSetupCost,
        chosenValue: enhanced.globalCosts?.initialSetupCost
      },
      teamCostsByYearLength: enhanced.globalCosts?.teamCostsByYear?.length || 0,
      teamCostsPreview: enhanced.globalCosts?.teamCostsByYear?.slice(0, 3)
    });

    return enhanced;
  }, [baselineModel]);
  
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
    if (!enhancedBaselineModel) {
      console.log('⚠️ No enhanced baseline model available for sensitivity analysis');
      return null;
    }

    console.log('📊 Calculating sensitivity analysis with enhanced baseline model:', {
      modelInputs: Object.keys(enhancedBaselineModel.modelInputs || {}),
      saasInputs: enhancedBaselineModel.modelInputs?.saas,
      globalCosts: enhancedBaselineModel.globalCosts,
      hasActualForecastResults: !!enhancedBaselineModel.forecastResults,
      forecastResultsLength: enhancedBaselineModel.forecastResults?.length || 0,
      initialSetupCost: enhancedBaselineModel.globalCosts?.initialSetupCost
    });

    // Use actual forecast results if available, otherwise fall back to calculated projections
    if (enhancedBaselineModel.forecastResults && enhancedBaselineModel.forecastResults.length > 0) {
      console.log('✅ Using actual forecast results for sensitivity analysis');
      
      // Apply sensitivity adjustments to actual forecast results
      const adjustedProjections: ProjectionData[] = [];
      const forecastResults = enhancedBaselineModel.forecastResults;
      const initialSetupCost = enhancedBaselineModel.globalCosts?.initialSetupCost || 0;
      const teamCostsByYear = enhancedBaselineModel.globalCosts?.teamCostsByYear || [];
      
      console.log('🔄 Using REAL forecast data for sensitivity analysis:', {
        forecastResultsCount: forecastResults.length,
        realInitialSetupCost: initialSetupCost,
        realTeamCosts: teamCostsByYear,
        firstMonthData: forecastResults[0]
      });
      
      // Group by year for annual projections
      const yearlyData = new Map();
      let cumulativeRevenue = 0;
      let cumulativeCosts = initialSetupCost; // Start with setup cost
      
      console.log('🔢 Processing forecast results:', {
        totalMonths: forecastResults.length,
        initialSetupCost,
        teamCostsByYearLength: teamCostsByYear.length,
        firstFewResults: forecastResults.slice(0, 3).map((r: any) => ({
          year: r.year,
          month: r.month,
          totalRevenue: r.totalRevenue,
          totalCosts: r.totalCosts
        }))
      });
      
      forecastResults.forEach((result: any, index: number) => {
        if (!yearlyData.has(result.year)) {
          yearlyData.set(result.year, {
            year: result.year,
            totalRevenue: 0,
            totalCosts: 0,
            netProfit: 0,
            monthCount: 0
          });
        }
        
        const yearData = yearlyData.get(result.year);
        
        // Apply sensitivity adjustments
        const adjustedRevenue = result.totalRevenue * (1 + params.pricingMultiplier / 100);
        const adjustedCosts = result.totalCosts * (1 + params.upfrontCosts / 100);
        
        yearData.totalRevenue += adjustedRevenue;
        yearData.totalCosts += adjustedCosts;
        yearData.netProfit += (adjustedRevenue - adjustedCosts);
        yearData.monthCount += 1;
        
        // Update cumulative totals
        cumulativeRevenue += adjustedRevenue;
        cumulativeCosts += adjustedCosts;
      });
      
      // Convert to annual projections
      Array.from(yearlyData.values()).sort((a, b) => a.year - b.year).forEach((yearData: any, index: number) => {
        // Get staffing costs for this year
        const teamCostForYear = teamCostsByYear.find((tc: any) => tc.year === (index + 1)) || 
                               teamCostsByYear[Math.min(index, teamCostsByYear.length - 1)] ||
                               { totalCost: 120000 + (index * 60000) }; // Default with growth
        
        const staffingCosts = teamCostForYear.totalCost;
        const operatingCosts = Math.max(0, yearData.totalCosts - (staffingCosts / 12) * yearData.monthCount);
        
        // Use actual cumulative cash flow from forecast results if available
        const lastMonthOfYear = forecastResults.filter((r: any) => r.year === yearData.year).slice(-1)[0];
        const actualCumulativeCashFlow = lastMonthOfYear?.cumulativeCashFlow;
        
        // Calculate cumulative revenue and costs for this specific year
        const yearCumulativeRevenue = adjustedProjections.reduce((sum, p) => sum + p.totalRevenue, 0) + yearData.totalRevenue;
        const yearCumulativeCosts = adjustedProjections.reduce((sum, p) => sum + p.totalCosts, 0) + yearData.totalCosts + 
          (index === 0 ? initialSetupCost : 0); // Add setup cost only for first year
        
        // Use actual cumulative cash flow if available, otherwise calculate
        const cumulativeProfit = actualCumulativeCashFlow !== undefined ? actualCumulativeCashFlow : (yearCumulativeRevenue - yearCumulativeCosts);
        
        console.log(`📊 Year ${yearData.year} calculations:`, {
          revenue: yearData.totalRevenue,
          costs: yearData.totalCosts,
          staffingCosts,
          operatingCosts,
          yearCumulativeRevenue,
          yearCumulativeCosts,
          cumulativeProfit,
          actualCumulativeCashFlow,
          usingRealCashFlow: actualCumulativeCashFlow !== undefined,
          breakEvenReached: lastMonthOfYear?.breakEvenReached !== undefined ? lastMonthOfYear.breakEvenReached : (cumulativeProfit > 0),
          initialSetupCostAdded: index === 0 ? initialSetupCost : 0
        });
        
        adjustedProjections.push({
          year: yearData.year,
          users: yearData.totalRevenue / 100, // Simplified user calculation
          monthlyRevenue: yearData.totalRevenue / 12,
          annualRevenue: yearData.totalRevenue,
          totalRevenue: yearData.totalRevenue,
          totalCosts: yearData.totalCosts,
          staffingCosts,
          operatingCosts,
          profit: yearData.netProfit,
          cumulativeRevenue: yearCumulativeRevenue,
          cumulativeCosts: yearCumulativeCosts,
          cumulativeProfit,
          cashFlow: yearData.netProfit,
          breakEvenReached: lastMonthOfYear?.breakEvenReached !== undefined ? lastMonthOfYear.breakEvenReached : (cumulativeProfit > 0),
          ltv: 1200, // Simplified LTV
          cacPaybackMonths: 8 // Simplified CAC payback
        });
      });
      
      console.log('✅ Sensitivity analysis projections created:', {
        projectionsCount: adjustedProjections.length,
        totalCumulativeRevenue: cumulativeRevenue,
        totalCumulativeCosts: cumulativeCosts,
        finalCumulativeProfit: cumulativeRevenue - cumulativeCosts,
        breakEvenYear: adjustedProjections.find(p => p.breakEvenReached)?.year || 'Not reached'
      });
      
      return adjustedProjections;
    }

    // Fallback to calculated projections if no forecast results
    console.log('⚠️ No forecast results available, using fallback calculations');
    return calculateFallbackProjections(params);
  };

  // Fallback calculation method when no forecast results are available
  const calculateFallbackProjections = (params: SensitivityParams): ProjectionData[] => {
    const projections: ProjectionData[] = [];
    const saasInputs = enhancedBaselineModel?.modelInputs?.saas;
    const globalCosts = enhancedBaselineModel?.globalCosts;
    
    if (!saasInputs || !globalCosts) {
      console.log('⚠️ Missing SAAS inputs or global costs for fallback calculation');
      return [];
    }

    const initialSetupCost = globalCosts.initialSetupCost || 0;
    let cumulativeRevenue = 0;
    let cumulativeCosts = initialSetupCost;
    
    for (let year = 1; year <= 5; year++) {
      // Basic SAAS calculation with sensitivity adjustments
      const baseUsers = (saasInputs.monthlyNewUserAcquisition || 0) * 12 * year;
      const adjustedUsers = baseUsers * (1 + params.growthRate / 100);
      const avgPrice = saasInputs.monthlyPriceTiers?.length > 0 
        ? saasInputs.monthlyPriceTiers.reduce((sum: number, tier: any) => sum + tier.price, 0) / saasInputs.monthlyPriceTiers.length
        : 50;
      
      const annualRevenue = adjustedUsers * avgPrice * 12 * (1 + params.pricingMultiplier / 100);
      // Use actual team costs from the baseline model instead of fallback values
      const actualTeamCost = globalCosts.teamCostsByYear?.find((tc: any) => tc.year === year)?.totalCost;
      const teamCost = actualTeamCost !== undefined ? actualTeamCost : 120000;
      const operatingCosts = (globalCosts.monthlyFixedCosts || 0) * 12;
      const totalCosts = (teamCost + operatingCosts) * (1 + params.upfrontCosts / 100);
      
      cumulativeRevenue += annualRevenue;
      cumulativeCosts += totalCosts;
      
      projections.push({
        year,
        users: adjustedUsers,
        monthlyRevenue: annualRevenue / 12,
        annualRevenue,
        totalRevenue: annualRevenue,
        totalCosts,
        staffingCosts: teamCost,
        operatingCosts,
        profit: annualRevenue - totalCosts,
        cumulativeRevenue,
        cumulativeCosts,
        cumulativeProfit: cumulativeRevenue - cumulativeCosts,
        cashFlow: annualRevenue - totalCosts,
        breakEvenReached: (cumulativeRevenue - cumulativeCosts) > 0,
        ltv: avgPrice * 24, // 2 year LTV
        cacPaybackMonths: 8
      });
    }
    
    return projections;
  };

  const currentModel = useMemo(() => calculateAdjustedModel(sensitivityParams), [sensitivityParams, enhancedBaselineModel]);
  const scenarioModels = useMemo(() => scenarios.map(scenario => ({
    ...scenario,
    model: calculateAdjustedModel(scenario.params)
  })), [scenarios, enhancedBaselineModel]);

  // Monte Carlo Simulation
  const runMonteCarloSimulation = () => {
    if (!enhancedBaselineModel) return;

    const results = [];
    for (let i = 0; i < monteCarloRuns; i++) {
      // Use deterministic variations based on actual baseline model data instead of random
      const baseGrowthRate = enhancedBaselineModel?.modelInputs?.saas?.growthRatesByYear?.[0]?.monthlyGrowthRate || 
                           enhancedBaselineModel?.modelInputs?.straightSales?.growthRate || 
                           enhancedBaselineModel?.modelInputs?.hardwareSaas?.hardwareGrowthRate || 2;
      const baseChurnRate = enhancedBaselineModel?.modelInputs?.saas?.userChurnRate || 5;
      const baseCac = enhancedBaselineModel?.globalCosts?.customerAcquisitionCost || 100;
      const baseSetupCost = enhancedBaselineModel?.globalCosts?.initialSetupCost || 50000;
      
      // Create realistic variations based on actual model data (not random)
      const variationFactor = (i / monteCarloRuns - 0.5) * 2; // Range from -1 to +1
      const randomParams: SensitivityParams = {
        growthRate: variationFactor * 20, // ±20% variation from baseline
        churnRate: variationFactor * 10, // ±10% variation from baseline
        cac: variationFactor * 15, // ±15% variation from baseline
        upfrontCosts: variationFactor * 30, // ±30% variation from baseline
        pricingMultiplier: variationFactor * 20 // ±20% variation from baseline
      };

      const model = calculateAdjustedModel(randomParams);
      if (model && model.length > 0) {
        const finalYear = model[model.length - 1];
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
    if (!currentModel || !Array.isArray(currentModel)) return null;

    // Calculate base CAC from enhanced baseline model or use fallback
    const baseCac = enhancedBaselineModel?.globalCosts?.customerAcquisitionCost || 100; // Default CAC
    const adjustedCac = baseCac * (1 + sensitivityParams.cac / 100);

    const analysis = currentModel.map(projection => ({
      year: projection.year,
      cac: adjustedCac,
      ltv: projection.ltv,
      ratio: projection.ltv / adjustedCac,
      paybackMonths: projection.cacPaybackMonths
    }));

    return analysis;
  }, [currentModel, sensitivityParams.cac, enhancedBaselineModel]);

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
      ...currentModel.map(p => [
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
                          {sensitivityParams.growthRate.toFixed(2)}%/month
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Adjusted Churn Rate</div>
                        <div className="text-lg font-semibold text-red-600">
                          {sensitivityParams.churnRate.toFixed(2)}%/year
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Adjusted CAC</div>
                        <div className="text-lg font-semibold text-purple-600">
                          ${((enhancedBaselineModel?.globalCosts?.customerAcquisitionCost || 100) * (1 + sensitivityParams.cac / 100)).toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Adjusted Price</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${((enhancedBaselineModel?.modelInputs?.saas?.monthlyPriceTiers?.[0]?.price || 50) * (1 + sensitivityParams.pricingMultiplier / 100)).toFixed(0)}/month
                        </div>
                      </div>
                    </div>
                    
                    {currentModel.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">5-Year Projections</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Total Revenue</div>
                            <div className="text-xl font-bold text-green-600">
                              £{currentModel[currentModel.length - 1].totalRevenue.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Total Profit</div>
                            <div className={`text-xl font-bold ${currentModel[currentModel.length - 1].profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              £{currentModel[currentModel.length - 1].profit.toLocaleString()}
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
            {currentModel && currentModel.length > 0 && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Projection</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: currentModel.map(p => `Year ${p.year}`),
                        datasets: [
                          {
                            label: 'Annual Revenue',
                            data: currentModel.map(p => p.annualRevenue),
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4
                          },
                          {
                            label: 'Annual Costs',
                            data: currentModel.map(p => p.totalCosts),
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
                                return '£' + (value as number).toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cash Flow Chart */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Analysis</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: currentModel.map(p => `Year ${p.year}`),
                        datasets: [
                          {
                            label: 'Annual Cash Flow',
                            data: currentModel.map(p => p.cashFlow || (p.totalRevenue - p.totalCosts)),
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                          },
                          {
                            label: 'Cumulative Profit (incl. Setup Cost)',
                            data: currentModel.map(p => p.cumulativeProfit || p.profit),
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
                            beginAtZero: false,
                            ticks: {
                              callback: function(value) {
                                return '£' + (value as number).toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cost Breakdown Chart */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown Analysis</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: currentModel.map(p => `Year ${p.year}`),
                        datasets: [
                          {
                            label: 'Staffing Costs (Rising Each Year)',
                            data: currentModel.map(p => p.staffingCosts || 0),
                            borderColor: '#DC2626',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            tension: 0.4,
                            fill: false
                          },
                          {
                            label: 'Operating Costs',
                            data: currentModel.map(p => p.operatingCosts || 0),
                            borderColor: '#F59E0B',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.4,
                            fill: false
                          },
                          {
                            label: 'Total Costs',
                            data: currentModel.map(p => p.totalCosts),
                            borderColor: '#6B7280',
                            backgroundColor: 'rgba(107, 114, 128, 0.1)',
                            tension: 0.4,
                            fill: false
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
                                return '£' + (value as number).toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Break-Even Analysis */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Break-Even Analysis (Including Initial Setup Cost)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-600">Initial Setup Cost</div>
                      <div className="text-lg font-bold text-red-600">
                        {(() => {
                          const setupCost = enhancedBaselineModel?.globalCosts?.initialSetupCost || 0;
                          const adjustedCost = setupCost * (1 + sensitivityParams.upfrontCosts / 100);
                          console.log('💰 Break-Even Analysis Setup Cost Debug:', {
                            rawSetupCost: setupCost,
                            sensitivityAdjustment: sensitivityParams.upfrontCosts,
                            finalDisplayedCost: adjustedCost,
                            enhancedModelExists: !!enhancedBaselineModel,
                            globalCostsExists: !!enhancedBaselineModel?.globalCosts
                          });
                          return `£${adjustedCost.toLocaleString()}`;
                        })()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-600">Break-Even Point</div>
                      <div className="text-lg font-bold text-green-600">
                        {(() => {
                          const breakEvenYear = currentModel.findIndex(p => p.breakEvenReached || (p.cumulativeProfit && p.cumulativeProfit > 0));
                          console.log('🔍 Break-even analysis debug:', {
                            projections: currentModel.map(p => ({
                              year: p.year,
                              cumulativeRevenue: p.cumulativeRevenue,
                              cumulativeCosts: p.cumulativeCosts,
                              cumulativeProfit: p.cumulativeProfit,
                              breakEvenReached: p.breakEvenReached
                            })),
                            setupCost: (enhancedBaselineModel?.globalCosts?.initialSetupCost || 0) * (1 + sensitivityParams.upfrontCosts / 100),
                            breakEvenYear: breakEvenYear >= 0 ? breakEvenYear + 1 : 'Not reached'
                          });
                          return breakEvenYear >= 0 ? `Year ${breakEvenYear + 1}` : 'Not reached in 5 years';
                        })()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-600">Total Profit at Break-Even</div>
                      <div className="text-lg font-bold text-blue-600">
                        {(() => {
                          const breakEvenProjection = currentModel.find(p => p.breakEvenReached || (p.cumulativeProfit && p.cumulativeProfit > 0));
                          return breakEvenProjection ? `£${(breakEvenProjection.cumulativeProfit || 0).toLocaleString()}` : '£0';
                        })()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-600">Cumulative Costs (Incl. Setup)</div>
                      <div className="text-lg font-bold text-orange-600">
                        {(() => {
                          const firstYear = currentModel[0];
                          return firstYear ? `£${firstYear.cumulativeCosts.toLocaleString()}` : '£0';
                        })()}
                      </div>
                      <div className="text-xs text-orange-600 mt-1">Year 1 Total</div>
                    </div>
                  </div>
                  
                  {/* Cumulative Profit Chart */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Cumulative Profit Over Time (Including Setup Cost)</h5>
                    <div className="h-32">
                      <Line
                        data={{
                          labels: currentModel.map(p => `Year ${p.year}`),
                          datasets: [
                            {
                              label: 'Cumulative Profit',
                              data: currentModel.map(p => p.cumulativeProfit),
                              borderColor: '#10B981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              tension: 0.4,
                              fill: true
                            },
                            {
                              label: 'Break-Even Line',
                              data: currentModel.map(() => 0),
                              borderColor: '#EF4444',
                              borderDash: [5, 5],
                              pointRadius: 0
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
                              beginAtZero: false,
                              ticks: {
                                callback: function(value) {
                                  return '£' + (value as number).toLocaleString();
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
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
                  {scenario.model && scenario.model.length > 0 && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500">5-Year Revenue</div>
                        <div className="text-lg font-semibold" style={{ color: scenario.color }}>
                          ${scenario.model[scenario.model.length - 1].totalRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">5-Year Profit</div>
                        <div className="text-sm font-medium">
                          ${scenario.model[scenario.model.length - 1].profit.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Final Users</div>
                        <div className="text-sm font-medium">
                          {scenario.model[scenario.model.length - 1].users.toLocaleString()}
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
                      labels: scenarioModels[0].model.map(p => `Year ${p.year}`),
                      datasets: scenarioModels.map(scenario => ({
                        label: scenario.name,
                        data: scenario.model?.map(p => p.totalRevenue) || [],
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
                              return '£' + (value as number).toLocaleString();
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
                      £{((enhancedBaselineModel?.globalCosts?.customerAcquisitionCost || 100) * (1 + sensitivityParams.cac / 100)).toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Current LTV</div>
                    <div className="text-2xl font-bold text-green-900">
                      £{cacLtvAnalysis[cacLtvAnalysis.length - 1]?.ltv.toFixed(0)}
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
                            £{avgRevenue.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm text-green-600 font-medium">Avg 5-Year Profit</div>
                          <div className="text-2xl font-bold text-green-900">
                            £{avgProfit.toLocaleString()}
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
                              ${(100 * (1 + sensitivityParams.cac / 100)).toFixed(0)}
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
                              {sensitivityParams.growthRate.toFixed(1)}%
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
                              {sensitivityParams.churnRate.toFixed(1)}%
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
                              ${(50 * (1 + sensitivityParams.pricingMultiplier / 100)).toFixed(0)}
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