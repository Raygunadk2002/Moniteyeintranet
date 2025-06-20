#!/usr/bin/env node

/**
 * Quick API Test - Verify business model endpoints are functional
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testBusinessIdea = {
  name: "API Test Business",
  description: "Testing API endpoints",
  industry: "Technology",
  businessModel: "SAAS"
};

const testAdvancedModel = {
  id: "test-id",
  name: "Test SAAS Model",
  description: "Testing SAAS model",
  sector: "Technology",
  launchYear: 2025,
  modelActivations: [{
    modelType: "SAAS",
    startYear: 2025,
    rampUpMonths: 6
  }],
  modelInputs: {
    saas: {
      monthlyPriceTiers: [
        { name: 'Basic', price: 29.99 },
        { name: 'Pro', price: 99.99 }
      ],
      freeTrialConversionRate: 15,
      monthlyNewUserAcquisition: 100,
      userChurnRate: 5,
      cac: 75,
      growthRatesByYear: [
        { year: 2025, monthlyGrowthRate: 3 }
      ],
      upsellExpansionRevenue: 10
    }
  },
  globalCosts: {
    initialSetupCost: 25000,
    monthlyFixedCosts: 3000,
    teamCostsByYear: [
      { year: 1, totalCost: 120000 }
    ],
    hostingInfrastructure: 500,
    marketingBudget: 2000,
    fulfillmentLogistics: 800,
    taxRate: 0.2,
    paymentProcessingFees: 0.029
  },
  assumptions: {
    inflationRate: 2.5,
    discountRate: 10,
    forecastYears: 5
  }
};

async function testAPI() {
  console.log('🧪 Quick API Test - Business Model Endpoints\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    const healthCheck = await fetch(`${BASE_URL}/api/business-ideas`).catch(() => null);
    
    if (!healthCheck) {
      console.log('❌ Server not responding. Make sure `npm run dev` is running.');
      return;
    }
    console.log('✅ Server is running');

    // Test 2: Try to create business idea with userId
    console.log('\n2️⃣ Testing business idea creation...');
    const createResponse = await fetch(`${BASE_URL}/api/business-ideas?userId=test-user-123`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBusinessIdea)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`⚠️  Business idea creation failed (${createResponse.status}): ${errorText}`);
      console.log('This might be due to authentication or database issues.');
    } else {
      const createdIdea = await createResponse.json();
      console.log(`✅ Business idea created: ${createdIdea.data?.id || 'ID not returned'}`);
      
      // Test 3: Try to save advanced model
      if (createdIdea.data?.id) {
        console.log('\n3️⃣ Testing advanced model save...');
        testAdvancedModel.id = createdIdea.data.id;
        
        const saveResponse = await fetch(`${BASE_URL}/api/business-ideas/${createdIdea.data.id}/advanced-model?userId=test-user-123`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testAdvancedModel)
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.log(`⚠️  Advanced model save failed (${saveResponse.status}): ${errorText}`);
        } else {
          console.log('✅ Advanced model saved successfully');
          
          // Test 4: Try to retrieve advanced model
          console.log('\n4️⃣ Testing advanced model retrieval...');
          const retrieveResponse = await fetch(`${BASE_URL}/api/business-ideas/${createdIdea.data.id}/advanced-model?userId=test-user-123`);
          
          if (!retrieveResponse.ok) {
            console.log(`⚠️  Advanced model retrieval failed (${retrieveResponse.status})`);
          } else {
            const retrievedModel = await retrieveResponse.json();
            console.log('✅ Advanced model retrieved successfully');
            
            // Verify data integrity
            const hasInputs = retrievedModel.modelInputs?.saas?.monthlyPriceTiers?.length > 0;
            console.log(`✅ Data integrity: ${hasInputs ? 'PASSED' : 'FAILED'}`);
          }
        }
      }
    }

    // Test 5: Test market benchmarks endpoint
    console.log('\n5️⃣ Testing market benchmarks...');
    const benchmarkResponse = await fetch(`${BASE_URL}/api/market-benchmarks`);
    
    if (benchmarkResponse.ok) {
      console.log('✅ Market benchmarks endpoint working');
    } else {
      console.log('⚠️  Market benchmarks endpoint failed');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 API Test Summary:');
  console.log('- If all tests pass: ✅ APIs are functional');
  console.log('- If tests fail: Check server logs and database connection');
  console.log('- For full testing: Use the manual test guide');
  console.log('='.repeat(50));
}

// Run if executed directly
if (require.main === module) {
  testAPI().catch(console.error);
}

module.exports = { testAPI }; 