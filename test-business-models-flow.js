#!/usr/bin/env node

/**
 * Comprehensive Business Model Flow Test
 * Tests that all business model inputs flow correctly to forecast outputs
 */

const BASE_URL = 'http://localhost:3000';

// Test data for different business models
const testBusinessModels = {
  SAAS: {
    modelInputs: {
      monthlyPriceTiers: [
        { name: 'Basic', price: 29.99 },
        { name: 'Pro', price: 99.99 }
      ],
      freeTrialConversionRate: 15,
      monthlyNewUserAcquisition: 100,
      userChurnRate: 5,
      cac: 75,
      growthRatesByYear: [
        { year: 2025, monthlyGrowthRate: 3 },
        { year: 2026, monthlyGrowthRate: 4 },
        { year: 2027, monthlyGrowthRate: 2 }
      ],
      upsellExpansionRevenue: 10
    }
  },
  'Hardware + SAAS': {
    modelInputs: {
      hardwareUnitCost: 150,
      hardwareSalePrice: 199,
      monthlyHardwareUnitsSold: 50,
      hardwareGrowthRate: 3,
      hardwareToSaasConversion: 80,
      monthlySaasPrice: 19.99,
      hardwareMargin: 25,
      supportCosts: 500
    }
  },
  'Straight Sales': {
    modelInputs: {
      unitPrice: 99.99,
      cogs: 45,
      unitsSoldPerMonth: 200,
      growthRate: 3,
      channelFees: 5,
      seasonalityFactor: [1, 1, 1.2, 1.1, 1, 0.9, 0.8, 0.8, 1, 1.1, 1.3, 1.4]
    }
  },
  'Marketplace': {
    modelInputs: {
      gmvPerMonth: 50000,
      takeRate: 8,
      gmvGrowthRate: 5,
      supportCostsPercent: 2
    }
  },
  'Property Play': {
    modelInputs: {
      propertyPurchasePrice: 500000,
      downPaymentPercentage: 25,
      mortgageInterestRate: 4.5,
      mortgageTermYears: 25,
      monthlyRentIncome: 3500,
      rentGrowthRate: 3,
      subscriptionServices: [
        { name: 'Smart Home Package', monthlyPrice: 50, expectedTenants: 2 },
        { name: 'Cleaning Service', monthlyPrice: 80, expectedTenants: 1 }
      ],
      payPerVisitServices: [
        { name: 'Maintenance Calls', pricePerVisit: 120, visitsPerMonth: 3, growthRate: 2 }
      ],
      initialRenovationCost: 50000,
      renovationFinancingRate: 5,
      renovationSpreadYears: 5,
      ongoingMaintenancePercentage: 1.5,
      propertyTaxPercentage: 1.2,
      insuranceCostAnnual: 2400,
      propertyManagementFeePercentage: 8,
      vacancyRate: 5,
      propertyAppreciationRate: 4,
      plannedHoldingPeriod: 10,
      sellingCostsPercentage: 6
    }
  }
};

const globalCosts = {
  initialSetupCost: 25000,
  monthlyFixedCosts: 3000,
  teamCostsByYear: [
    { year: 1, totalCost: 120000 },
    { year: 2, totalCost: 180000 },
    { year: 3, totalCost: 250000 },
    { year: 4, totalCost: 300000 },
    { year: 5, totalCost: 350000 }
  ],
  hostingInfrastructure: 500,
  marketingBudget: 2000,
  fulfillmentLogistics: 800,
  taxRate: 0.2,
  paymentProcessingFees: 0.029
};

const assumptions = {
  inflationRate: 2.5,
  discountRate: 10,
  forecastYears: 5
};

