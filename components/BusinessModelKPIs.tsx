import React from 'react';

interface KPIData {
  grossMarginPercent: number;
  fcfBreakevenDate: string;
  monthlyRecurringRevenue: number;
  netBurnPerMonth: number;
  totalRevenue: number;
  totalCogs: number;
  setupCost: number;
  cumulativeCashFlow: number[];
  monthlyRevenues: number[];
  isPropertyPlay: boolean;
}

interface BusinessModelKPIsProps {
  forecastResults: any[];
  modelConfig: any;
  activatedModels: string[];
}

const BusinessModelKPIs: React.FC<BusinessModelKPIsProps> = ({ 
  forecastResults, 
  modelConfig, 
  activatedModels 
}) => {
  const calculateKPIs = (): KPIData => {
    if (!forecastResults || forecastResults.length === 0) {
      return {
        grossMarginPercent: 0,
        fcfBreakevenDate: 'Not calculated',
        monthlyRecurringRevenue: 0,
        netBurnPerMonth: 0,
        totalRevenue: 0,
        totalCogs: 0,
        setupCost: modelConfig?.globalCosts?.initialSetupCost || 0,
        cumulativeCashFlow: [],
        monthlyRevenues: [],
        isPropertyPlay: activatedModels.includes('Property Play')
      };
    }

    const isPropertyPlay = activatedModels.includes('Property Play');
    const totalRevenue = forecastResults.reduce((sum, result) => sum + (result.totalRevenue || 0), 0);
    const totalCogs = forecastResults.reduce((sum, result) => sum + (result.totalCogs || 0), 0);
    const setupCost = modelConfig?.globalCosts?.initialSetupCost || 0;

    // 1. Gross Margin % = (Revenue - COGS) / Revenue
    const grossMarginPercent = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;

    // 2. FCF Breakeven Date - when cumulative cash flow becomes positive
    let fcfBreakevenDate = 'Not reached';
    const breakevenIndex = forecastResults.findIndex(result => result.cumulativeCashFlow >= 0);
    if (breakevenIndex !== -1) {
      const result = forecastResults[breakevenIndex];
      fcfBreakevenDate = `Year ${result.year}, Month ${result.month}`;
    }

    // 3. Monthly Recurring Revenue (MRR) - calculate from recurring business models
    let monthlyRecurringRevenue = 0;
    if (forecastResults.length > 0) {
      const latestResult = forecastResults[forecastResults.length - 1];
      const revenueByModel = latestResult.revenueByModel || {};
      
      // Sum recurring revenue from SAAS, Hardware+SAAS (SAAS portion), Subscription models
      Object.entries(revenueByModel).forEach(([modelType, revenue]) => {
        if (modelType.includes('SAAS') || modelType.includes('Subscription')) {
          monthlyRecurringRevenue += (revenue as number) || 0;
        }
      });
    }

    // 4. Net Burn Per Month - average monthly cash outflow in early months (before breakeven)
    let netBurnPerMonth = 0;
    const earlyMonths = forecastResults.slice(0, Math.min(12, forecastResults.length));
    const negativeCashFlowMonths = earlyMonths.filter(result => result.netProfit < 0);
    if (negativeCashFlowMonths.length > 0) {
      const totalBurn = negativeCashFlowMonths.reduce((sum, result) => sum + Math.abs(result.netProfit), 0);
      netBurnPerMonth = totalBurn / negativeCashFlowMonths.length;
    }

    return {
      grossMarginPercent,
      fcfBreakevenDate,
      monthlyRecurringRevenue,
      netBurnPerMonth,
      totalRevenue,
      totalCogs,
      setupCost,
      cumulativeCashFlow: forecastResults.map(r => r.cumulativeCashFlow),
      monthlyRevenues: forecastResults.map(r => r.totalRevenue),
      isPropertyPlay
    };
  };

  const calculatePropertyPlayKPIs = (): any => {
    if (!forecastResults || forecastResults.length === 0) return null;

    const totalRevenue = forecastResults.reduce((sum, result) => sum + (result.totalRevenue || 0), 0);
    const totalOperatingExpenses = forecastResults.reduce((sum, result) => sum + (result.totalOperatingExpenses || 0), 0);
    const setupCost = modelConfig?.globalCosts?.initialSetupCost || 0;

    // Property-specific KPIs
    const netOperatingIncomeMargin = totalRevenue > 0 ? ((totalRevenue - totalOperatingExpenses) / totalRevenue) * 100 : 0;
    
    // Cash-on-Cash Return (annual)
    const annualNetIncome = (totalRevenue - totalOperatingExpenses) / (forecastResults.length / 12);
    const cashOnCashReturn = setupCost > 0 ? (annualNetIncome / setupCost) * 100 : 0;

    // Debt Service Coverage Ratio (if applicable)
    const monthlyDebtService = totalOperatingExpenses / forecastResults.length; // Simplified
    const dscr = monthlyDebtService > 0 ? (totalRevenue / forecastResults.length) / monthlyDebtService : 0;

    // Occupancy Rate (assumed 95% for now - could be made dynamic)
    const occupancyRate = 95;

    // Property Appreciation (simplified - could be enhanced)
    const propertyValue = modelConfig?.modelInputs?.propertyPlay?.propertyPurchasePrice || 0;
    const appreciationRate = modelConfig?.modelInputs?.propertyPlay?.propertyAppreciationRate || 3;

    return {
      netOperatingIncomeMargin,
      cashOnCashReturn,
      dscr,
      occupancyRate,
      propertyValue,
      appreciationRate
    };
  };

  const kpis = calculateKPIs();
  const propertyKPIs = kpis.isPropertyPlay ? calculatePropertyPlayKPIs() : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getKPIStatus = (kpiType: string, value: number) => {
    switch (kpiType) {
      case 'grossMargin':
        if (value >= 70) return { color: 'text-green-600', status: '🟢 Excellent' };
        if (value >= 50) return { color: 'text-blue-600', status: '🔵 Good' };
        if (value >= 30) return { color: 'text-yellow-600', status: '🟡 Fair' };
        return { color: 'text-red-600', status: '🔴 Poor' };
      
      case 'burn':
        if (value <= 5000) return { color: 'text-green-600', status: '🟢 Low' };
        if (value <= 15000) return { color: 'text-blue-600', status: '🔵 Moderate' };
        if (value <= 30000) return { color: 'text-yellow-600', status: '🟡 High' };
        return { color: 'text-red-600', status: '🔴 Very High' };
      
      default:
        return { color: 'text-gray-600', status: '' };
    }
  };

  if (kpis.isPropertyPlay && propertyKPIs) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🏠 Property Play KPIs</h3>
          <div className="text-sm text-gray-500">Real Estate Performance Metrics</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Net Operating Income Margin */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-700 mb-1">Net Operating Income Margin</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatPercentage(propertyKPIs.netOperatingIncomeMargin)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              (Revenue - OpEx) / Revenue
            </div>
          </div>

          {/* Cash-on-Cash Return */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-700 mb-1">Cash-on-Cash Return</div>
            <div className="text-2xl font-bold text-green-900">
              {formatPercentage(propertyKPIs.cashOnCashReturn)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Annual Net Income / Initial Investment
            </div>
          </div>

          {/* Debt Service Coverage Ratio */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-700 mb-1">Debt Service Coverage</div>
            <div className="text-2xl font-bold text-purple-900">
              {propertyKPIs.dscr.toFixed(2)}x
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Net Income / Debt Payments
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm font-medium text-yellow-700 mb-1">Occupancy Rate</div>
            <div className="text-2xl font-bold text-yellow-900">
              {propertyKPIs.occupancyRate}%
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              Rental Income Efficiency
            </div>
          </div>

          {/* Property Value */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-sm font-medium text-indigo-700 mb-1">Property Value</div>
            <div className="text-2xl font-bold text-indigo-900">
              {formatCurrency(propertyKPIs.propertyValue)}
            </div>
            <div className="text-xs text-indigo-600 mt-1">
              Current Market Value
            </div>
          </div>

          {/* Appreciation Rate */}
          <div className="bg-pink-50 rounded-lg p-4">
            <div className="text-sm font-medium text-pink-700 mb-1">Annual Appreciation</div>
            <div className="text-2xl font-bold text-pink-900">
              {formatPercentage(propertyKPIs.appreciationRate)}
            </div>
            <div className="text-xs text-pink-600 mt-1">
              Expected Property Growth
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 Business Model KPIs</h3>
        <div className="text-sm text-gray-500">5 Key Performance Indicators</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Margin % */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm font-medium text-green-700 mb-1">Gross Margin %</div>
          <div className="text-2xl font-bold text-green-900">
            {formatPercentage(kpis.grossMarginPercent)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            (Revenue - COGS) / Revenue
          </div>
          <div className={`text-xs mt-2 ${getKPIStatus('grossMargin', kpis.grossMarginPercent).color}`}>
            {getKPIStatus('grossMargin', kpis.grossMarginPercent).status}
          </div>
        </div>

        {/* FCF Breakeven Date */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-700 mb-1">FCF Breakeven</div>
          <div className="text-lg font-bold text-blue-900">
            {kpis.fcfBreakevenDate}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            When cumulative cash flow turns positive
          </div>
          <div className="text-xs text-blue-700 mt-2">
            Setup Cost: {formatCurrency(kpis.setupCost)}
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-700 mb-1">Monthly Recurring Revenue</div>
          <div className="text-2xl font-bold text-purple-900">
            {formatCurrency(kpis.monthlyRecurringRevenue)}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Sum of active recurring contracts
          </div>
          <div className="text-xs text-purple-700 mt-2">
            Excludes one-time sales
          </div>
        </div>

        {/* Net Burn Per Month */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm font-medium text-red-700 mb-1">Net Burn / Month</div>
          <div className="text-2xl font-bold text-red-900">
            {formatCurrency(kpis.netBurnPerMonth)}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Cash out - cash in (early months)
          </div>
          <div className={`text-xs mt-2 ${getKPIStatus('burn', kpis.netBurnPerMonth).color}`}>
            {getKPIStatus('burn', kpis.netBurnPerMonth).status}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-700 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-yellow-900">
            {formatCurrency(kpis.totalRevenue)}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Cumulative gross revenue
          </div>
          <div className="text-xs text-yellow-700 mt-2">
            COGS: {formatCurrency(kpis.totalCogs)}
          </div>
        </div>
      </div>

      {/* KPI Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">📈 KPI Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <strong>Business Health:</strong> {kpis.grossMarginPercent >= 50 ? 'Strong margins indicate healthy unit economics' : 'Focus on improving cost structure and pricing'}
          </div>
          <div>
            <strong>Cash Position:</strong> {kpis.fcfBreakevenDate !== 'Not reached' ? 'Clear path to profitability' : 'Consider extending runway or reducing burn'}
          </div>
          <div>
            <strong>Revenue Quality:</strong> {kpis.monthlyRecurringRevenue > kpis.totalRevenue * 0.1 ? 'Good recurring revenue base' : 'Consider adding subscription elements'}
          </div>
          <div>
            <strong>Burn Efficiency:</strong> {kpis.netBurnPerMonth <= 15000 ? 'Efficient capital usage' : 'High burn rate - monitor closely'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessModelKPIs; 