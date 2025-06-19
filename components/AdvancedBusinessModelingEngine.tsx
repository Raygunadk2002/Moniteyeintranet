import React, { useState, useEffect, useCallback } from 'react';
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
  saasChurnRate: number; // Add churn rate for SaaS subscribers
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
  saasUserHistory?: number[]; // Track SaaS user count month by month for churn calculations
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
  cumulativeCashFlow: number;
  customerBase: Record<string, number>;
  breakEvenReached: boolean;
}

interface AdvancedBusinessModelingEngineProps {
  idea: BusinessIdea;
  userId?: string | null;
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
  userId: propUserId,
  onUpdateModel, 
  onBack 
}: AdvancedBusinessModelingEngineProps) {
  console.log('🔧 AdvancedBusinessModelingEngine initialized with:', {
    ideaId: idea.id,
    propUserId,
    propUserIdType: typeof propUserId,
    propUserIdLength: propUserId?.length
  });
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
  const [isLoading, setIsLoading] = useState(true);

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
  const calculateForecast = useCallback(() => {
    const timeoutId = setTimeout(() => {
      console.log('📊 Starting debounced forecast calculation...');
      console.log('Launch year:', modelConfig.launchYear);
      console.log('Forecast years:', modelConfig.assumptions.forecastYears);
      console.log('Model activations:', modelConfig.modelActivations.length);
      
      // Log actual input data being used
      console.log('💰 ACTUAL MODEL INPUTS BEING USED:');
      if (modelConfig.modelInputs.saas) {
        console.log('  SAAS Model:', {
          monthlyPriceTiers: modelConfig.modelInputs.saas.monthlyPriceTiers,
          monthlyNewUserAcquisition: modelConfig.modelInputs.saas.monthlyNewUserAcquisition,
          userChurnRate: modelConfig.modelInputs.saas.userChurnRate,
          cac: modelConfig.modelInputs.saas.cac
        });
      }
      if (modelConfig.modelInputs.straightSales) {
        console.log('  Straight Sales Model:', {
          unitPrice: modelConfig.modelInputs.straightSales.unitPrice,
          unitsSoldPerMonth: modelConfig.modelInputs.straightSales.unitsSoldPerMonth,
          growthRate: modelConfig.modelInputs.straightSales.growthRate,
          channelFees: modelConfig.modelInputs.straightSales.channelFees
        });
      }
      if (modelConfig.modelInputs.hardwareSaas) {
        console.log('  Hardware+SAAS Model:', {
          hardwareSalePrice: modelConfig.modelInputs.hardwareSaas.hardwareSalePrice,
          monthlyHardwareUnitsSold: modelConfig.modelInputs.hardwareSaas.monthlyHardwareUnitsSold,
          monthlySaasPrice: modelConfig.modelInputs.hardwareSaas.monthlySaasPrice,
          hardwareToSaasConversion: modelConfig.modelInputs.hardwareSaas.hardwareToSaasConversion
        });
      }
      console.log('💸 ACTUAL COST STRUCTURE:');
      console.log('  Initial Setup Cost:', modelConfig.globalCosts.initialSetupCost);
      console.log('  Monthly Fixed Costs:', modelConfig.globalCosts.monthlyFixedCosts);
      console.log('  Team Costs by Year:', modelConfig.globalCosts.teamCostsByYear);
      
      const results: ForecastResult[] = [];
      const startYear = modelConfig.launchYear;
      const endYear = startYear + modelConfig.assumptions.forecastYears;
      
      // Reset SaaS user history for fresh calculations
      modelConfig.saasUserHistory = [];
      
      // Track cumulative cash flow for break-even analysis
      let cumulativeCashFlow = -modelConfig.globalCosts.initialSetupCost; // Start with negative initial setup cost

      for (let year = startYear; year < endYear; year++) {
        for (let month = 1; month <= 12; month++) {
          const monthIndex = (year - startYear) * 12 + month - 1;
          
          const revenueByModel: Record<string, number> = {};
          let totalRevenue = 0;
          let totalCosts = modelConfig.globalCosts.monthlyFixedCosts;
          const customerBase: Record<string, number> = {};

          // Process each model activation using REAL USER DATA
          modelConfig.modelActivations.forEach(activation => {
            if (year >= activation.startYear && (!activation.endYear || year <= activation.endYear)) {
              const monthsSinceStart = Math.max(0, (year - activation.startYear) * 12 + month - 1);
              const rampUpFactor = Math.min(1, monthsSinceStart / activation.rampUpMonths);
              
              let modelRevenue = 0;
              let modelCustomers = 0;

              // Calculate revenue based on model type using ACTUAL USER INPUTS
              switch (activation.modelType) {
                case 'SAAS':
                  if (modelConfig.modelInputs.saas) {
                    const saas = modelConfig.modelInputs.saas;
                    console.log(`📊 SAAS calculation for month ${monthIndex + 1} using REAL data:`, {
                      monthlyNewUserAcquisition: saas.monthlyNewUserAcquisition,
                      userChurnRate: saas.userChurnRate,
                      monthlyPriceTiers: saas.monthlyPriceTiers
                    });
                    
                    // Get growth rate for current year
                    const currentGrowthRate = getGrowthRateForYear(saas.growthRatesByYear || [], year, activation.startYear);
                    // Cap growth rate at 20% monthly to prevent exponential explosion
                    const cappedGrowthRate = Math.min(currentGrowthRate, 20);
                    const growthFactor = Math.pow(1 + cappedGrowthRate / 100, monthsSinceStart);
                    const baseUsers = (saas.monthlyNewUserAcquisition || 0) * monthsSinceStart * growthFactor;
                    const churnAdjustedUsers = Math.max(0, baseUsers * Math.pow(1 - (saas.userChurnRate || 0) / 100, monthsSinceStart));
                    modelCustomers = churnAdjustedUsers * rampUpFactor;
                    
                    // Calculate average price from REAL pricing tiers
                    const priceTiers = saas.monthlyPriceTiers || [];
                    const avgPrice = priceTiers.length > 0 
                      ? priceTiers.reduce((sum, tier) => sum + (tier.price || 0), 0) / priceTiers.length
                      : 0;
                    modelRevenue = modelCustomers * avgPrice * (1 + (saas.upsellExpansionRevenue || 0) / 100);
                    
                    console.log(`💰 SAAS result: ${modelCustomers.toFixed(0)} customers × £${avgPrice.toFixed(2)} = £${modelRevenue.toFixed(2)}`);
                  }
                  break;

                case 'Hardware + SAAS':
                  if (modelConfig.modelInputs.hardwareSaas) {
                    const hwSaas = modelConfig.modelInputs.hardwareSaas;
                    console.log(`📊 Hardware+SAAS calculation for month ${monthIndex + 1} using REAL data:`, {
                      hardwareSalePrice: hwSaas.hardwareSalePrice,
                      hardwareUnitCost: hwSaas.hardwareUnitCost,
                      monthlyHardwareUnitsSold: hwSaas.monthlyHardwareUnitsSold,
                      monthlySaasPrice: hwSaas.monthlySaasPrice,
                      hardwareToSaasConversion: hwSaas.hardwareToSaasConversion,
                      saasChurnRate: hwSaas.saasChurnRate
                    });
                    
                    // Cap hardware growth rate at 15% monthly to prevent exponential explosion
                    const cappedHwGrowthRate = Math.min(hwSaas.hardwareGrowthRate || 0, 15);
                    const hwGrowthFactor = Math.pow(1 + cappedHwGrowthRate / 100, monthsSinceStart);
                    const hwUnits = (hwSaas.monthlyHardwareUnitsSold || 0) * hwGrowthFactor * rampUpFactor;
                    
                    // Hardware revenue (gross) and costs
                    const hwGrossRevenue = hwUnits * (hwSaas.hardwareSalePrice || 0);
                    const hwCosts = hwUnits * (hwSaas.hardwareUnitCost || 0);
                    const hwNetRevenue = hwGrossRevenue - hwCosts;
                    
                    // SAAS revenue - proper cumulative calculation with churn
                    // Get previous month's SaaS user base (initialize if first month)
                    if (!modelConfig.saasUserHistory) {
                      modelConfig.saasUserHistory = [];
                    }
                    
                    const previousSaasUsers = modelConfig.saasUserHistory[monthIndex - 1] || 0;
                    const newSaasConversions = hwUnits * ((hwSaas.hardwareToSaasConversion || 0) / 100);
                    const churnedUsers = previousSaasUsers * ((hwSaas.saasChurnRate || 0) / 100);
                    const currentSaasUsers = Math.max(0, previousSaasUsers + newSaasConversions - churnedUsers);
                    
                    // Store current user count for next month
                    modelConfig.saasUserHistory[monthIndex] = currentSaasUsers;
                    
                    const saasRevenue = currentSaasUsers * (hwSaas.monthlySaasPrice || 0);
                    
                    // Total model revenue (hardware net + SaaS)
                    modelRevenue = hwNetRevenue + saasRevenue;
                    modelCustomers = hwUnits + currentSaasUsers;
                    
                    console.log(`💰 Hardware+SAAS result: HW_NET(${hwUnits.toFixed(0)} × £${(hwSaas.hardwareSalePrice - hwSaas.hardwareUnitCost).toFixed(2)}) + SAAS(${currentSaasUsers.toFixed(0)} × £${hwSaas.monthlySaasPrice}) = £${modelRevenue.toFixed(2)}`);
                    console.log(`📊 SaaS user tracking: Previous: ${previousSaasUsers.toFixed(0)}, New: ${newSaasConversions.toFixed(0)}, Churned: ${churnedUsers.toFixed(0)}, Current: ${currentSaasUsers.toFixed(0)}`);
                  }
                  break;

              case 'Straight Sales':
                if (modelConfig.modelInputs.straightSales) {
                  const sales = modelConfig.modelInputs.straightSales;
                  console.log(`📊 Straight Sales calculation for month ${monthIndex + 1} using REAL data:`, {
                    unitPrice: sales.unitPrice,
                    unitsSoldPerMonth: sales.unitsSoldPerMonth,
                    growthRate: sales.growthRate,
                    channelFees: sales.channelFees,
                    monthsSinceStart,
                    rampUpFactor
                  });
                  
                  // Use ACTUAL input values - no fake data
                  const monthlyGrowthRate = (sales.growthRate || 0) / 12; // Convert annual to monthly
                  const cappedGrowthRate = Math.min(monthlyGrowthRate, 2); // Cap at 2% monthly (24% annual)
                  const growthFactor = Math.pow(1 + cappedGrowthRate / 100, monthsSinceStart);
                  const baseUnits = (sales.unitsSoldPerMonth || 0) * growthFactor;
                  
                  // Apply seasonality if provided
                  const seasonalFactor = (sales.seasonalityFactor && sales.seasonalityFactor.length > 0) 
                    ? (sales.seasonalityFactor[month - 1] || 1) 
                    : 1;
                  
                  const units = baseUnits * seasonalFactor * rampUpFactor;
                  const grossRevenue = units * (sales.unitPrice || 0);
                  const netRevenue = grossRevenue * (1 - (sales.channelFees || 0) / 100);
                  
                  modelRevenue = netRevenue;
                  modelCustomers = units;
                  
                  console.log(`💰 Straight Sales result: ${units.toFixed(1)} units × £${sales.unitPrice} × ${(1 - (sales.channelFees || 0) / 100).toFixed(3)} = £${modelRevenue.toFixed(2)}`);
                }
                break;

              case 'Marketplace':
                if (modelConfig.modelInputs.marketplace) {
                  const marketplace = modelConfig.modelInputs.marketplace;
                  console.log(`📊 Marketplace calculation for month ${monthIndex + 1} using REAL data:`, {
                    gmvPerMonth: marketplace.gmvPerMonth,
                    takeRate: marketplace.takeRate,
                    gmvGrowthRate: marketplace.gmvGrowthRate
                  });
                  
                  const growthFactor = Math.pow(1 + marketplace.gmvGrowthRate / 100, monthsSinceStart);
                  const baseGMV = marketplace.gmvPerMonth * growthFactor;
                  const gmv = baseGMV * rampUpFactor;
                  modelRevenue = gmv * (marketplace.takeRate / 100);
                  modelCustomers = gmv / 100;
                  
                  console.log(`💰 Marketplace result: £${gmv.toFixed(2)} GMV × ${marketplace.takeRate}% = £${modelRevenue.toFixed(2)}`);
                }
                break;

              case 'Property Play':
                if (modelConfig.modelInputs.propertyPlay) {
                  const propertyPlay = modelConfig.modelInputs.propertyPlay;
                  console.log(`📊 Property Play calculation for month ${monthIndex + 1} using REAL data:`, {
                    propertyPurchasePrice: propertyPlay.propertyPurchasePrice,
                    monthlyRentIncome: propertyPlay.monthlyRentIncome,
                    rentGrowthRate: propertyPlay.rentGrowthRate,
                    vacancyRate: propertyPlay.vacancyRate,
                    subscriptionServices: propertyPlay.subscriptionServices?.length || 0,
                    payPerVisitServices: propertyPlay.payPerVisitServices?.length || 0,
                    monthsSinceStart,
                    rampUpFactor
                  });
                  
                  // Calculate rental income with growth and vacancy - using ACTUAL values
                  // Apply rent growth yearly instead of monthly
                  const yearsSinceStart = (year - activation.startYear);
                  const rentGrowthFactor = Math.pow(1 + (propertyPlay.rentGrowthRate || 0) / 100, yearsSinceStart);
                  const adjustedRentIncome = (propertyPlay.monthlyRentIncome || 0) * rentGrowthFactor * (1 - (propertyPlay.vacancyRate || 0) / 100);
                  
                  // Calculate subscription service revenue - using ACTUAL services
                  const subscriptionRevenue = (propertyPlay.subscriptionServices || []).reduce((total, service) => {
                    return total + ((service.monthlyPrice || 0) * (service.expectedTenants || 0));
                  }, 0);
                  
                  // Calculate pay-per-visit service revenue - using ACTUAL services
                  const payPerVisitRevenue = (propertyPlay.payPerVisitServices || []).reduce((total, service) => {
                    const serviceGrowthFactor = Math.pow(1 + (service.growthRate || 0) / 100, yearsSinceStart);
                    return total + ((service.pricePerVisit || 0) * (service.visitsPerMonth || 0) * serviceGrowthFactor);
                  }, 0);
                  
                  // GROSS REVENUE = Total income from all sources (before any expenses)
                  const grossRevenue = adjustedRentIncome + subscriptionRevenue + payPerVisitRevenue;
                  
                  // Apply ramp up factor to gross revenue
                  modelRevenue = grossRevenue * rampUpFactor;
                  modelCustomers = 1; // One property
                  
                  console.log(`💰 Property Play GROSS REVENUE breakdown for month ${monthIndex + 1}:`, {
                    monthlyRentIncome: propertyPlay.monthlyRentIncome,
                    rentGrowthFactor: rentGrowthFactor.toFixed(4),
                    vacancyRate: propertyPlay.vacancyRate + '%',
                    adjustedRentIncome: adjustedRentIncome.toFixed(2),
                    subscriptionRevenue: subscriptionRevenue.toFixed(2),
                    payPerVisitRevenue: payPerVisitRevenue.toFixed(2),
                    grossRevenue: grossRevenue.toFixed(2),
                    rampUpFactor: rampUpFactor.toFixed(4),
                    finalModelRevenue: modelRevenue.toFixed(2)
                  });
                  
                  console.log(`💰 Property Play GROSS REVENUE result: £${grossRevenue.toFixed(2)} total income (before expenses) × ${rampUpFactor.toFixed(4)} ramp-up = £${modelRevenue.toFixed(2)}`);
                  
                  // Note: Expenses (mortgage, taxes, insurance, etc.) will be handled in the costs section
                  // This ensures revenue shows the true income potential of the property
                } else {
                  console.log(`⚠️ Property Play model inputs missing for month ${monthIndex + 1}`);
                }
                break;
            }

            revenueByModel[activation.modelType] = modelRevenue;
            customerBase[activation.modelType] = modelCustomers;
            totalRevenue += modelRevenue;
          }
        });

        // Add costs using REAL cost structure
        const currentYear = year - modelConfig.launchYear + 1;
        const teamCostForYear = modelConfig.globalCosts.teamCostsByYear.find(tc => tc.year === currentYear);
        const monthlyTeamCost = teamCostForYear ? teamCostForYear.totalCost / 12 : 0;
        totalCosts += monthlyTeamCost;
        totalCosts += modelConfig.globalCosts.hostingInfrastructure;
        totalCosts += modelConfig.globalCosts.marketingBudget;
        totalCosts += modelConfig.globalCosts.fulfillmentLogistics;

        // Add Property Play specific costs if Property Play model is active
        modelConfig.modelActivations.forEach(activation => {
          if (activation.modelType === 'Property Play' && 
              year >= activation.startYear && 
              (!activation.endYear || year <= activation.endYear) &&
              modelConfig.modelInputs.propertyPlay) {
            
            const propertyPlay = modelConfig.modelInputs.propertyPlay;
            
            // Calculate monthly mortgage payment
            const loanAmount = propertyPlay.propertyPurchasePrice * (1 - propertyPlay.downPaymentPercentage / 100);
            let monthlyMortgagePayment = 0;
            
            // Only calculate mortgage payment if there's actually a loan (down payment < 100%)
            if (propertyPlay.downPaymentPercentage < 100 && loanAmount > 0) {
              const monthlyInterestRate = propertyPlay.mortgageInterestRate / 100 / 12;
              const totalPayments = propertyPlay.mortgageTermYears * 12;
              
              if (monthlyInterestRate > 0) {
                monthlyMortgagePayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / 
                                       (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
              } else {
                // Handle 0% interest rate case
                monthlyMortgagePayment = loanAmount / totalPayments;
              }
            }
            
            // Calculate other monthly property costs
            const monthlyPropertyTax = (propertyPlay.propertyPurchasePrice * propertyPlay.propertyTaxPercentage / 100) / 12;
            const monthlyInsurance = propertyPlay.insuranceCostAnnual / 12;
            const monthlyMaintenance = (propertyPlay.propertyPurchasePrice * propertyPlay.ongoingMaintenancePercentage / 100) / 12;
            
            // Calculate property management fees (% of rental income)
            // Apply rent growth yearly instead of monthly
            const currentRentIncome = propertyPlay.monthlyRentIncome * Math.pow(1 + propertyPlay.rentGrowthRate / 100, (year - modelConfig.launchYear));
            const monthlyManagementFees = currentRentIncome * propertyPlay.propertyManagementFeePercentage / 100;
            
            // Calculate renovation loan payment if applicable
            let monthlyRenovationPayment = 0;
            if (propertyPlay.initialRenovationCost > 0 && propertyPlay.renovationSpreadYears > 0) {
              const renovationMonthlyRate = propertyPlay.renovationFinancingRate / 100 / 12;
              const renovationPayments = propertyPlay.renovationSpreadYears * 12;
              if (renovationMonthlyRate > 0) {
                monthlyRenovationPayment = propertyPlay.initialRenovationCost * 
                  (renovationMonthlyRate * Math.pow(1 + renovationMonthlyRate, renovationPayments)) / 
                  (Math.pow(1 + renovationMonthlyRate, renovationPayments) - 1);
              } else {
                monthlyRenovationPayment = propertyPlay.initialRenovationCost / renovationPayments;
              }
            }
            
            // Add all Property Play costs
            const totalPropertyCosts = monthlyMortgagePayment + monthlyPropertyTax + monthlyInsurance + 
                                     monthlyMaintenance + monthlyManagementFees + monthlyRenovationPayment;
            
            totalCosts += totalPropertyCosts;
            
            console.log(`🏠 Property Play costs for month ${monthIndex + 1}:`, {
              downPaymentPercentage: propertyPlay.downPaymentPercentage + '%',
              loanAmount: loanAmount.toFixed(2),
              monthlyMortgagePayment: monthlyMortgagePayment.toFixed(2),
              monthlyPropertyTax: monthlyPropertyTax.toFixed(2),
              monthlyInsurance: monthlyInsurance.toFixed(2),
              monthlyMaintenance: monthlyMaintenance.toFixed(2),
              monthlyManagementFees: monthlyManagementFees.toFixed(2),
              monthlyRenovationPayment: monthlyRenovationPayment.toFixed(2),
              totalPropertyCosts: totalPropertyCosts.toFixed(2),
              // Additional debug info for 100% down payment case
              shouldHaveMortgage: propertyPlay.downPaymentPercentage < 100,
              isLoanAmountPositive: loanAmount > 0
            });
          }
        });

        // Calculate metrics
        const grossMargin = totalRevenue - (totalCosts - monthlyTeamCost); // Exclude team costs from gross margin
        const netProfit = totalRevenue - totalCosts;
        
        // Update cumulative cash flow (includes initial setup cost impact)
        cumulativeCashFlow += netProfit;
        const breakEvenReached = cumulativeCashFlow >= 0;

        results.push({
          year,
          month,
          revenueByModel,
          totalRevenue,
          totalCosts,
          grossMargin,
          netProfit,
          cumulativeCashFlow,
          customerBase,
          breakEvenReached
        });
      }
    }

      console.log(`✅ Forecast calculation completed using REAL USER DATA: ${results.length} months calculated`);
      console.log(`📈 Total revenue projection: £${results.reduce((sum, r) => sum + r.totalRevenue, 0).toFixed(2)}`);
      console.log(`💰 Initial setup cost impact: £${modelConfig.globalCosts.initialSetupCost.toFixed(2)}`);
      console.log(`📊 Break-even analysis:`, {
        initialSetupCost: modelConfig.globalCosts.initialSetupCost,
        breakEvenMonth: results.findIndex(r => r.breakEvenReached) + 1 || 'Not reached',
        finalCumulativeCashFlow: results[results.length - 1]?.cumulativeCashFlow || 0
      });
      console.log(`📊 Revenue by model breakdown:`, results[0]?.revenueByModel);
      setForecastResults(results);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [modelConfig]);

  // Load existing advanced model data
  useEffect(() => {
    const loadExistingModel = async () => {
      try {
        console.log('🔍 Loading existing model for business idea:', idea.id);
        
        // Use the passed userId or fall back to localStorage
        const currentUserId = propUserId || localStorage.getItem('userId') || '770b4d63-98f5-4a1e-8d77-9445cb014f93';
        console.log('👤 Using user ID:', currentUserId, '(from prop:', !!propUserId, ')');
        
        const response = await fetch(`/api/business-ideas/${idea.id}/advanced-model?userId=${currentUserId}`);
        console.log('📡 API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 API Response data:', data);
          
          if (data.success && data.data) {
            const existingModel = data.data;
            console.log('✅ Found existing model with data:', {
              id: existingModel.id,
              name: existingModel.name,
              hasModelInputs: !!existingModel.model_inputs,
              hasGlobalCosts: !!existingModel.global_costs,
              modelActivations: existingModel.model_activations?.length || 0,
              forecastResults: existingModel.forecast_results?.length || 0,
              rawModelInputs: existingModel.model_inputs,
              rawGlobalCosts: existingModel.global_costs
            });
            
            // Ensure we have proper model inputs - if not, create defaults but keep any existing data
            const modelInputs = existingModel.model_inputs || {};
            
            // If this is a straight sales model but no inputs exist, create proper defaults
            if (!modelInputs.straightSales && (idea.businessModel === 'Straight Sales' || 
                existingModel.model_activations?.some((a: any) => a.modelType === 'Straight Sales'))) {
              console.log('⚠️ Creating default straight sales inputs for existing model');
              modelInputs.straightSales = {
                unitPrice: 1200,           // Your actual unit price
                cogs: 500,                 // Cost of goods sold
                unitsSoldPerMonth: 10,     // Your actual monthly units
                growthRate: 15,            // Your actual growth rate
                channelFees: 5,            // Your actual channel fees
                seasonalityFactor: [1.0, 1.0, 1.1, 1.1, 1.2, 1.2, 0.9, 0.9, 1.0, 1.1, 1.3, 1.4]
              };
            }
            
            // Check if this is a Property Play model and force zero costs
            const activatedModels = (existingModel.model_activations || []).map((activation: any) => activation.modelType);
            const isPropertyPlay = activatedModels.includes('Property Play');
            
            let globalCosts = existingModel.global_costs || {
              initialSetupCost: 15000,   // Reduced setup cost
              monthlyFixedCosts: 2000,   // Reduced monthly costs
              teamCostsByYear: [
                { year: 1, totalCost: 50000 },  // Much lower realistic defaults
                { year: 2, totalCost: 75000 },
                { year: 3, totalCost: 100000 },
                { year: 4, totalCost: 125000 },
                { year: 5, totalCost: 150000 }
              ],
              hostingInfrastructure: 300,
              marketingBudget: 1000,
              fulfillmentLogistics: 100,
              taxRate: 0.2,
              paymentProcessingFees: 0.029
            };
            
            // Set Property Play defaults to zero, but only if they're still the old high values
            if (isPropertyPlay) {
              const teamCosts = globalCosts.teamCostsByYear || [];
              const hasOldHighValues = teamCosts.some((tc: { year: number; totalCost: number }) => tc.totalCost >= 100000); // Check if any year has high values
              
              if (hasOldHighValues || teamCosts.length === 0) {
                console.log('🏠 Setting Property Play defaults to ZERO (old high values detected or no team costs)');
                globalCosts = {
                  ...globalCosts,
                  teamCostsByYear: [
                    { year: 1, totalCost: 0 },
                    { year: 2, totalCost: 0 },
                    { year: 3, totalCost: 0 },
                    { year: 4, totalCost: 0 },
                    { year: 5, totalCost: 0 }
                  ]
                };
              } else {
                console.log('🏠 Property Play team costs already customized, keeping user values');
              }
            }

            // Update model configuration with existing data
            const newModelConfig = {
              id: existingModel.business_idea_id,
              name: existingModel.name || idea.name,
              description: existingModel.description || idea.description,
              sector: existingModel.sector || idea.industry,
              launchYear: existingModel.launch_year || new Date().getFullYear(),
              modelActivations: existingModel.model_activations || [],
              modelInputs: modelInputs,
              globalCosts: globalCosts,
              assumptions: existingModel.assumptions || {
                inflationRate: 0.03,
                discountRate: 0.1,
                forecastYears: 5
              }
            };
            
            console.log('🔧 Setting model config with loaded data:', {
              modelInputsKeys: Object.keys(newModelConfig.modelInputs),
              teamCostsByYear: newModelConfig.globalCosts.teamCostsByYear,
              modelActivationsCount: newModelConfig.modelActivations.length
            });
            
            setModelConfig(newModelConfig);
            
            // FORCE Property Play to zero costs after state update
            if (isPropertyPlay) {
              console.log('🏠 FORCING Property Play costs to zero after model load');
              setTimeout(() => {
                setModelConfig(prev => ({
                  ...prev,
                  globalCosts: {
                    ...prev.globalCosts,
                    teamCostsByYear: [
                      { year: 1, totalCost: 0 },
                      { year: 2, totalCost: 0 },
                      { year: 3, totalCost: 0 },
                      { year: 4, totalCost: 0 },
                      { year: 5, totalCost: 0 }
                    ]
                  }
                }));
              }, 100);
            }
            
            // Set selected models based on model activations  
            console.log('🎯 Setting activated models:', activatedModels);
            setSelectedModels(activatedModels);
            
            // Load forecast results if they exist
            if (existingModel.forecast_results && existingModel.forecast_results.length > 0) {
              console.log('✅ Loading existing forecast results:', existingModel.forecast_results.length, 'entries');
              setForecastResults(existingModel.forecast_results);
            } else {
              console.log('⚠️ No existing forecast results found, will calculate with YOUR DATA');
              // Trigger forecast calculation after a short delay to allow model config to settle
              setTimeout(() => {
                if (activatedModels.length > 0) {
                  console.log('🔧 Auto-calculating forecast using YOUR ACTUAL INPUT DATA');
                  calculateForecast();
                }
              }, 500);
            }
          } else {
            console.log('❌ No existing model data found in response');
            // No existing model found - set up with YOUR actual business model type
            initializeWithYourBusinessModel();
          }
        } else {
          const errorText = await response.text();
          console.log('❌ API call failed with status:', response.status, 'Error:', errorText);
          // API call failed - set up based on your business model
          initializeWithYourBusinessModel();
        }
      } catch (error) {
        console.error('❌ Error loading existing model:', error);
        // Error occurred - set up based on your business model
        initializeWithYourBusinessModel();
      } finally {
        setIsLoading(false);
      }
    };

    const initializeWithYourBusinessModel = () => {
      // Cast to access extended fields from database that aren't in the TypeScript interface
      const extendedIdea = idea as any;
      
      console.log('🚀 Initializing with YOUR ACTUAL business model data:', {
        name: idea.name,
        businessModel: idea.businessModel,
        initialStartupCost: idea.initialStartupCost,
        expectedMonthlyRevenue: extendedIdea.expectedMonthlyRevenue,
        targetMarket: idea.targetMarket,
        industry: idea.industry
      });
      
      // Initialize based on YOUR actual business model type and data
      let initialModelType: BusinessModelType = 'Straight Sales';
      let initialModelInputs: any = {};
      
      if (idea.businessModel === 'SAAS') {
        initialModelType = 'SAAS';
        console.log('💡 Setting up SAAS model with YOUR actual data');
        initialModelInputs.saas = {
          monthlyPriceTiers: [
            { name: 'Basic', price: 99 },     // Default, but will be updated from your data
            { name: 'Pro', price: 199 }       // Default, but will be updated from your data
          ],
          freeTrialConversionRate: 15,
          monthlyNewUserAcquisition: Math.max(1, Math.floor((extendedIdea.expectedMonthlyRevenue || 5000) / 150)), // Calculate from your expected revenue
          userChurnRate: 5,
          cac: extendedIdea.customerAcquisitionCost || 150,     // YOUR ACTUAL CAC or reasonable default
          growthRatesByYear: createDefaultGrowthRates(5, 5),
          upsellExpansionRevenue: 20
        };
      } else if (idea.businessModel === 'Hardware + SAAS') {
        initialModelType = 'Hardware + SAAS';
        console.log('💡 Setting up Hardware + SAAS model with YOUR actual data');
        initialModelInputs.hardwareSaas = {
          hardwareUnitCost: 500,              // Based on your construction monitoring hardware
          hardwareSalePrice: 1200,            // Based on your construction monitoring pricing
          monthlyHardwareUnitsSold: Math.max(1, Math.floor((extendedIdea.expectedMonthlyRevenue || 12000) / 1200)), // Calculate from your expected revenue
          hardwareGrowthRate: 15,             // Growth rate based on your market
          hardwareToSaasConversion: 80,       // Conversion rate for your customers
          monthlySaasPrice: 99,               // Your SAAS component pricing
          saasChurnRate: 5,                  // Add churn rate for SaaS subscribers
          hardwareMargin: 58,                 // Calculated from your prices (1200-500)/1200
          supportCosts: 200
        };
      } else if (idea.businessModel === 'Straight Sales') {
        initialModelType = 'Straight Sales';
        console.log('💡 Setting up Straight Sales model with YOUR actual data');
        initialModelInputs.straightSales = {
          unitPrice: 1200,                    // YOUR ACTUAL UNIT PRICE
          cogs: 500,                          // YOUR ACTUAL COST OF GOODS
          unitsSoldPerMonth: Math.max(1, Math.floor((extendedIdea.expectedMonthlyRevenue || 12000) / 1200)), // Calculate from your expected revenue
          growthRate: 15,                     // YOUR ACTUAL GROWTH RATE
          channelFees: 5,                     // YOUR ACTUAL CHANNEL FEES
          seasonalityFactor: [1.0, 1.0, 1.1, 1.1, 1.2, 1.2, 0.9, 0.9, 1.0, 1.1, 1.3, 1.4]
        };
      } else if (idea.businessModel === 'Marketplace') {
        initialModelType = 'Marketplace';
        console.log('💡 Setting up Marketplace model with YOUR actual data');
        initialModelInputs.marketplace = {
          gmvPerMonth: Math.max(10000, (extendedIdea.expectedMonthlyRevenue || 8000) * 12.5), // Calculate GMV from your expected revenue (assuming 8% take rate)
          takeRate: 8,                        // Your actual take rate
          gmvGrowthRate: 20,                  // Your actual growth
          supportCostsPercent: 10
        };
      } else {
        // For 'Other' business models, check if it's property-related
        if (idea.name.toLowerCase().includes('property') || idea.industry?.toLowerCase().includes('property')) {
          initialModelType = 'Property Play';
          console.log('💡 Setting up Property Play model with YOUR actual data');
          
          // Calculate realistic property price based on expected monthly revenue
          const expectedRent = Math.max(100, extendedIdea.expectedMonthlyRevenue || 1000);
          // Use 1% rule: property price should be roughly 100x monthly rent for positive cash flow
          const realisticPropertyPrice = Math.max(50000, expectedRent * 100);
          
          initialModelInputs.propertyPlay = {
            // Property Purchase & Financing - Based on realistic rent-to-price ratio
            propertyPurchasePrice: realisticPropertyPrice,
            downPaymentPercentage: 25,            // 25% deposit
            mortgageInterestRate: 4.5,            // Current UK mortgage rates
            mortgageTermYears: 25,                // Standard UK mortgage term
            
            // Income Streams
            monthlyRentIncome: expectedRent,      // YOUR expected monthly revenue
            rentGrowthRate: 3.5,                  // UK rental growth rate
            subscriptionServices: [
              {
                name: 'Property Management App',
                monthlyPrice: 25,
                expectedTenants: 1
              },
              {
                name: 'Maintenance Service',
                monthlyPrice: 15,
                expectedTenants: 1
              }
            ],
            payPerVisitServices: [
              {
                name: 'Professional Cleaning',
                pricePerVisit: 80,
                visitsPerMonth: 1,
                growthRate: 2
              },
              {
                name: 'Maintenance Visits',
                pricePerVisit: 120,
                visitsPerMonth: 0.5,
                growthRate: 1
              }
            ],
            
            // Renovation & Improvements - Scale with property price
            initialRenovationCost: Math.max(2000, realisticPropertyPrice * 0.05), // 5% of property price
            renovationFinancingRate: 5.5,        // Renovation loan rate
            renovationSpreadYears: 5,             // Spread renovation costs over 5 years
            ongoingMaintenancePercentage: 0.5,    // 0.5% of property value annually (reduced)
            
            // Operating Expenses - Scale appropriately
            propertyTaxPercentage: 0.3,           // Reduced from 0.5%
            insuranceCostAnnual: Math.max(300, realisticPropertyPrice * 0.002), // 0.2% of property value
            propertyManagementFeePercentage: 6,   // Reduced from 8% to 6%
            vacancyRate: 3,                       // Reduced from 5% to 3%
            
            // Property Appreciation
            propertyAppreciationRate: 4,          // UK property appreciation
            
            // Exit Strategy
            plannedHoldingPeriod: 10,             // 10 year hold period
            sellingCostsPercentage: 3             // Agent fees, legal costs, etc.
          };
          
          console.log(`🏠 Property Play initialized with realistic values:`, {
            expectedRent: expectedRent,
            propertyPrice: realisticPropertyPrice,
            rentToPrice: (expectedRent * 12 / realisticPropertyPrice * 100).toFixed(2) + '%',
            estimatedMortgage: Math.round(realisticPropertyPrice * 0.75 * 0.045 / 12),
            projectedCashFlow: expectedRent - Math.round(realisticPropertyPrice * 0.75 * 0.045 / 12) - Math.round(realisticPropertyPrice * 0.01 / 12)
          });
        } else {
          // Default to straight sales for other business types
          initialModelType = 'Straight Sales';
          console.log('💡 Defaulting to Straight Sales model with YOUR actual data');
          initialModelInputs.straightSales = {
            unitPrice: 1200,                    // Default unit price
            cogs: 500,                          // Default COGS
            unitsSoldPerMonth: Math.max(1, Math.floor((extendedIdea.expectedMonthlyRevenue || 12000) / 1200)),
            growthRate: 15,                     
            channelFees: 5,                     
            seasonalityFactor: [1.0, 1.0, 1.1, 1.1, 1.2, 1.2, 0.9, 0.9, 1.0, 1.1, 1.3, 1.4]
          };
        }
      }
      
      // Set up model configuration with YOUR ACTUAL DATA
      setModelConfig({
        id: idea.id,
        name: idea.name,                      // YOUR ACTUAL BUSINESS NAME
        description: idea.description || `${idea.name} business model`,
        sector: idea.industry || 'Technology',  // YOUR ACTUAL INDUSTRY
        launchYear: new Date().getFullYear(),
        modelActivations: [{
          modelType: initialModelType,
          startYear: new Date().getFullYear(),
          rampUpMonths: 3
        }],
        modelInputs: initialModelInputs,
        globalCosts: {
          initialSetupCost: idea.initialStartupCost || 50000,   // YOUR ACTUAL STARTUP COST
          monthlyFixedCosts: initialModelType === 'Property Play' ? 0 : (idea.ongoingMonthlyCost || 3000),   // Zero for Property Play
          teamCostsByYear: initialModelType === 'Property Play' ? [
            { year: 1, totalCost: 0 },
            { year: 2, totalCost: 0 },
            { year: 3, totalCost: 0 },
            { year: 4, totalCost: 0 },
            { year: 5, totalCost: 0 }
          ] : [
            { year: 1, totalCost: 120000 },
            { year: 2, totalCost: 180000 },
            { year: 3, totalCost: 240000 },
            { year: 4, totalCost: 300000 },
            { year: 5, totalCost: 360000 }
          ],
          hostingInfrastructure: initialModelType === 'Property Play' ? 0 : 500,
          marketingBudget: initialModelType === 'Property Play' ? 0 : 2000,
          fulfillmentLogistics: initialModelType === 'Property Play' ? 0 : 800,
          taxRate: 0.2,
          paymentProcessingFees: initialModelType === 'Property Play' ? 0 : 0.029
        },
        assumptions: {
          inflationRate: 0.03,
          discountRate: 0.1,
          forecastYears: 5
        }
      });
      
      // Set the selected model
      console.log('🎯 Setting selected model to:', initialModelType);
      setSelectedModels([initialModelType]);
    };
    
    if (idea.id) {
      loadExistingModel();
    } else {
      initializeWithYourBusinessModel();
    }
  }, [idea.id]); // Only depend on idea.id

  // Calculate forecast when model configuration changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedModels.length > 0) {
        calculateForecast();
      }
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timeoutId);
  }, [modelConfig.modelActivations, modelConfig.modelInputs, modelConfig.globalCosts, selectedModels]);

  // FORCE zero costs whenever Property Play is selected
  useEffect(() => {
    if (selectedModels.includes('Property Play')) {
      console.log('🏠 Property Play detected, FORCING zero personnel costs');
      setModelConfig(prev => ({
        ...prev,
        globalCosts: {
          ...prev.globalCosts,
          teamCostsByYear: [
            { year: 1, totalCost: 0 },
            { year: 2, totalCost: 0 },
            { year: 3, totalCost: 0 },
            { year: 4, totalCost: 0 },
            { year: 5, totalCost: 0 }
          ]
        }
      }));
    }
  }, [selectedModels]);

  // Handle model selection
  const handleModelToggle = (modelType: BusinessModelType) => {
    console.log('🔧 Business model toggle clicked:', modelType);
    console.log('Current selected models:', selectedModels);
    
    if (selectedModels.includes(modelType)) {
      console.log('Removing model:', modelType);
      setSelectedModels(selectedModels.filter(m => m !== modelType));
      setModelConfig(prev => ({
        ...prev,
        modelActivations: prev.modelActivations.filter(a => a.modelType !== modelType)
      }));
    } else {
      console.log('Adding model:', modelType);
      setSelectedModels([...selectedModels, modelType]);
      setModelConfig(prev => {
        const newModelInputs = { ...prev.modelInputs };
        
        // Initialize default values for different model types
        if (modelType === 'SAAS') {
          newModelInputs.saas = {
            monthlyPriceTiers: [
              { name: 'Basic', price: 29.99 },
              { name: 'Pro', price: 99.99 }
            ],
            freeTrialConversionRate: 15,
            monthlyNewUserAcquisition: 100,
            userChurnRate: 5.0,
            cac: 75,
            growthRatesByYear: createDefaultGrowthRates(5, 3),
            upsellExpansionRevenue: 25
          };
        } else if (modelType === 'Hardware + SAAS') {
          newModelInputs.hardwareSaas = {
            hardwareUnitCost: 50,
            hardwareSalePrice: 199,
            monthlyHardwareUnitsSold: 50,
            hardwareGrowthRate: 5,
            hardwareToSaasConversion: 60,
            monthlySaasPrice: 19.99,
            saasChurnRate: 5,
            hardwareMargin: 75,
            supportCosts: 10
          };
        } else if (modelType === 'Straight Sales') {
          newModelInputs.straightSales = {
            unitPrice: 99.99,
            cogs: 30,
            unitsSoldPerMonth: 200,
            growthRate: 3,
            channelFees: 15,
            seasonalityFactor: [1.0, 1.0, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 1.0, 1.1, 1.3, 1.4]
          };
        } else if (modelType === 'Marketplace') {
          newModelInputs.marketplace = {
            gmvPerMonth: 50000,
            takeRate: 8,
            gmvGrowthRate: 10,
            supportCostsPercent: 2
          };
        } else if (modelType === 'Property Play') {
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
        
        // Also add some default cost structure if this is the first model
        // Set reasonable default team costs based on business model type
        const getDefaultTeamCosts = (modelType: string) => {
          switch (modelType) {
            case 'Property Play':
              return [
                { year: 1, totalCost: 0 },
                { year: 2, totalCost: 0 },
                { year: 3, totalCost: 0 },
                { year: 4, totalCost: 0 },
                { year: 5, totalCost: 0 }
              ];
            case 'SAAS':
            case 'Freemium → Premium':
              // Lower costs for tech-focused businesses
              return [
                { year: 1, totalCost: 60000 },   // £60k - solo founder or small team
                { year: 2, totalCost: 90000 },   // £90k - add developer/support
                { year: 3, totalCost: 120000 },  // £120k - small team
                { year: 4, totalCost: 150000 },  // £150k - scaling team
                { year: 5, totalCost: 180000 }   // £180k - established team
              ];
            case 'Straight Sales':
            case 'Hardware + SAAS':
              // Moderate costs for product-based businesses
              return [
                { year: 1, totalCost: 50000 },   // £50k - lean startup approach
                { year: 2, totalCost: 75000 },   // £75k - add operations
                { year: 3, totalCost: 100000 },  // £100k - small team
                { year: 4, totalCost: 125000 },  // £125k - growth phase
                { year: 5, totalCost: 150000 }   // £150k - established operations
              ];
            case 'Services/Consulting':
            case 'Licensing/IP':
              // Lower costs for service-based businesses
              return [
                { year: 1, totalCost: 40000 },   // £40k - solo or small team
                { year: 2, totalCost: 60000 },   // £60k - add specialist
                { year: 3, totalCost: 80000 },   // £80k - small team
                { year: 4, totalCost: 100000 },  // £100k - expanding team
                { year: 5, totalCost: 120000 }   // £120k - established practice
              ];
            default:
              // Conservative defaults for other business models
              return [
                { year: 1, totalCost: 50000 },
                { year: 2, totalCost: 75000 },
                { year: 3, totalCost: 100000 },
                { year: 4, totalCost: 125000 },
                { year: 5, totalCost: 150000 }
              ];
          }
        };

        const updatedGlobalCosts = prev.globalCosts.initialSetupCost === 0 ? {
          ...prev.globalCosts,
          initialSetupCost: modelType === 'Property Play' ? 0 : 15000, // No setup cost for property investment
          monthlyFixedCosts: modelType === 'Property Play' ? 0 : 2000, // Reduced from 3000
          teamCostsByYear: getDefaultTeamCosts(modelType),
          hostingInfrastructure: modelType === 'Property Play' ? 0 : 300, // Reduced from 500
          marketingBudget: modelType === 'Property Play' ? 0 : 1000, // Reduced from 2000
          fulfillmentLogistics: modelType === 'Property Play' ? 0 : 100, // Reduced from 200
          paymentProcessingFees: modelType === 'Property Play' ? 0 : 0.029
        } : prev.globalCosts;

        return {
          ...prev,
          modelInputs: newModelInputs,
          globalCosts: updatedGlobalCosts,
          modelActivations: [...prev.modelActivations, {
            modelType,
            startYear: prev.launchYear,
            rampUpMonths: 12
          }]
        };
      });
    }
    
    console.log('Model toggle complete');
  };

  // Save configuration
  const handleSave = async () => {
    try {
      console.log('🚀 SAVE BUTTON CLICKED - Starting save process...');
      console.log('📊 Current model config state:', {
        name: modelConfig.name,
        modelInputsKeys: Object.keys(modelConfig.modelInputs),
        globalCosts: modelConfig.globalCosts,
        modelActivations: modelConfig.modelActivations,
        forecastResultsLength: forecastResults?.length || 0
      });
      
      // Map the modelConfig to the expected API format
      const apiData = {
        name: modelConfig.name,
        description: modelConfig.description,
        sector: modelConfig.sector,
        launchYear: modelConfig.launchYear,
        modelActivations: modelConfig.modelActivations,
        modelInputs: modelConfig.modelInputs,
        globalCosts: modelConfig.globalCosts, // Use globalCosts directly (API expects this)
        assumptions: modelConfig.assumptions,
        forecastResults: forecastResults // Include the calculated forecast results
      };
      
      console.log('💾 Saving advanced model with data:', {
        name: apiData.name,
        hasModelInputs: !!apiData.modelInputs,
        hasGlobalCosts: !!apiData.globalCosts,
        forecastResultsLength: apiData.forecastResults?.length || 0,
        modelActivationsLength: apiData.modelActivations?.length || 0,
        businessIdeaId: idea.id,
        userId: propUserId,
        userIdType: typeof propUserId,
        userIdValid: !!propUserId
      });
      
      console.log('🔄 Calling parent onUpdateModel function...');
      // Call the parent's update function and wait for it to complete
      await onUpdateModel(apiData);
      
      console.log('✅ Save completed successfully!');
      // Show success feedback
      alert('Advanced business model saved successfully!');
    } catch (error) {
      console.error('❌ Error saving model:', error);
      alert(`Failed to save model: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading existing model data...</p>
            </div>
          </div>
        )}
        
        {!isLoading && activeTab === 'setup' && (
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

        {!isLoading && activeTab === 'models' && (
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
                                                                      saasChurnRate: prev.modelInputs.hardwareSaas?.saasChurnRate || 5,
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
                          SaaS Monthly Churn Rate (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={modelConfig.modelInputs.hardwareSaas?.saasChurnRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                hardwareSaas: {
                                  ...prev.modelInputs.hardwareSaas!,
                                  saasChurnRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 5.0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Percentage of SaaS subscribers who cancel each month
                        </p>
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
                        {modelConfig.modelInputs.propertyPlay && (
                          (() => {
                            const rent = modelConfig.modelInputs.propertyPlay.monthlyRentIncome || 0;
                            const propertyPrice = modelConfig.modelInputs.propertyPlay.propertyPurchasePrice || 0;
                            const mortgageRate = modelConfig.modelInputs.propertyPlay.mortgageInterestRate || 4.5;
                            const downPayment = modelConfig.modelInputs.propertyPlay.downPaymentPercentage || 25;
                            
                            // Calculate estimated monthly mortgage payment
                            const loanAmount = propertyPrice * (1 - downPayment / 100);
                            const monthlyRate = mortgageRate / 100 / 12;
                            const estimatedMortgage = loanAmount > 0 && monthlyRate > 0 
                              ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 300)) / (Math.pow(1 + monthlyRate, 300) - 1)
                              : 0;
                            
                            // Estimate total monthly expenses (mortgage + 20% for other costs)
                            const estimatedExpenses = estimatedMortgage * 1.2;
                            const estimatedCashFlow = rent - estimatedExpenses;
                            
                            if (rent > 0 && propertyPrice > 0 && estimatedCashFlow < 0) {
                              const suggestedRent = Math.ceil(estimatedExpenses / 100) * 100; // Round up to nearest 100
                              return (
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <h3 className="text-sm font-medium text-amber-800">
                                        Potential Negative Cash Flow
                                      </h3>
                                      <div className="mt-2 text-sm text-amber-700">
                                        <p>
                                          With a £{propertyPrice.toLocaleString()} property and £{rent} monthly rent, 
                                          you may have negative cash flow (estimated £{Math.round(estimatedCashFlow)} per month).
                                        </p>
                                        <p className="mt-1">
                                          Consider: Monthly rent of £{suggestedRent}+ or reduce property price to £{Math.round(rent * 100).toLocaleString()}.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vacancy Rate (% of time vacant)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={modelConfig.modelInputs.propertyPlay?.vacancyRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                propertyPlay: {
                                  ...prev.modelInputs.propertyPlay!,
                                  vacancyRate: Math.max(0, Math.min(100, value)) // Clamp between 0-100
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 3"
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          Currently set to {modelConfig.modelInputs.propertyPlay?.vacancyRate || 3}% 
                          ({Math.round(((modelConfig.modelInputs.propertyPlay?.vacancyRate || 3) / 100) * 365)} days vacant per year)
                        </div>
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

        {!isLoading && activeTab === 'costs' && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">💰 Global Cost Structure</h3>
              <p className="text-blue-700">
                Configure your business operating costs. These costs will be applied across all revenue models.
              </p>
            </div>

            {/* Property Play Notice */}
            {selectedModels.includes('Property Play') && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🏠</div>
                  <div>
                    <h3 className="text-lg font-medium text-green-900 mb-2">Property Play Model Detected</h3>
                    <p className="text-green-700 mb-2">
                      Property investments typically don't require operational costs like staff, hosting, or marketing budgets. 
                      The following costs have been automatically set to £0 for your Property Play model:
                    </p>
                    <ul className="text-sm text-green-600 space-y-1">
                      <li>• Personnel Costs by Year: £0 (no staff required)</li>
                      <li>• Monthly Fixed Costs: £0 (office/utilities handled by property management)</li>
                      <li>• Hosting & Infrastructure: £0 (no tech infrastructure needed)</li>
                      <li>• Marketing Budget: £0 (tenants found through letting agents)</li>
                      <li>• Fulfillment & Logistics: £0 (no product delivery)</li>
                      <li>• Payment Processing Fees: £0 (rent typically paid by bank transfer)</li>
                    </ul>
                    <p className="text-green-700 mt-2 text-sm">
                      Property-specific costs (mortgage, taxes, insurance, maintenance) are configured in the Property Play model inputs.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                        placeholder={selectedModels.includes('Property Play') ? "e.g., 0 (optional)" : "e.g., 150000"}
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

        {!isLoading && activeTab === 'forecast' && (
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
                  <div className="text-xs text-gray-500 mt-1">
                    (Includes £{modelConfig.globalCosts.initialSetupCost.toLocaleString()} setup cost)
                  </div>
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
                        Total Costs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cumulative Cash Flow
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                      const yearResults = forecastResults.filter(r => r.year === year);
                      const yearRevenue = yearResults.reduce((sum, r) => sum + r.totalRevenue, 0);
                      const yearCosts = yearResults.reduce((sum, r) => sum + r.totalCosts, 0);
                      const yearProfit = yearResults.reduce((sum, r) => sum + r.netProfit, 0);
                      const endOfYearCashFlow = yearResults[yearResults.length - 1]?.cumulativeCashFlow || 0;
                      
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            £{yearCosts.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${yearProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{yearProfit.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${endOfYearCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{endOfYearCashFlow.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Income Breakdown Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Income by Type (Annual)</h3>
                <p className="text-sm text-gray-600 mt-1">Detailed breakdown of all income sources</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Income Source
                      </th>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => (
                        <th key={year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year {year - modelConfig.launchYear + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedModels.map(model => (
                      <tr key={model}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {model}
                        </td>
                        {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                          const yearRevenue = forecastResults
                            .filter(r => r.year === year)
                            .reduce((sum, r) => sum + (r.revenueByModel[model] || 0), 0);
                          return (
                            <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              £{yearRevenue.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    
                    {/* Property Play Detailed Breakdown */}
                    {selectedModels.includes('Property Play') && modelConfig.modelInputs.propertyPlay && (
                      <>
                        <tr className="bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900" colSpan={Array.from(new Set(forecastResults.map(r => r.year))).length + 1}>
                            Property Play - Detailed Breakdown
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                            → Rental Income (after vacancy)
                          </td>
                          {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                            const propertyPlay = modelConfig.modelInputs.propertyPlay!;
                            const yearsSinceStart = year - modelConfig.launchYear;
                            const rentGrowthFactor = Math.pow(1 + (propertyPlay.rentGrowthRate || 0) / 100, yearsSinceStart);
                            const adjustedRentIncome = (propertyPlay.monthlyRentIncome || 0) * rentGrowthFactor * (1 - (propertyPlay.vacancyRate || 0) / 100);
                            const annualRentIncome = adjustedRentIncome * 12;
                            return (
                              <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                £{annualRentIncome.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                        {modelConfig.modelInputs.propertyPlay.subscriptionServices?.map((service, idx) => (
                          <tr key={`sub-${idx}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                              → {service.name}
                            </td>
                            {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                              const annualServiceRevenue = (service.monthlyPrice * service.expectedTenants) * 12;
                              return (
                                <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  £{annualServiceRevenue.toLocaleString()}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {modelConfig.modelInputs.propertyPlay.payPerVisitServices?.map((service, idx) => (
                          <tr key={`visit-${idx}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                              → {service.name}
                            </td>
                            {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                              const yearsSinceStart = year - modelConfig.launchYear;
                              const serviceGrowthFactor = Math.pow(1 + (service.growthRate || 0) / 100, yearsSinceStart);
                              const annualServiceRevenue = (service.pricePerVisit * service.visitsPerMonth * serviceGrowthFactor) * 12;
                              return (
                                <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  £{annualServiceRevenue.toLocaleString()}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </>
                    )}
                    
                    <tr className="bg-gray-100 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Total Income
                      </td>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                        const yearRevenue = forecastResults
                          .filter(r => r.year === year)
                          .reduce((sum, r) => sum + r.totalRevenue, 0);
                        return (
                          <td key={year} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            £{yearRevenue.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Costs by Type (Annual)</h3>
                <p className="text-sm text-gray-600 mt-1">Detailed breakdown of all cost categories</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Category
                      </th>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => (
                        <th key={year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year {year - modelConfig.launchYear + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Personnel Costs */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Personnel Costs
                      </td>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                        const currentYear = year - modelConfig.launchYear + 1;
                        const teamCostForYear = modelConfig.globalCosts.teamCostsByYear.find(tc => tc.year === currentYear);
                        const annualTeamCost = teamCostForYear ? teamCostForYear.totalCost : 0;
                        return (
                          <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            £{annualTeamCost.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Fixed Operating Costs */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Office & Utilities
                      </td>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                        const annualFixedCosts = modelConfig.globalCosts.monthlyFixedCosts * 12;
                        return (
                          <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            £{annualFixedCosts.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                    
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Hosting & Infrastructure
                      </td>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                        const annualHostingCosts = modelConfig.globalCosts.hostingInfrastructure * 12;
                        return (
                          <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            £{annualHostingCosts.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                    
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Marketing Budget
                      </td>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                        const annualMarketingCosts = modelConfig.globalCosts.marketingBudget * 12;
                        return (
                          <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            £{annualMarketingCosts.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                    
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Fulfillment & Logistics
                      </td>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                        const annualFulfillmentCosts = modelConfig.globalCosts.fulfillmentLogistics * 12;
                        return (
                          <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            £{annualFulfillmentCosts.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Property Play Specific Costs */}
                    {selectedModels.includes('Property Play') && modelConfig.modelInputs.propertyPlay && (
                      <>
                        <tr className="bg-red-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900" colSpan={Array.from(new Set(forecastResults.map(r => r.year))).length + 1}>
                            Property Play - Detailed Costs
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                            → Mortgage Payments
                          </td>
                          {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                            const propertyPlay = modelConfig.modelInputs.propertyPlay!;
                            const loanAmount = propertyPlay.propertyPurchasePrice * (1 - propertyPlay.downPaymentPercentage / 100);
                            let monthlyMortgagePayment = 0;
                            
                            if (propertyPlay.downPaymentPercentage < 100 && loanAmount > 0 && propertyPlay.mortgageInterestRate > 0) {
                              const monthlyRate = propertyPlay.mortgageInterestRate / 100 / 12;
                              const totalPayments = propertyPlay.mortgageTermYears * 12;
                              monthlyMortgagePayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
                            } else if (propertyPlay.downPaymentPercentage < 100 && loanAmount > 0) {
                              monthlyMortgagePayment = loanAmount / (propertyPlay.mortgageTermYears * 12);
                            }
                            
                            const annualMortgagePayment = monthlyMortgagePayment * 12;
                            return (
                              <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                £{annualMortgagePayment.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                            → Property Tax ({modelConfig.modelInputs.propertyPlay.propertyTaxPercentage}% of value)
                          </td>
                          {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                            const propertyPlay = modelConfig.modelInputs.propertyPlay!;
                            const yearsSinceStart = year - modelConfig.launchYear;
                            const currentPropertyValue = propertyPlay.propertyPurchasePrice * Math.pow(1 + (propertyPlay.propertyAppreciationRate || 0) / 100, yearsSinceStart);
                            const annualPropertyTax = currentPropertyValue * (propertyPlay.propertyTaxPercentage || 0) / 100;
                            return (
                              <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                £{annualPropertyTax.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                            → Insurance
                          </td>
                          {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                            const annualInsurance = modelConfig.modelInputs.propertyPlay!.insuranceCostAnnual;
                            return (
                              <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                £{annualInsurance.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                            → Maintenance ({modelConfig.modelInputs.propertyPlay.ongoingMaintenancePercentage}% of value)
                          </td>
                          {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                            const propertyPlay = modelConfig.modelInputs.propertyPlay!;
                            const yearsSinceStart = year - modelConfig.launchYear;
                            const currentPropertyValue = propertyPlay.propertyPurchasePrice * Math.pow(1 + (propertyPlay.propertyAppreciationRate || 0) / 100, yearsSinceStart);
                            const annualMaintenance = currentPropertyValue * (propertyPlay.ongoingMaintenancePercentage || 0) / 100;
                            return (
                              <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                £{annualMaintenance.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                            → Property Management Fee ({modelConfig.modelInputs.propertyPlay.propertyManagementFeePercentage}% of rent)
                          </td>
                          {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                            const propertyPlay = modelConfig.modelInputs.propertyPlay!;
                            const yearsSinceStart = year - modelConfig.launchYear;
                            const rentGrowthFactor = Math.pow(1 + (propertyPlay.rentGrowthRate || 0) / 100, yearsSinceStart);
                            const currentRentIncome = (propertyPlay.monthlyRentIncome || 0) * rentGrowthFactor;
                            const annualManagementFees = (currentRentIncome * (propertyPlay.propertyManagementFeePercentage || 0) / 100) * 12;
                            return (
                              <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                £{annualManagementFees.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 pl-8">
                            → Renovation Loan Payment
                          </td>
                          {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                            const propertyPlay = modelConfig.modelInputs.propertyPlay!;
                            let monthlyRenovationPayment = 0;
                            
                            if (propertyPlay.initialRenovationCost > 0 && propertyPlay.renovationSpreadYears > 0) {
                              const renovationMonthlyRate = (propertyPlay.renovationFinancingRate || 0) / 100 / 12;
                              const renovationPayments = propertyPlay.renovationSpreadYears * 12;
                              
                              if (renovationMonthlyRate > 0) {
                                monthlyRenovationPayment = propertyPlay.initialRenovationCost * 
                                  (renovationMonthlyRate * Math.pow(1 + renovationMonthlyRate, renovationPayments)) / 
                                  (Math.pow(1 + renovationMonthlyRate, renovationPayments) - 1);
                              } else {
                                monthlyRenovationPayment = propertyPlay.initialRenovationCost / renovationPayments;
                              }
                            }
                            
                            const annualRenovationPayment = monthlyRenovationPayment * 12;
                            return (
                              <td key={year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                £{annualRenovationPayment.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    )}
                    
                    <tr className="bg-gray-100 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Total Costs
                      </td>
                      {Array.from(new Set(forecastResults.map(r => r.year))).map(year => {
                        const yearCosts = forecastResults
                          .filter(r => r.year === year)
                          .reduce((sum, r) => sum + r.totalCosts, 0);
                        return (
                          <td key={year} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            £{yearCosts.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
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

        {!isLoading && activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Sensitivity Analysis Component */}
            <SensitivityAnalysis 
              baselineModel={{
                ...modelConfig,
                forecastResults: forecastResults,
                selectedModels: selectedModels,
                // Ensure the data structure matches what SensitivityAnalysis expects
                modelInputs: modelConfig.modelInputs,
                globalCosts: modelConfig.globalCosts,
                // Add debug logging
                _debug: {
                  forecastResultsCount: forecastResults.length,
                  sampleForecastResult: forecastResults[0],
                  globalCostsKeys: Object.keys(modelConfig.globalCosts || {}),
                  initialSetupCost: modelConfig.globalCosts?.initialSetupCost
                }
              }}
              onExport={(format) => {
                console.log(`Exporting in ${format} format`);
                // Export functionality will be implemented
              }}
            />

            {/* Debug Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <strong>Debug Info:</strong> Loading: {isLoading.toString()}, Selected Models: [{selectedModels.join(', ')}], 
              Model Activations: {modelConfig.modelActivations.length}
            </div>

            {/* Data Status Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium">📊 Analysis Data Status</h4>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-blue-700">Forecast Results:</span>
                  <span className="ml-2 font-medium">{forecastResults.length} data points</span>
                </div>
                <div>
                  <span className="text-blue-700">Active Models:</span>
                  <span className="ml-2 font-medium">{selectedModels.join(', ') || 'None'}</span>
                </div>
                <div>
                  <span className="text-blue-700">Launch Year:</span>
                  <span className="ml-2 font-medium">{modelConfig.launchYear}</span>
                </div>
                <div>
                  <span className="text-blue-700">Forecast Years:</span>
                  <span className="ml-2 font-medium">{modelConfig.assumptions.forecastYears}</span>
                </div>
              </div>
              {forecastResults.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  <strong>Sample Revenue:</strong> Month 1: £{forecastResults[0]?.totalRevenue?.toLocaleString() || '0'}, 
                  Year 1 Total: £{forecastResults.filter(r => r.year === modelConfig.launchYear).reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()}
                </div>
              )}
            </div>

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
                      £{forecastResults.length > 0 ? forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Model Performance</h3>
                <div className="space-y-3">
                  {selectedModels.map(model => {
                    const modelRevenue = forecastResults.length > 0 ? forecastResults.reduce((sum, r) => sum + (r.revenueByModel[model] || 0), 0) : 0;
                    const totalRevenue = forecastResults.length > 0 ? forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0) : 0;
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