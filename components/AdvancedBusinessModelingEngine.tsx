import React, { useState, useEffect } from 'react';
import { BusinessIdea } from '../pages/business-ideas';
import BusinessModelCharts from './BusinessModelCharts';
import SensitivityAnalysis from './SensitivityAnalysis';

// Enhanced business model types
export type BusinessModelType = 
  | 'SAAS' 
  | 'Hardware + SAAS' 
  | 'Straight Sales' 
  | 'Subscription Product' 
  | 'Marketplace' 
  | 'Services/Consulting'
  | 'Ad-Supported Platform'
  | 'Licensing/IP'
  | 'Freemium → Premium'
  | 'Property Play';

// Time-based model activation
export interface ModelActivation {
  modelType: BusinessModelType;
  startYear: number;
  endYear?: number;
  rampUpMonths: number;
}

// Year-by-year growth configuration
export interface YearlyGrowthRate {
  year: number;
  monthlyGrowthRate: number; // Monthly percentage growth
}

// Model-specific input structures
export interface SaasInputs {
  monthlyPriceTiers: { name: string; price: number }[];
  freeTrialConversionRate: number;
  monthlyNewUserAcquisition: number;
  userChurnRate: number;
  cac: number;
  growthRatesByYear: YearlyGrowthRate[]; // Replaces single monthlyGrowthRate
  upsellExpansionRevenue: number;
}

export interface HardwareSaasInputs {
  hardwareUnitCost: number;
  hardwareSalePrice: number;
  monthlyHardwareUnitsSold: number;
  hardwareGrowthRate: number;
  hardwareToSaasConversion: number;
  monthlySaasPrice: number;
  hardwareMargin: number;
  supportCosts: number;
}

export interface StraightSalesInputs {
  unitPrice: number;
  cogs: number;
  unitsSoldPerMonth: number;
  growthRate: number;
  channelFees: number;
  seasonalityFactor: number[];
}

export interface SubscriptionInputs {
  monthlyPrice?: number;
  annualPrice?: number;
  fulfillmentCost: number;
  newSubscribersPerMonth: number;
  churnRate: number;
  cac: number;
}

export interface MarketplaceInputs {
  gmvPerMonth: number;
  takeRate: number;
  gmvGrowthRate: number;
  supportCostsPercent: number;
}

export interface ServicesInputs {
  hourlyRate?: number;
  dayRate?: number;
  avgHoursPerMonth: number;
  consultantCost: number;
  billablePercentage: number;
  teamSize: number;
}

export interface AdSupportedInputs {
  monthlyActiveUsers: number;
  impressionsPerUser: number;
  cpmRate: number;
  adOpsCosts: number;
  userGrowthRate: number;
}

export interface LicensingInputs {
  licensingFeePerCustomer: number;
  newLicenseesPerYear: number;
  legalMaintenanceCosts: number;
  renewalRate: number;
}

export interface FreemiumInputs {
  totalFreeUsers: number;
  conversionToPayment: number;
  paidTierModel: 'saas' | 'subscription';
  paidTierInputs: SaasInputs | SubscriptionInputs;
}

export interface PropertyPlayInputs {
  // Property Purchase & Financing
  propertyPurchasePrice: number;
  downPaymentPercentage: number;
  mortgageInterestRate: number;
  mortgageTermYears: number;
  
  // Income Streams
  monthlyRentIncome: number;
  rentGrowthRate: number; // Annual percentage
  subscriptionServices: {
    name: string;
    monthlyPrice: number;
    expectedTenants: number;
  }[];
  payPerVisitServices: {
    name: string;
    pricePerVisit: number;
    visitsPerMonth: number;
    growthRate: number;
  }[];
  
  // Renovation & Improvements
  initialRenovationCost: number;
  renovationFinancingRate: number; // Interest rate for renovation loan
  renovationSpreadYears: number; // Years to spread renovation costs
  ongoingMaintenancePercentage: number; // % of property value annually
  
  // Operating Expenses
  propertyTaxPercentage: number; // % of property value annually
  insuranceCostAnnual: number;
  propertyManagementFeePercentage: number; // % of rental income
  vacancyRate: number; // % of time property is vacant
  
  // Property Appreciation
  propertyAppreciationRate: number; // Annual percentage
  
  // Exit Strategy
  plannedHoldingPeriod: number; // Years before potential sale
  sellingCostsPercentage: number; // % of sale price (agent fees, etc.)
}

// Global cost structure
export interface GlobalCosts {
  initialSetupCost: number;
  monthlyFixedCosts: number;
  teamCostsByYear: { year: number; totalCost: number }[];
  hostingInfrastructure: number;
  marketingBudget: number;
  fulfillmentLogistics: number;
  taxRate: number;
  paymentProcessingFees: number;
}

// Complete business model configuration
export interface BusinessModelConfig {
  id: string;
  name: string;
  description: string;
  sector: string;
  launchYear: number;
  modelActivations: ModelActivation[];
  modelInputs: {
    saas?: SaasInputs;
    hardwareSaas?: HardwareSaasInputs;
    straightSales?: StraightSalesInputs;
    subscription?: SubscriptionInputs;
    marketplace?: MarketplaceInputs;
    services?: ServicesInputs;
    adSupported?: AdSupportedInputs;
    licensing?: LicensingInputs;
    freemium?: FreemiumInputs;
    propertyPlay?: PropertyPlayInputs;
  };
  globalCosts: GlobalCosts;
  assumptions: {
    inflationRate: number;
    discountRate: number;
    forecastYears: number;
  };
}

// Financial forecast results
export interface ForecastResult {
  year: number;
  month: number;
  revenueByModel: Record<string, number>;
  totalRevenue: number;
  totalCosts: number;
  grossMargin: number;
  netProfit: number;
  customerBase: Record<string, number>;
  breakEvenReached: boolean;
}

interface AdvancedBusinessModelingEngineProps {
  idea: BusinessIdea;
  onUpdateModel: (apiData: any) => void;
  onBack: () => void;
}

