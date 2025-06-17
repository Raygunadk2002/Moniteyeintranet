import React, { useState, useEffect } from 'react';
import { BusinessIdea } from '../pages/business-ideas';

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
  | 'Freemium → Premium';

// Time-based model activation
export interface ModelActivation {
  modelType: BusinessModelType;
  startYear: number;
  endYear?: number;
  rampUpMonths: number;
}

// Model-specific input structures
export interface SaasInputs {
  monthlyPriceTiers: { name: string; price: number }[];
  freeTrialConversionRate: number;
  monthlyNewUserAcquisition: number;
  userChurnRate: number;
  cac: number;
  monthlyGrowthRate: number;
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

// Global cost structure
export interface GlobalCosts {
  initialSetupCost: number;
  monthlyFixedCosts: number;
  salaries: { role: string; salary: number; count: number }[];
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
  onUpdateModel: (modelConfig: BusinessModelConfig) => void;
  onBack: () => void;
}

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
      salaries: [],
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
    { type: 'Freemium → Premium', description: 'Free tier with premium upgrade path', icon: '⬆️' }
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
                  const growthFactor = Math.pow(1 + saas.monthlyGrowthRate / 100, monthsSinceStart);
                  const baseUsers = saas.monthlyNewUserAcquisition * monthsSinceStart * growthFactor;
                  const churnAdjustedUsers = Math.max(0, baseUsers * Math.pow(1 - saas.userChurnRate / 100, monthsSinceStart));
                  modelCustomers = churnAdjustedUsers * rampUpFactor;
                  
                  const avgPrice = saas.monthlyPriceTiers.reduce((sum, tier) => sum + tier.price, 0) / saas.monthlyPriceTiers.length;
                  modelRevenue = modelCustomers * avgPrice * (1 + saas.upsellExpansionRevenue / 100);
                }
                break;

              case 'Straight Sales':
                if (modelConfig.modelInputs.straightSales) {
                  const sales = modelConfig.modelInputs.straightSales;
                  const growthFactor = Math.pow(1 + sales.growthRate / 100, monthsSinceStart);
                  const baseUnits = sales.unitsSoldPerMonth * growthFactor;
                  const seasonalFactor = sales.seasonalityFactor[month - 1] || 1;
                  const units = baseUnits * seasonalFactor * rampUpFactor;
                  modelRevenue = units * sales.unitPrice * (1 - sales.channelFees / 100);
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
            }

            revenueByModel[activation.modelType] = modelRevenue;
            customerBase[activation.modelType] = modelCustomers;
            totalRevenue += modelRevenue;
          }
        });

        // Add costs
        totalCosts += modelConfig.globalCosts.salaries.reduce((sum, salary) => 
          sum + (salary.salary * salary.count) / 12, 0
        );
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
      setModelConfig(prev => ({
        ...prev,
        modelActivations: [...prev.modelActivations, {
          modelType,
          startYear: prev.launchYear,
          rampUpMonths: 12
        }]
      }));
    }
  };

  // Save configuration
  const handleSave = () => {
    onUpdateModel(modelConfig);
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
                                  monthlyGrowthRate: prev.modelInputs.saas?.monthlyGrowthRate || 10,
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
                          Monthly Growth Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={modelConfig.modelInputs.saas?.monthlyGrowthRate || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setModelConfig(prev => ({
                              ...prev,
                              modelInputs: {
                                ...prev.modelInputs,
                                saas: {
                                  ...prev.modelInputs.saas!,
                                  monthlyGrowthRate: value
                                }
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 10.0"
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
                          Monthly Growth Rate (%)
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
                          GMV Growth Rate (%)
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
                </div>
              ))
            )}
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

            {/* Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends (Chart)</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                📈 Interactive charts will be implemented with Chart.js or similar library
                <br />
                Features: Revenue by model over time, break-even analysis, customer growth
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">🚧 Advanced Analytics Coming Soon</h3>
              <p className="text-yellow-700 mb-4">
                This section will include advanced features such as:
              </p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Sensitivity analysis sliders (churn ±5%, CAC ±10%)</li>
                <li>Scenario comparison (Base Case vs Aggressive Growth)</li>
                <li>CAC vs LTV analysis</li>
                <li>Monte Carlo simulations</li>
                <li>Export to CSV, PDF, or Google Sheets</li>
                <li>Integration with market benchmarks and APIs</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
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
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Model Performance</h3>
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 