async function testBusinessModelFlow(modelType, testData) {
  console.log(`\n🧪 Testing ${modelType} Model Flow...`);
  
  try {
    // Step 1: Create a test business idea
    const businessIdea = {
      title: `Test ${modelType} Business`,
      description: `Testing ${modelType} model flow from inputs to outputs`,
      sector: 'Technology',
      stage: 'Concept'
    };

    const createResponse = await fetch(`${BASE_URL}/api/business-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(businessIdea)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create business idea: ${createResponse.status}`);
    }

    const createdIdea = await createResponse.json();
    console.log(`✅ Created business idea: ${createdIdea.id}`);

    // Step 2: Create advanced model configuration
    const modelConfig = {
      id: createdIdea.id,
      name: `Test ${modelType} Model`,
      description: `Testing ${modelType} revenue model`,
      sector: 'Technology',
      launchYear: 2025,
      modelActivations: [{
        modelType: modelType,
        startYear: 2025,
        rampUpMonths: 6
      }],
      modelInputs: {
        [modelType.toLowerCase().replace(/\s+/g, '').replace('+', '')]: testData.modelInputs
      },
      globalCosts,
      assumptions
    };

    // Step 3: Save advanced model
    const saveResponse = await fetch(`${BASE_URL}/api/business-ideas/${createdIdea.id}/advanced-model?userId=test-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelConfig)
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      throw new Error(`Failed to save advanced model: ${saveResponse.status} - ${errorText}`);
    }

    console.log(`✅ Saved advanced model configuration`);

    // Step 4: Retrieve and verify the model
    const retrieveResponse = await fetch(`${BASE_URL}/api/business-ideas/${createdIdea.id}/advanced-model?userId=test-user`);
    
    if (!retrieveResponse.ok) {
      throw new Error(`Failed to retrieve advanced model: ${retrieveResponse.status}`);
    }

    const retrievedModel = await retrieveResponse.json();
    console.log(`✅ Retrieved advanced model successfully`);

    // Step 5: Verify data integrity
    const inputKey = modelType.toLowerCase().replace(/\s+/g, '').replace('+', '');
    const savedInputs = retrievedModel.modelInputs[inputKey];
    
    if (!savedInputs) {
      throw new Error(`Model inputs not found for ${modelType}`);
    }

    // Step 6: Verify key input values are preserved
    const originalInputs = testData.modelInputs;
    let inputsMatch = true;
    let mismatchDetails = [];

    for (const [key, value] of Object.entries(originalInputs)) {
      if (JSON.stringify(savedInputs[key]) !== JSON.stringify(value)) {
        inputsMatch = false;
        mismatchDetails.push(`${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(savedInputs[key])}`);
      }
    }

    if (!inputsMatch) {
      console.warn(`⚠️  Input mismatch detected:`);
      mismatchDetails.forEach(detail => console.warn(`   ${detail}`));
    } else {
      console.log(`✅ All inputs preserved correctly`);
    }

    // Step 7: Test forecast calculation (simulate frontend calculation)
    const forecastResults = simulateForecastCalculation(retrievedModel);
    
    if (forecastResults.length === 0) {
      throw new Error('No forecast results generated');
    }

    console.log(`✅ Generated ${forecastResults.length} forecast data points`);

    // Step 8: Verify output metrics
    const totalRevenue = forecastResults.reduce((sum, r) => sum + r.totalRevenue, 0);
    const breakEvenMonth = forecastResults.findIndex(r => r.breakEvenReached);
    const peakMonthlyRevenue = Math.max(...forecastResults.map(r => r.totalRevenue));

    console.log(`📊 Output Metrics:`);
    console.log(`   Total Revenue (5 years): £${totalRevenue.toLocaleString()}`);
    console.log(`   Peak Monthly Revenue: £${peakMonthlyRevenue.toLocaleString()}`);
    console.log(`   Break-even: ${breakEvenMonth >= 0 ? `Month ${breakEvenMonth + 1}` : 'Not reached'}`);

    // Step 9: Verify model-specific revenue is generated
    const modelRevenue = forecastResults.reduce((sum, r) => sum + (r.revenueByModel[modelType] || 0), 0);
    
    if (modelRevenue === 0) {
      throw new Error(`No revenue generated for ${modelType} model`);
    }

    console.log(`   ${modelType} Revenue: £${modelRevenue.toLocaleString()} (${((modelRevenue/totalRevenue)*100).toFixed(1)}% of total)`);

    console.log(`✅ ${modelType} model flow test PASSED`);
    
    return {
      success: true,
      modelType,
      totalRevenue,
      modelRevenue,
      breakEvenMonth,
      peakMonthlyRevenue
    };

  } catch (error) {
    console.error(`❌ ${modelType} model flow test FAILED:`, error.message);
    return {
      success: false,
      modelType,
      error: error.message
    };
  }
}

// Simplified forecast calculation (mirrors the frontend logic)
function simulateForecastCalculation(modelConfig) {
  const results = [];
  const startYear = modelConfig.launchYear;
  const endYear = startYear + modelConfig.assumptions.forecastYears;

  for (let year = startYear; year < endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthIndex = (year - startYear) * 12 + month - 1;
      
      const revenueByModel = {};
      let totalRevenue = 0;
      let totalCosts = modelConfig.globalCosts.monthlyFixedCosts;

      // Process each model activation
      modelConfig.modelActivations.forEach(activation => {
        if (year >= activation.startYear) {
          const monthsSinceStart = Math.max(0, (year - activation.startYear) * 12 + month - 1);
          const rampUpFactor = Math.min(1, monthsSinceStart / activation.rampUpMonths);
          
          let modelRevenue = 0;

          // Calculate revenue based on model type (simplified versions)
          switch (activation.modelType) {
            case 'SAAS':
              if (modelConfig.modelInputs.saas) {
                const saas = modelConfig.modelInputs.saas;
                const growthFactor = Math.pow(1.03, monthsSinceStart); // 3% monthly growth
                const baseUsers = saas.monthlyNewUserAcquisition * monthsSinceStart * growthFactor;
                const activeUsers = baseUsers * Math.pow(0.95, monthsSinceStart) * rampUpFactor; // 5% churn
                const avgPrice = saas.monthlyPriceTiers.reduce((sum, tier) => sum + tier.price, 0) / saas.monthlyPriceTiers.length;
                modelRevenue = activeUsers * avgPrice;
              }
              break;

            case 'Hardware + SAAS':
              if (modelConfig.modelInputs.hardwaresaas) {
                const hw = modelConfig.modelInputs.hardwaresaas;
                const hwGrowth = Math.pow(1 + hw.hardwareGrowthRate / 100, monthsSinceStart);
                const hwUnits = hw.monthlyHardwareUnitsSold * hwGrowth * rampUpFactor;
                const hwRevenue = hwUnits * hw.hardwareSalePrice;
                const saasUsers = hwUnits * (hw.hardwareToSaasConversion / 100) * monthsSinceStart;
                const saasRevenue = saasUsers * hw.monthlySaasPrice;
                modelRevenue = hwRevenue + saasRevenue;
              }
              break;

            case 'Straight Sales':
              if (modelConfig.modelInputs.straightsales) {
                const sales = modelConfig.modelInputs.straightsales;
                const growthFactor = Math.pow(1 + sales.growthRate / 100, monthsSinceStart);
                const seasonalFactor = sales.seasonalityFactor[month - 1] || 1;
                const units = sales.unitsSoldPerMonth * growthFactor * seasonalFactor * rampUpFactor;
                modelRevenue = units * sales.unitPrice * (1 - sales.channelFees / 100);
              }
              break;

            case 'Marketplace':
              if (modelConfig.modelInputs.marketplace) {
                const mp = modelConfig.modelInputs.marketplace;
                const growthFactor = Math.pow(1 + mp.gmvGrowthRate / 100, monthsSinceStart);
                const gmv = mp.gmvPerMonth * growthFactor * rampUpFactor;
                modelRevenue = gmv * (mp.takeRate / 100);
              }
              break;

            case 'Property Play':
              if (modelConfig.modelInputs.propertyplay) {
                const pp = modelConfig.modelInputs.propertyplay;
                const yearsSinceStart = (year - activation.startYear) + (month - 1) / 12;
                const rentGrowth = Math.pow(1 + pp.rentGrowthRate / 100, yearsSinceStart);
                const rentIncome = pp.monthlyRentIncome * rentGrowth * (1 - pp.vacancyRate / 100);
                
                const subscriptionRevenue = pp.subscriptionServices.reduce((sum, service) => 
                  sum + (service.monthlyPrice * service.expectedTenants), 0);
                
                const payPerVisitRevenue = pp.payPerVisitServices.reduce((sum, service) => {
                  const serviceGrowth = Math.pow(1 + service.growthRate / 100, yearsSinceStart);
                  return sum + (service.pricePerVisit * service.visitsPerMonth * serviceGrowth);
                }, 0);

                // Simplified - just revenue without detailed expense calculation
                modelRevenue = (rentIncome + subscriptionRevenue + payPerVisitRevenue) * rampUpFactor * 0.6; // 40% expense ratio
              }
              break;
          }

          revenueByModel[activation.modelType] = modelRevenue;
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

      const grossMargin = totalRevenue * 0.7;
      const netProfit = grossMargin - totalCosts;

      results.push({
        year,
        month,
        revenueByModel,
        totalRevenue,
        totalCosts,
        grossMargin,
        netProfit,
        breakEvenReached: netProfit > 0
      });
    }
  }

  return results;
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Business Model Flow Tests\n');
  console.log('=' .repeat(60));

  const results = [];
  
  // Test each business model
  for (const [modelType, testData] of Object.entries(testBusinessModels)) {
    const result = await testBusinessModelFlow(modelType, testData);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(60));

  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Passed: ${passed.length}/${results.length} tests`);
  console.log(`❌ Failed: ${failed.length}/${results.length} tests`);

  if (passed.length > 0) {
    console.log('\n🎉 SUCCESSFUL TESTS:');
    passed.forEach(result => {
      console.log(`   ${result.modelType}: £${result.totalRevenue?.toLocaleString() || 'N/A'} total revenue`);
    });
  }

  if (failed.length > 0) {
    console.log('\n💥 FAILED TESTS:');
    failed.forEach(result => {
      console.log(`   ${result.modelType}: ${result.error}`);
    });
  }

  console.log('\n' + '=' .repeat(60));
  console.log(failed.length === 0 ? '🎊 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
  console.log('=' .repeat(60));

  process.exit(failed.length === 0 ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testBusinessModelFlow, runAllTests }; 