// Helper function to convert monthly growth rate to annual equivalent
export const monthlyToAnnualGrowth = (monthlyRate: number): number => {
  return (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100;
};

// Helper function to get growth rate for a specific year
const getGrowthRateForYear = (growthRates: YearlyGrowthRate[], year: number, startYear: number): number => {
  const yearIndex = year - startYear + 1; // Convert to 1-based year index
  const rateConfig = growthRates.find(rate => rate.year === yearIndex);
  return rateConfig ? rateConfig.monthlyGrowthRate : 0;
};

// Helper function to create default growth rates for a given number of years
const createDefaultGrowthRates = (years: number, defaultRate: number = 2): YearlyGrowthRate[] => {
  return Array.from({ length: years }, (_, index) => ({
    year: index + 1,
    monthlyGrowthRate: defaultRate
  }));
};

// Component for configuring year-by-year growth rates
const GrowthRateConfig = ({ 
  growthRates, 
  onUpdate, 
  title 
}: { 
  growthRates: YearlyGrowthRate[], 
  onUpdate: (rates: YearlyGrowthRate[]) => void,
  title: string 
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {title} - Growth Rates by Year
      </label>
      <div className="space-y-2">
        {growthRates.map((rate, index) => (
          <div key={rate.year} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Year {rate.year}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  max="15"
                  value={rate.monthlyGrowthRate}
                  onChange={(e) => {
                    const newRates = [...growthRates];
                    newRates[index] = {
                      ...rate,
                      monthlyGrowthRate: Math.min(parseFloat(e.target.value) || 0, 15)
                    };
                    onUpdate(newRates);
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-sm text-gray-500">% monthly</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Annual Equivalent</div>
              <div className="text-sm font-medium text-blue-600">
                {monthlyToAnnualGrowth(rate.monthlyGrowthRate).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        💡 Tip: 1% monthly = ~12.7% annually, 2% monthly = ~26.8% annually, 5% monthly = ~79.6% annually
      </div>
    </div>
  );
};

export default function AdvancedBusinessModelingEngine({ 
  idea, 
  onUpdateModel, 
  onBack 
}: AdvancedBusinessModelingEngineProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'models' | 'costs' | 'forecast' | 'analysis'>('setup');
  const [modelConfig, setModelConfig] = useState<BusinessModelConfig>({
    id: idea.id,
    name: idea.name,
    description: idea.description,
    sector: idea.industry,
    launchYear: new Date().getFullYear(),
    modelActivations: [],
    modelInputs: {},
    globalCosts: {
      initialSetupCost: 0,
      monthlyFixedCosts: 0,
      teamCostsByYear: [
        { year: 1, totalCost: 0 },
        { year: 2, totalCost: 0 },
        { year: 3, totalCost: 0 },
        { year: 4, totalCost: 0 },
        { year: 5, totalCost: 0 }
      ],
      hostingInfrastructure: 0,
      marketingBudget: 0,
      fulfillmentLogistics: 0,
      taxRate: 0.2,
      paymentProcessingFees: 0.029
    },
    assumptions: {
      inflationRate: 0.03,
      discountRate: 0.1,
      forecastYears: 5
    }
  });

  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);
  const [selectedModels, setSelectedModels] = useState<BusinessModelType[]>([]);

  // Available business models
  const availableModels: { type: BusinessModelType; description: string; icon: string }[] = [
    { type: 'SAAS', description: 'Software as a Service with recurring subscriptions', icon: '💻' },
    { type: 'Hardware + SAAS', description: 'Physical product with software subscription', icon: '📱' },
    { type: 'Straight Sales', description: 'One-time product or service sales', icon: '🛒' },
    { type: 'Subscription Product', description: 'Recurring physical/digital product delivery', icon: '📦' },
    { type: 'Marketplace', description: 'Platform connecting buyers and sellers', icon: '🏪' },
    { type: 'Services/Consulting', description: 'Professional services and consulting', icon: '👔' },
    { type: 'Ad-Supported Platform', description: 'Free platform monetized through advertising', icon: '📺' },
    { type: 'Licensing/IP', description: 'Intellectual property licensing', icon: '⚖️' },
    { type: 'Freemium → Premium', description: 'Free tier with premium upgrade path', icon: '⬆️' },
    { type: 'Property Play', description: 'Property investment and rental modeling', icon: '🏠' }
  ];

  // Calculate forecast based on current configuration
  const calculateForecast = () => {
    const results: ForecastResult[] = [];
    const startYear = modelConfig.launchYear;
    const endYear = startYear + modelConfig.assumptions.forecastYears;

    for (let year = startYear; year < endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthIndex = (year - startYear) * 12 + month - 1;
        
        const revenueByModel: Record<string, number> = {};
        let totalRevenue = 0;
        let totalCosts = modelConfig.globalCosts.monthlyFixedCosts;
        const customerBase: Record<string, number> = {};

        // Process each model activation
        modelConfig.modelActivations.forEach(activation => {
          if (year >= activation.startYear && (!activation.endYear || year <= activation.endYear)) {
            const monthsSinceStart = Math.max(0, (year - activation.startYear) * 12 + month - 1);
            const rampUpFactor = Math.min(1, monthsSinceStart / activation.rampUpMonths);
            
            let modelRevenue = 0;
            let modelCustomers = 0;

            // Calculate revenue based on model type
            switch (activation.modelType) {
              case 'SAAS':
                if (modelConfig.modelInputs.saas) {
                  const saas = modelConfig.modelInputs.saas;
                  // Get growth rate for current year
                  const currentGrowthRate = getGrowthRateForYear(saas.growthRatesByYear || [], year, activation.startYear);
                  // Cap growth rate at 20% monthly to prevent exponential explosion
                  const cappedGrowthRate = Math.min(currentGrowthRate, 20);
                  const growthFactor = Math.pow(1 + cappedGrowthRate / 100, monthsSinceStart);
                  const baseUsers = (saas.monthlyNewUserAcquisition || 0) * monthsSinceStart * growthFactor;
                  const churnAdjustedUsers = Math.max(0, baseUsers * Math.pow(1 - (saas.userChurnRate || 0) / 100, monthsSinceStart));
                  modelCustomers = churnAdjustedUsers * rampUpFactor;
                  
                  // Safe calculation with fallback for empty arrays
                  const priceTiers = saas.monthlyPriceTiers || [];
                  const avgPrice = priceTiers.length > 0 
                    ? priceTiers.reduce((sum, tier) => sum + (tier.price || 0), 0) / priceTiers.length
                    : 0;
                  modelRevenue = modelCustomers * avgPrice * (1 + (saas.upsellExpansionRevenue || 0) / 100);
                }
                break;

              case 'Hardware + SAAS':
                if (modelConfig.modelInputs.hardwareSaas) {
                  const hwSaas = modelConfig.modelInputs.hardwareSaas;
                  // Cap hardware growth rate at 15% monthly to prevent exponential explosion
                  const cappedHwGrowthRate = Math.min(hwSaas.hardwareGrowthRate || 0, 15);
                  const hwGrowthFactor = Math.pow(1 + cappedHwGrowthRate / 100, monthsSinceStart);
                  const hwUnits = (hwSaas.monthlyHardwareUnitsSold || 0) * hwGrowthFactor * rampUpFactor;
                  const hwRevenue = hwUnits * (hwSaas.hardwareSalePrice || 0);
                  
                  // SAAS revenue from hardware conversions (accumulates over time)
                  const saasConversions = hwUnits * ((hwSaas.hardwareToSaasConversion || 0) / 100);
                  const cumulativeSaasUsers = saasConversions * monthsSinceStart; // Accumulate over time
                  const saasRevenue = cumulativeSaasUsers * (hwSaas.monthlySaasPrice || 0);
                  
                  modelRevenue = hwRevenue + saasRevenue;
                  modelCustomers = hwUnits + cumulativeSaasUsers;
                }
                break;

              case 'Straight Sales':
                if (modelConfig.modelInputs.straightSales) {
                  const sales = modelConfig.modelInputs.straightSales;
                  // Cap growth rate at 15% monthly to prevent exponential explosion
                  const cappedGrowthRate = Math.min(sales.growthRate || 0, 15);
                  const growthFactor = Math.pow(1 + cappedGrowthRate / 100, monthsSinceStart);
                  const baseUnits = (sales.unitsSoldPerMonth || 0) * growthFactor;
                  const seasonalFactor = (sales.seasonalityFactor && sales.seasonalityFactor[month - 1]) || 1;
                  const units = baseUnits * seasonalFactor * rampUpFactor;
                  modelRevenue = units * (sales.unitPrice || 0) * (1 - (sales.channelFees || 0) / 100);
                  modelCustomers = units;
                }
                break;

              case 'Marketplace':
                if (modelConfig.modelInputs.marketplace) {
                  const marketplace = modelConfig.modelInputs.marketplace;
                  const growthFactor = Math.pow(1 + marketplace.gmvGrowthRate / 100, monthsSinceStart);
                  const baseGMV = marketplace.gmvPerMonth * growthFactor;
                  const gmv = baseGMV * rampUpFactor;
                  modelRevenue = gmv * (marketplace.takeRate / 100);
                  modelCustomers = gmv / 100;
                }
                break;

              case 'Property Play':
                if (modelConfig.modelInputs.propertyPlay) {
                  const propertyPlay = modelConfig.modelInputs.propertyPlay;
                  
                  // Calculate mortgage payment (monthly)
                  const loanAmount = propertyPlay.propertyPurchasePrice * (1 - propertyPlay.downPaymentPercentage / 100);
                  const monthlyRate = propertyPlay.mortgageInterestRate / 100 / 12;
                  const totalPayments = propertyPlay.mortgageTermYears * 12;
                  const monthlyMortgagePayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
                  
                  // Calculate rental income with growth and vacancy
                  const yearsSinceStart = (year - activation.startYear) + (month - 1) / 12;
                  const rentGrowthFactor = Math.pow(1 + propertyPlay.rentGrowthRate / 100, yearsSinceStart);
                  const adjustedRentIncome = propertyPlay.monthlyRentIncome * rentGrowthFactor * (1 - propertyPlay.vacancyRate / 100);
                  
                  // Calculate subscription service revenue
                  const subscriptionRevenue = propertyPlay.subscriptionServices.reduce((total, service) => {
                    return total + (service.monthlyPrice * service.expectedTenants);
                  }, 0);
                  
                  // Calculate pay-per-visit service revenue
                  const payPerVisitRevenue = propertyPlay.payPerVisitServices.reduce((total, service) => {
                    const serviceGrowthFactor = Math.pow(1 + service.growthRate / 100, yearsSinceStart);
                    return total + (service.pricePerVisit * service.visitsPerMonth * serviceGrowthFactor);
                  }, 0);
                  
                  // Calculate total revenue
                  const totalPropertyRevenue = adjustedRentIncome + subscriptionRevenue + payPerVisitRevenue;
                  
                  // Calculate operating expenses
                  const currentPropertyValue = propertyPlay.propertyPurchasePrice * Math.pow(1 + propertyPlay.propertyAppreciationRate / 100, yearsSinceStart);
                  const monthlyPropertyTax = (currentPropertyValue * propertyPlay.propertyTaxPercentage / 100) / 12;
                  const monthlyInsurance = propertyPlay.insuranceCostAnnual / 12;
                  const monthlyMaintenance = (currentPropertyValue * propertyPlay.ongoingMaintenancePercentage / 100) / 12;
                  const monthlyManagementFee = adjustedRentIncome * (propertyPlay.propertyManagementFeePercentage / 100);
                  
                  // Calculate renovation loan payment if applicable
                  let monthlyRenovationPayment = 0;
                  if (propertyPlay.initialRenovationCost > 0 && propertyPlay.renovationSpreadYears > 0) {
                    const renovationRate = propertyPlay.renovationFinancingRate / 100 / 12;
                    const renovationPayments = propertyPlay.renovationSpreadYears * 12;
                    if (monthsSinceStart < renovationPayments) {
                      monthlyRenovationPayment = propertyPlay.initialRenovationCost * 
                        (renovationRate * Math.pow(1 + renovationRate, renovationPayments)) / 
                        (Math.pow(1 + renovationRate, renovationPayments) - 1);
                    }
                  }
                  
                  // Net operating income after expenses
                  const totalMonthlyExpenses = monthlyMortgagePayment + monthlyPropertyTax + monthlyInsurance + 
                                               monthlyMaintenance + monthlyManagementFee + monthlyRenovationPayment;
                  
                  modelRevenue = Math.max(0, totalPropertyRevenue - totalMonthlyExpenses) * rampUpFactor;
                  modelCustomers = 1; // One property
                  
                  // Add property appreciation as unrealized gain (for analysis purposes)
                  // This could be tracked separately in a more detailed model
                }
                break;
            }

            revenueByModel[activation.modelType] = modelRevenue;
            customerBase[activation.modelType] = modelCustomers;
            totalRevenue += modelRevenue;
          }
        });

        // Add costs
        const currentYear = year - modelConfig.launchYear + 1;
        const teamCostForYear = modelConfig.globalCosts.teamCostsByYear.find(tc => tc.year === currentYear);
        const monthlyTeamCost = teamCostForYear ? teamCostForYear.totalCost / 12 : 0;
        totalCosts += monthlyTeamCost;
        totalCosts += modelConfig.globalCosts.hostingInfrastructure;
        totalCosts += modelConfig.globalCosts.marketingBudget;

        const grossMargin = totalRevenue * 0.7; // Simplified gross margin
        const netProfit = grossMargin - totalCosts;

        results.push({
          year,
          month,
          revenueByModel,
          totalRevenue,
          totalCosts,
          grossMargin,
          netProfit,
          customerBase,
          breakEvenReached: netProfit > 0
        });
      }
    }

    setForecastResults(results);
  };

  // Update forecast when configuration changes
  useEffect(() => {
    calculateForecast();
  }, [modelConfig]);

  // Handle model selection
  const handleModelToggle = (modelType: BusinessModelType) => {
    if (selectedModels.includes(modelType)) {
      setSelectedModels(selectedModels.filter(m => m !== modelType));
      setModelConfig(prev => ({
        ...prev,
        modelActivations: prev.modelActivations.filter(a => a.modelType !== modelType)
      }));
    } else {
      setSelectedModels([...selectedModels, modelType]);
      setModelConfig(prev => {
        const newModelInputs = { ...prev.modelInputs };
        
        // Initialize default values for Property Play
        if (modelType === 'Property Play') {
          newModelInputs.propertyPlay = {
            propertyPurchasePrice: 250000,
            downPaymentPercentage: 20,
            mortgageInterestRate: 3.5,
            mortgageTermYears: 25,
            monthlyRentIncome: 1000,
            rentGrowthRate: 3,
            subscriptionServices: [],
            payPerVisitServices: [],
            initialRenovationCost: 0,
            renovationFinancingRate: 4,
            renovationSpreadYears: 10,
            ongoingMaintenancePercentage: 1,
            propertyTaxPercentage: 1.5,
            insuranceCostAnnual: 1000,
            propertyManagementFeePercentage: 5,
            vacancyRate: 5,
            propertyAppreciationRate: 3,
            plannedHoldingPeriod: 10,
            sellingCostsPercentage: 5
          };
        }
        
        return {
          ...prev,
          modelInputs: newModelInputs,
          modelActivations: [...prev.modelActivations, {
            modelType,
            startYear: prev.launchYear,
            rampUpMonths: 12
          }]
        };
      });
    }
  };

  // Save configuration
  const handleSave = () => {
    // Map the modelConfig to the expected API format
    const apiData = {
      name: modelConfig.name,
      description: modelConfig.description,
      sector: modelConfig.sector,
      launchYear: modelConfig.launchYear,
      modelActivations: modelConfig.modelActivations,
      modelInputs: modelConfig.modelInputs,
      costStructures: modelConfig.globalCosts, // Map globalCosts to costStructures (will be stored as global_costs in DB)
      assumptions: modelConfig.assumptions,
      forecastResults: forecastResults // Include the calculated forecast results
    };
    
    try {
      onUpdateModel(apiData);
      // Show success feedback
      alert('Advanced business model saved successfully!');
    } catch (error) {
      console.error('Error saving model:', error);
      alert('Failed to save model. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Advanced Business Modeling Engine</h2>
            <p className="text-sm text-gray-600 mt-1">{idea.name} - Multi-Model Revenue Forecasting</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              💾 Save Model
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ← Back to Ideas
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { key: 'setup', label: '🚀 Setup', desc: 'Basic configuration' },
            { key: 'models', label: '📊 Models', desc: 'Business model inputs' },
            { key: 'costs', label: '💰 Costs', desc: 'Operating expenses' },
            { key: 'forecast', label: '📈 Forecast', desc: 'Revenue projections' },
            { key: 'analysis', label: '🔍 Analysis', desc: 'Advanced analytics' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div>{tab.label}</div>
                <div className="text-xs text-gray-400">{tab.desc}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={modelConfig.name}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Launch Year
                </label>
                <input
                  type="number"
                  value={modelConfig.launchYear}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, launchYear: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={modelConfig.description}
                onChange={(e) => setModelConfig(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Business Models</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose one or more business models that will activate at different points in time. Each model can be configured with specific start years and ramp-up periods.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableModels.map((model) => (
                  <div
                    key={model.type}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedModels.includes(model.type)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleModelToggle(model.type)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{model.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{model.type}</h4>
                        <p className="text-sm text-gray-600">{model.description}</p>
                      </div>
                    </div>
                    {selectedModels.includes(model.type) && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <label className="block text-gray-600">Start Year</label>
                            <input
                              type="number"
                              value={modelConfig.modelActivations.find(a => a.modelType === model.type)?.startYear || modelConfig.launchYear}
                              onChange={(e) => {
                                const startYear = parseInt(e.target.value);
                                setModelConfig(prev => ({
                                  ...prev,
                                  modelActivations: prev.modelActivations.map(a => 
                                    a.modelType === model.type ? { ...a, startYear } : a
                                  )
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600">Ramp-up (months)</label>
                            <input
                              type="number"
                              value={modelConfig.modelActivations.find(a => a.modelType === model.type)?.rampUpMonths || 12}
                              onChange={(e) => {
                                const rampUpMonths = parseInt(e.target.value);
                                setModelConfig(prev => ({
                                  ...prev,
                                  modelActivations: prev.modelActivations.map(a => 
                                    a.modelType === model.type ? { ...a, rampUpMonths } : a
                                  )
                                }));
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-8">
            {selectedModels.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Models Selected</h3>
                <p className="text-gray-600 mb-4">
                  Go back to the Setup tab to select one or more business models to configure.
                </p>
                <button
                  onClick={() => setActiveTab('setup')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Go to Setup
                </button>
              </div>
            ) : (
              selectedModels.map((modelType) => (
                <div key={modelType} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-3">
                      {availableModels.find(m => m.type === modelType)?.icon}
                    </span>
                    {modelType} Configuration
                  </h3>
                  
                  {modelType === 'SAAS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Monthly Pricing Tiers */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Pricing Tiers
                        </label>
                        <div className="space-y-2">
                          {(modelConfig.modelInputs.saas?.monthlyPriceTiers || [{ name: 'Basic', price: 29 }]).map((tier, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={tier.name}
                                onChange={(e) => {
                                  const newTiers = [...(modelConfig.modelInputs.saas?.monthlyPriceTiers || [])];
                                  newTiers[index] = { ...newTiers[index], name: e.target.value };
                                  setModelConfig(prev => ({
                                    ...prev,
                                    modelInputs: {
                                      ...prev.modelInputs,
                                      saas: {
                                        ...prev.modelInputs.saas!,
                                        monthlyPriceTiers: newTiers
                                      }
                                    }
                                  }));
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Tier name"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={tier.price}
                                onChange={(e) => {
                                  const newTiers = [...(modelConfig.modelInputs.saas?.monthlyPriceTiers || [])];
                                  newTiers[index] = { ...newTiers[index], price: parseFloat(e.target.value) || 0 };
                                  setModelConfig(prev => ({
                                    ...prev,
                                    modelInputs: {
                                      ...prev.modelInputs,
                                      saas: {
                                        ...prev.modelInputs.saas!,
                                        monthlyPriceTiers: newTiers
                                      }
                                    }
                                  }));
                                }}
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Price"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newTiers = (modelConfig.modelInputs.saas?.monthlyPriceTiers || []).filter((_, i) => i !== index);
                                  setModelConfig(prev => ({
                                    ...prev,
                                    modelInputs: {
                                      ...prev.modelInputs,
                                      saas: {
                                        ...prev.modelInputs.saas!,
                                        monthlyPriceTiers: newTiers.length > 0 ? newTiers : [{ name: 'Basic', price: 29 }]
                                      }
                                    }
                                  }));
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newTiers = [...(modelConfig.modelInputs.saas?.monthlyPriceTiers || []), { name: 'New Tier', price: 0 }];
                              setModelConfig(prev => ({
                                ...prev,
                                modelInputs: {
                                  ...prev.modelInputs,
                                  saas: {
                                    ...prev.modelInputs.saas!,
                                    monthlyPriceTiers: newTiers
                                  }
                                }
                              }));
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            + Add Pricing Tier
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly New User Acquisition
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.saas?.monthlyNewUserAcquisition || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                saas: {
                                  ...prev.modelInputs.saas,
                                  monthlyNewUserAcquisition: value,
                                  monthlyPriceTiers: prev.modelInputs.saas?.monthlyPriceTiers || [{ name: 'Basic', price: 29 }],
                                  freeTrialConversionRate: prev.modelInputs.saas?.freeTrialConversionRate || 0.15,
                                  userChurnRate: prev.modelInputs.saas?.userChurnRate || 5,
                                  cac: prev.modelInputs.saas?.cac || 50,
                                  growthRatesByYear: prev.modelInputs.saas?.growthRatesByYear || createDefaultGrowthRates(5, 2),
                                  upsellExpansionRevenue: prev.modelInputs.saas?.upsellExpansionRevenue || 20
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Churn Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.saas?.userChurnRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                saas: {
                                  ...prev.modelInputs.saas!,
                                  userChurnRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customer Acquisition Cost (CAC)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.saas?.cac || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                saas: {
                                  ...prev.modelInputs.saas!,
                                  cac: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Free Trial Conversion Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={modelConfig.modelInputs.saas?.freeTrialConversionRate ? (modelConfig.modelInputs.saas.freeTrialConversionRate * 100) : ''}
                          onChange={(e) => {
                            const value = (parseFloat(e.target.value) || 0) / 100;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                saas: {
                                  ...prev.modelInputs.saas!,
                                  freeTrialConversionRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 15.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upsell/Expansion Revenue (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.saas?.upsellExpansionRevenue || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                saas: {
                                  ...prev.modelInputs.saas!,
                                  upsellExpansionRevenue: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 20.0"
                        />
                      </div>
                      <div className="col-span-2">
                        <GrowthRateConfig
                          growthRates={modelConfig.modelInputs.saas?.growthRatesByYear || createDefaultGrowthRates(5, 2)}
                          onUpdate={(rates) => {
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                saas: {
                                  ...prev.modelInputs.saas!,
                                  growthRatesByYear: rates
                                }
                              }
                            }));
                          }}
                          title="SAAS Growth Rates by Year"
                        />
                      </div>
                    </div>
                  )}

                  {modelType === 'Hardware + SAAS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hardware Unit Cost (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.hardwareSaas?.hardwareUnitCost || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas,
                                  hardwareUnitCost: value,
                                  hardwareSalePrice: prev.modelInputs.hardwareSaas?.hardwareSalePrice || 0,
                                  monthlyHardwareUnitsSold: prev.modelInputs.hardwareSaas?.monthlyHardwareUnitsSold || 0,
                                  hardwareGrowthRate: prev.modelInputs.hardwareSaas?.hardwareGrowthRate || 0,
                                  hardwareToSaasConversion: prev.modelInputs.hardwareSaas?.hardwareToSaasConversion || 0,
                                  monthlySaasPrice: prev.modelInputs.hardwareSaas?.monthlySaasPrice || 0,
                                  hardwareMargin: prev.modelInputs.hardwareSaas?.hardwareMargin || 0,
                                  supportCosts: prev.modelInputs.hardwareSaas?.supportCosts || 0
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 150.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hardware Sale Price (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.hardwareSaas?.hardwareSalePrice || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas!,
                                  hardwareSalePrice: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 299.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Hardware Units Sold
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.hardwareSaas?.monthlyHardwareUnitsSold || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas!,
                                  monthlyHardwareUnitsSold: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 50"
                        />
                      </div>
                                             <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Hardware Growth Rate (% per month)
                         </label>
                         <input
                           type="number"
                           step="0.1"
                           value={modelConfig.modelInputs.hardwareSaas?.hardwareGrowthRate || ''}
                           onChange={(e) => {
                             const value = parseFloat(e.target.value) || 0;
                             setModelConfig(prev => ({
                               ...prev,
                               modelInputs: {
                                 ...prev.modelInputs,
                                 hardwareSaas: {
                                   ...prev.modelInputs.hardwareSaas!,
                                   hardwareGrowthRate: value
                                 }
                               }
                             }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="e.g., 5.0"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           Monthly compound growth rate (capped at 15% for safety)
                         </p>
                       </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hardware to SAAS Conversion (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.hardwareSaas?.hardwareToSaasConversion || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas!,
                                  hardwareToSaasConversion: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 60.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly SAAS Price (£)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={modelConfig.modelInputs.hardwareSaas?.monthlySaasPrice || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas!,
                                  monthlySaasPrice: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 29.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hardware Margin (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.hardwareSaas?.hardwareMargin || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas!,
                                  hardwareMargin: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 50.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Support Costs (£/month)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.hardwareSaas?.supportCosts || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas!,
                                  supportCosts: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 2000.00"
                        />
                      </div>
                    </div>
                  )}

                  {modelType === 'Straight Sales' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.straightSales?.unitPrice || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                straightSales: {
                                  ...prev.modelInputs.straightSales,
                                  unitPrice: value,
                                  cogs: prev.modelInputs.straightSales?.cogs || 0,
                                  unitsSoldPerMonth: prev.modelInputs.straightSales?.unitsSoldPerMonth || 0,
                                  growthRate: prev.modelInputs.straightSales?.growthRate || 0,
                                  channelFees: prev.modelInputs.straightSales?.channelFees || 0,
                                  seasonalityFactor: prev.modelInputs.straightSales?.seasonalityFactor || [1,1,1,1,1,1,1,1,1,1,1,1]
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 99.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost of Goods Sold (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.straightSales?.cogs || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                straightSales: {
                                  ...prev.modelInputs.straightSales!,
                                  cogs: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 30.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Units Sold Per Month
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.straightSales?.unitsSoldPerMonth || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                straightSales: {
                                  ...prev.modelInputs.straightSales!,
                                  unitsSoldPerMonth: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Growth Rate (% per month)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.straightSales?.growthRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                straightSales: {
                                  ...prev.modelInputs.straightSales!,
                                  growthRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5.0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Monthly compound growth rate (capped at 15% for safety)
                        </p>
                      </div>
                    </div>
                  )}

                  {modelType === 'Marketplace' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gross Merchandise Value per Month (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.marketplace?.gmvPerMonth || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                                                 marketplace: {
                                   gmvPerMonth: value,
                                   takeRate: prev.modelInputs.marketplace?.takeRate || 5,
                                   gmvGrowthRate: prev.modelInputs.marketplace?.gmvGrowthRate || 10,
                                   supportCostsPercent: prev.modelInputs.marketplace?.supportCostsPercent || 2
                                 }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 10000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Take Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.marketplace?.takeRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                marketplace: {
                                  ...prev.modelInputs.marketplace!,
                                  takeRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GMV Growth Rate (% per month)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.marketplace?.gmvGrowthRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                marketplace: {
                                  ...prev.modelInputs.marketplace!,
                                  gmvGrowthRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 10.0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Monthly compound growth rate for Gross Merchandise Value
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Support Costs (% of GMV)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.marketplace?.supportCostsPercent || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                marketplace: {
                                  ...prev.modelInputs.marketplace!,
                                  supportCostsPercent: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 2.0"
                        />
                      </div>
                    </div>
                  )}

                  {modelType === 'Property Play' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Property Purchase Price (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.propertyPlay?.propertyPurchasePrice || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  propertyPurchasePrice: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 250,000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Down Payment Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.propertyPlay?.downPaymentPercentage || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  downPaymentPercentage: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mortgage Interest Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={modelConfig.modelInputs.propertyPlay?.mortgageInterestRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  mortgageInterestRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 3.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mortgage Term (years)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.propertyPlay?.mortgageTermYears || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  mortgageTermYears: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 25"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Rent Income (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.propertyPlay?.monthlyRentIncome || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  monthlyRentIncome: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 1,000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rent Growth Rate (% per year)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.propertyPlay?.rentGrowthRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  rentGrowthRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5"
                        />
                      </div>
                                             <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Additional Income Streams
                         </label>
                         <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                           <div>
                             <h4 className="font-medium text-gray-900 mb-2">Subscription Services</h4>
                             <div className="space-y-2">
                               {modelConfig.modelInputs.propertyPlay?.subscriptionServices.map((service, index) => (
                                 <div key={index} className="grid grid-cols-3 gap-2">
                                   <input
                                     type="text"
                                     placeholder="Service name"
                                     value={service.name}
                                     onChange={(e) => {
                                       const newServices = [...(modelConfig.modelInputs.propertyPlay?.subscriptionServices || [])];
                                       newServices[index] = { ...newServices[index], name: e.target.value };
                                       setModelConfig(prev => ({
                                         ...prev,
                                         modelInputs: {
                                           ...prev.modelInputs,
                                           propertyPlay: {
                                             ...prev.modelInputs.propertyPlay!,
                                             subscriptionServices: newServices
                                           }
                                         }
                                       }));
                                     }}
                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                                   />
                                   <input
                                     type="number"
                                     placeholder="Monthly price"
                                     value={service.monthlyPrice}
                                     onChange={(e) => {
                                       const newServices = [...(modelConfig.modelInputs.propertyPlay?.subscriptionServices || [])];
                                       newServices[index] = { ...newServices[index], monthlyPrice: parseFloat(e.target.value) || 0 };
                                       setModelConfig(prev => ({
                                         ...prev,
                                         modelInputs: {
                                           ...prev.modelInputs,
                                           propertyPlay: {
                                             ...prev.modelInputs.propertyPlay!,
                                             subscriptionServices: newServices
                                           }
                                         }
                                       }));
                                     }}
                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                                   />
                                   <input
                                     type="number"
                                     placeholder="Expected tenants"
                                     value={service.expectedTenants}
                                     onChange={(e) => {
                                       const newServices = [...(modelConfig.modelInputs.propertyPlay?.subscriptionServices || [])];
                                       newServices[index] = { ...newServices[index], expectedTenants: parseInt(e.target.value) || 0 };
                                       setModelConfig(prev => ({
                                         ...prev,
                                         modelInputs: {
                                           ...prev.modelInputs,
                                           propertyPlay: {
                                             ...prev.modelInputs.propertyPlay!,
                                             subscriptionServices: newServices
                                           }
                                         }
                                       }));
                                     }}
                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                                   />
                                 </div>
                               ))}
                               <button
                                 type="button"
                                 onClick={() => {
                                   setModelConfig(prev => ({
                                     ...prev,
                                     modelInputs: {
                                       ...prev.modelInputs,
                                       propertyPlay: {
                                         ...prev.modelInputs.propertyPlay!,
                                         subscriptionServices: [
                                           ...(prev.modelInputs.propertyPlay?.subscriptionServices || []),
                                           { name: '', monthlyPrice: 0, expectedTenants: 0 }
                                         ]
                                       }
                                     }
                                   }));
                                 }}
                                 className="text-sm text-blue-600 hover:text-blue-800"
                               >
                                 + Add Subscription Service
                               </button>
                             </div>
                           </div>
                           
                           <div>
                             <h4 className="font-medium text-gray-900 mb-2">Pay-Per-Visit Services</h4>
                             <div className="space-y-2">
                               {modelConfig.modelInputs.propertyPlay?.payPerVisitServices.map((service, index) => (
                                 <div key={index} className="grid grid-cols-4 gap-2">
                                   <input
                                     type="text"
                                     placeholder="Service name"
                                     value={service.name}
                                     onChange={(e) => {
                                       const newServices = [...(modelConfig.modelInputs.propertyPlay?.payPerVisitServices || [])];
                                       newServices[index] = { ...newServices[index], name: e.target.value };
                                       setModelConfig(prev => ({
                                         ...prev,
                                         modelInputs: {
                                           ...prev.modelInputs,
                                           propertyPlay: {
                                             ...prev.modelInputs.propertyPlay!,
                                             payPerVisitServices: newServices
                                           }
                                         }
                                       }));
                                     }}
                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                                   />
                                   <input
                                     type="number"
                                     placeholder="Price per visit"
                                     value={service.pricePerVisit}
                                     onChange={(e) => {
                                       const newServices = [...(modelConfig.modelInputs.propertyPlay?.payPerVisitServices || [])];
                                       newServices[index] = { ...newServices[index], pricePerVisit: parseFloat(e.target.value) || 0 };
                                       setModelConfig(prev => ({
                                         ...prev,
                                         modelInputs: {
                                           ...prev.modelInputs,
                                           propertyPlay: {
                                             ...prev.modelInputs.propertyPlay!,
                                             payPerVisitServices: newServices
                                           }
                                         }
                                       }));
                                     }}
                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                                   />
                                   <input
                                     type="number"
                                     placeholder="Visits/month"
                                     value={service.visitsPerMonth}
                                     onChange={(e) => {
                                       const newServices = [...(modelConfig.modelInputs.propertyPlay?.payPerVisitServices || [])];
                                       newServices[index] = { ...newServices[index], visitsPerMonth: parseInt(e.target.value) || 0 };
                                       setModelConfig(prev => ({
                                         ...prev,
                                         modelInputs: {
                                           ...prev.modelInputs,
                                           propertyPlay: {
                                             ...prev.modelInputs.propertyPlay!,
                                             payPerVisitServices: newServices
                                           }
                                         }
                                       }));
                                     }}
                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                                   />
                                   <input
                                     type="number"
                                     placeholder="Growth % (annual)"
                                     value={service.growthRate}
                                     onChange={(e) => {
                                       const newServices = [...(modelConfig.modelInputs.propertyPlay?.payPerVisitServices || [])];
                                       newServices[index] = { ...newServices[index], growthRate: parseFloat(e.target.value) || 0 };
                                       setModelConfig(prev => ({
                                         ...prev,
                                         modelInputs: {
                                           ...prev.modelInputs,
                                           propertyPlay: {
                                             ...prev.modelInputs.propertyPlay!,
                                             payPerVisitServices: newServices
                                           }
                                         }
                                       }));
                                     }}
                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
                                   />
                                 </div>
                               ))}
                               <button
                                 type="button"
                                 onClick={() => {
                                   setModelConfig(prev => ({
                                     ...prev,
                                     modelInputs: {
                                       ...prev.modelInputs,
                                       propertyPlay: {
                                         ...prev.modelInputs.propertyPlay!,
                                         payPerVisitServices: [
                                           ...(prev.modelInputs.propertyPlay?.payPerVisitServices || []),
                                           { name: '', pricePerVisit: 0, visitsPerMonth: 0, growthRate: 0 }
                                         ]
                                       }
                                     }
                                   }));
                                 }}
                                 className="text-sm text-blue-600 hover:text-blue-800"
                               >
                                 + Add Pay-Per-Visit Service
                               </button>
                             </div>
                           </div>
                         </div>
                       </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Initial Renovation Cost (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.propertyPlay?.initialRenovationCost || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  initialRenovationCost: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 50,000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Renovation Financing Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={modelConfig.modelInputs.propertyPlay?.renovationFinancingRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  renovationFinancingRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 4"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Renovation Spread Years
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.propertyPlay?.renovationSpreadYears || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  renovationSpreadYears: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ongoing Maintenance Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.propertyPlay?.ongoingMaintenancePercentage || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  ongoingMaintenancePercentage: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Property Tax Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.propertyPlay?.propertyTaxPercentage || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  propertyTaxPercentage: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Insurance Cost Annual (£)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.propertyPlay?.insuranceCostAnnual || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  insuranceCostAnnual: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 1,000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Property Management Fee Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.propertyPlay?.propertyManagementFeePercentage || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  propertyManagementFeePercentage: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5"
                        />
                      </div>
                                             <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Vacancy Rate (%)
                         </label>
                         <input
                           type="number"
                           step="0.1"
                           value={modelConfig.modelInputs.propertyPlay?.vacancyRate || ''}
                           onChange={(e) => {
                             const value = parseFloat(e.target.value) || 0;
                             setModelConfig(prev => ({
                               ...prev,
                               modelInputs: {
                                 ...prev.modelInputs,
                                 propertyPlay: {
                                   ...prev.modelInputs.propertyPlay!,
                                   vacancyRate: value
                                 }
                               }
                             }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="e.g., 5"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Property Appreciation Rate (% per year)
                         </label>
                         <input
                           type="number"
                           step="0.1"
                           value={modelConfig.modelInputs.propertyPlay?.propertyAppreciationRate || ''}
                           onChange={(e) => {
                             const value = parseFloat(e.target.value) || 0;
                             setModelConfig(prev => ({
                               ...prev,
                               modelInputs: {
                                 ...prev.modelInputs,
                                 propertyPlay: {
                                   ...prev.modelInputs.propertyPlay!,
                                   propertyAppreciationRate: value
                                 }
                               }
                             }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="e.g., 3"
                         />
                       </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Planned Holding Period (years)
                        </label>
                        <input
                          type="number"
                          value={modelConfig.modelInputs.propertyPlay?.plannedHoldingPeriod || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  plannedHoldingPeriod: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selling Costs Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.propertyPlay?.sellingCostsPercentage || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  sellingCostsPercentage: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">💰 Global Cost Structure</h3>
              <p className="text-blue-700">
                Configure your business operating costs. These costs will be applied across all revenue models.
              </p>
            </div>

            {/* Initial Setup Cost */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Initial Setup & Launch Costs</h3>
                <p className="text-sm text-gray-600 mt-1">One-time costs to get your business started</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Setup Cost (£)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={modelConfig.globalCosts.initialSetupCost}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelConfig(prev => ({
                          ...prev,
                          globalCosts: {
                            ...prev.globalCosts,
                            initialSetupCost: value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 25000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Equipment, legal fees, initial inventory, etc.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Fixed Costs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Monthly Fixed Costs</h3>
                <p className="text-sm text-gray-600 mt-1">Recurring monthly expenses</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office & Utilities (£/month)
                    </label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={modelConfig.globalCosts.monthlyFixedCosts}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelConfig(prev => ({
                          ...prev,
                          globalCosts: {
                            ...prev.globalCosts,
                            monthlyFixedCosts: value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hosting & Infrastructure (£/month)
                    </label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={modelConfig.globalCosts.hostingInfrastructure}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelConfig(prev => ({
                          ...prev,
                          globalCosts: {
                            ...prev.globalCosts,
                            hostingInfrastructure: value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marketing Budget (£/month)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={modelConfig.globalCosts.marketingBudget}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelConfig(prev => ({
                          ...prev,
                          globalCosts: {
                            ...prev.globalCosts,
                            marketingBudget: value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 3000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fulfillment & Logistics (£/month)
                    </label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={modelConfig.globalCosts.fulfillmentLogistics}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelConfig(prev => ({
                          ...prev,
                          globalCosts: {
                            ...prev.globalCosts,
                            fulfillmentLogistics: value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(modelConfig.globalCosts.taxRate * 100)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelConfig(prev => ({
                          ...prev,
                          globalCosts: {
                            ...prev.globalCosts,
                            taxRate: value / 100
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Processing Fees (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={(modelConfig.globalCosts.paymentProcessingFees * 100)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelConfig(prev => ({
                          ...prev,
                          globalCosts: {
                            ...prev.globalCosts,
                            paymentProcessingFees: value / 100
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2.9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Personnel Costs by Year */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Personnel Costs by Year</h3>
                <p className="text-sm text-gray-600 mt-1">Total personnel costs including salaries, benefits, contractors for each year</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <div key={year}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year {year} (£)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={modelConfig.globalCosts.teamCostsByYear?.find(tc => tc.year === year)?.totalCost || 0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setModelConfig(prev => ({
                            ...prev,
                            globalCosts: {
                              ...prev.globalCosts,
                              teamCostsByYear: prev.globalCosts.teamCostsByYear?.map(tc => 
                                tc.year === year ? { ...tc, totalCost: value } : tc
                              ) || [{ year, totalCost: value }]
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 150000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        £{((modelConfig.globalCosts.teamCostsByYear?.find(tc => tc.year === year)?.totalCost || 0) / 12).toLocaleString()}/month
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">5-Year Personnel Total</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        £{(modelConfig.globalCosts.teamCostsByYear?.reduce((sum, tc) => sum + tc.totalCost, 0) || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Average Annual Cost</h4>
                      <div className="text-2xl font-bold text-green-600">
                        £{((modelConfig.globalCosts.teamCostsByYear?.reduce((sum, tc) => sum + tc.totalCost, 0) || 0) / 5).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Cost Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">One-time Costs</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Initial Setup:</span>
                      <span className="font-medium">£{modelConfig.globalCosts.initialSetupCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Monthly Recurring Costs</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team Personnel (Year 1):</span>
                      <span className="font-medium">£{((modelConfig.globalCosts.teamCostsByYear.find(tc => tc.year === 1)?.totalCost || 0) / 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Office & Utilities:</span>
                      <span className="font-medium">£{modelConfig.globalCosts.monthlyFixedCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hosting & Infrastructure:</span>
                      <span className="font-medium">£{modelConfig.globalCosts.hostingInfrastructure.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marketing Budget:</span>
                      <span className="font-medium">£{modelConfig.globalCosts.marketingBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fulfillment & Logistics:</span>
                      <span className="font-medium">£{modelConfig.globalCosts.fulfillmentLogistics.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 font-medium">
                      <span className="text-gray-900">Total Monthly:</span>
                      <span className="text-gray-900">
                        £{(
                          ((modelConfig.globalCosts.teamCostsByYear.find(tc => tc.year === 1)?.totalCost || 0) / 12) +
                          modelConfig.globalCosts.monthlyFixedCosts +
                          modelConfig.globalCosts.hostingInfrastructure +
                          modelConfig.globalCosts.marketingBudget +
                          modelConfig.globalCosts.fulfillmentLogistics
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Forecast Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    £{forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue ({modelConfig.assumptions.forecastYears} years)</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    £{(forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0) / (modelConfig.assumptions.forecastYears * 12)).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Average Monthly Revenue</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {forecastResults.findIndex(r => r.breakEvenReached) >= 0 ? 
                      `Month ${forecastResults.findIndex(r => r.breakEvenReached) + 1}` : 
                      'Not Reached'
                    }
                  </div>
                  <div className="text-sm text-gray-600">Break-Even Point</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedModels.length}
                  </div>
                  <div className="text-sm text-gray-600">Active Business Models</div>
                </div>
              </div>
            </div>

            {/* Revenue by Model Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Revenue by Model (Annual)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      {selectedModels.map(model => (
                        <th key={model} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {model}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                      const yearResults = forecastResults.filter(r => r.year === year);
                      const yearRevenue = yearResults.reduce((sum, r) => sum + r.totalRevenue, 0);
                      const yearProfit = yearResults.reduce((sum, r) => sum + r.netProfit, 0);
                      
                      return (
                        <tr key={year}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {year}
                          </td>
                          {selectedModels.map(model => (
                            <td key={model} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              £{yearResults.reduce((sum, r) => sum + (r.revenueByModel[model] || 0), 0).toLocaleString()}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            £{yearRevenue.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${yearProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{yearProfit.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Charts */}
            <BusinessModelCharts 
              forecastResults={forecastResults}
              selectedModels={selectedModels}
              launchYear={modelConfig.launchYear}
            />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Sensitivity Analysis Component */}
            <SensitivityAnalysis 
              baselineModel={modelConfig}
              onExport={(format) => {
                console.log(`Exporting in ${format} format`);
                // Export functionality will be implemented
              }}
            />

            {/* Key Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Key Business Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time to Break-Even:</span>
                    <span className="font-medium">
                      {forecastResults.findIndex(r => r.breakEvenReached) >= 0 ? 
                        `${Math.ceil(forecastResults.findIndex(r => r.breakEvenReached) / 12)} years` : 
                        'Not reached'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Annual Revenue:</span>
                    <span className="font-medium">
                      £{Math.max(...Array.from(new Set(forecastResults.map(r => r.year))).map(year => 
                        forecastResults.filter(r => r.year === year).reduce((sum, r) => sum + r.totalRevenue, 0)
                      )).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Investment Needed:</span>
                    <span className="font-medium">£{modelConfig.globalCosts.initialSetupCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">5-Year Revenue:</span>
                    <span className="font-medium">
                      £{forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Model Performance</h3>
                <div className="space-y-3">
                  {selectedModels.map(model => {
                    const modelRevenue = forecastResults.reduce((sum, r) => sum + (r.revenueByModel[model] || 0), 0);
                    const totalRevenue = forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0);
                    const percentage = totalRevenue > 0 ? (modelRevenue / totalRevenue * 100) : 0;
                    
                    return (
                      <div key={model} className="flex justify-between">
                        <span className="text-gray-600">{model}:</span>
                        <span className="font-medium">{percentage.toFixed(1)}% of total</span>
                      </div>
                    );
                  })}
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Models:</span>
                      <span className="font-medium">{selectedModels.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Charts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Financial Projections</h3>
              <BusinessModelCharts 
                forecastResults={forecastResults}
                selectedModels={selectedModels}
                launchYear={modelConfig.launchYear}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 