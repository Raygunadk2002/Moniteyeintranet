# Manual Business Model Flow Test Guide

This guide will help you manually test that all business models correctly flow from initial inputs to forecast outputs.

## Pre-Test Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open browser to:** http://localhost:3000/business-ideas

3. **Login if required** (use your authentication method)

## Test Cases

### 1. SAAS Model Test

**Step 1: Create Business Idea**
- Click "Add New Business Idea"
- Title: "Test SAAS Business"
- Description: "Testing SAAS model flow from inputs to outputs"
- Industry: "Technology"
- Business Model: "SAAS"
- Click "Save"

**Step 2: Configure SAAS Model**
- Click "Advanced Modeling" on your new business idea
- Select "SAAS" model
- Configure inputs:
  - **Monthly Pricing Tiers:**
    - Basic: £29.99
    - Pro: £99.99
  - **Free Trial Conversion Rate:** 15%
  - **Monthly New User Acquisition:** 100 users
  - **User Churn Rate:** 5%
  - **Customer Acquisition Cost:** £75
  - **Upsell/Expansion Revenue:** 10%
  - **Growth Rates by Year:**
    - 2025: 3% monthly
    - 2026: 4% monthly
    - 2027: 2% monthly

**Step 3: Configure Global Costs**
- Click "Costs" tab
- **Initial Setup Cost:** £25,000
- **Monthly Fixed Costs:** £3,000
- **Hosting & Infrastructure:** £500
- **Marketing Budget:** £2,000
- **Team Costs by Year:**
  - Year 1: £120,000
  - Year 2: £180,000
  - Year 3: £250,000

**Step 4: Verify Forecast Output**
- Click "Forecast" tab
- **Expected Results:**
  - Total Revenue should be > £0
  - Average Monthly Revenue should increase over time
  - Break-even point should be reached within 24 months
  - SAAS revenue should be the primary contributor

**Step 5: Verify Analysis**
- Click "Analysis" tab
- **Check:**
  - Key Business Metrics show realistic values
  - Model Performance shows SAAS as 100% of total
  - Charts display revenue growth over time
  - Sensitivity analysis is functional

---

### 2. Hardware + SAAS Model Test

**Step 1: Create Business Idea**
- Title: "Test Hardware + SAAS Business"
- Description: "Testing Hardware + SAAS model flow"
- Industry: "Technology"
- Business Model: "Hardware + SAAS"

**Step 2: Configure Hardware + SAAS Model**
- Select "Hardware + SAAS" model
- Configure inputs:
  - **Hardware Unit Cost:** £150
  - **Hardware Sale Price:** £199
  - **Monthly Hardware Units Sold:** 50
  - **Hardware Growth Rate:** 3%
  - **Hardware to SAAS Conversion:** 80%
  - **Monthly SAAS Price:** £19.99
  - **Hardware Margin:** 25%
  - **Support Costs:** £500

**Step 3: Verify Forecast Output**
- **Expected Results:**
  - Both hardware and SAAS revenue streams visible
  - SAAS revenue should grow over time as hardware converts
  - Total revenue combines both streams
  - Break-even achieved through combined model

---

### 3. Straight Sales Model Test

**Step 1: Create Business Idea**
- Title: "Test Straight Sales Business"
- Description: "Testing Straight Sales model flow"
- Industry: "Retail"
- Business Model: "E-commerce"

**Step 2: Configure Straight Sales Model**
- Select "Straight Sales" model
- Configure inputs:
  - **Unit Price:** £99.99
  - **Cost of Goods Sold:** £45
  - **Units Sold Per Month:** 200
  - **Growth Rate:** 3%
  - **Channel Fees:** 5%
  - **Seasonality Factor:** [1, 1, 1.2, 1.1, 1, 0.9, 0.8, 0.8, 1, 1.1, 1.3, 1.4]

**Step 3: Verify Forecast Output**
- **Expected Results:**
  - Revenue shows seasonal variations
  - Growth rate applied month-over-month
  - Channel fees properly deducted
  - Clear profit margins visible

---

### 4. Marketplace Model Test

**Step 1: Create Business Idea**
- Title: "Test Marketplace Business"
- Description: "Testing Marketplace model flow"
- Industry: "Technology"
- Business Model: "Marketplace"

**Step 2: Configure Marketplace Model**
- Select "Marketplace" model
- Configure inputs:
  - **GMV Per Month:** £50,000
  - **Take Rate:** 8%
  - **GMV Growth Rate:** 5%
  - **Support Costs Percent:** 2%

**Step 3: Verify Forecast Output**
- **Expected Results:**
  - Revenue = GMV × Take Rate
  - GMV grows at specified rate
  - Support costs properly deducted
  - Scalable revenue model visible

---

### 5. Property Play Model Test

**Step 1: Create Business Idea**
- Title: "Test Property Play Business"
- Description: "Testing Property Play model flow"
- Industry: "Real Estate"
- Business Model: "Property Investment"

**Step 2: Configure Property Play Model**
- Select "Property Play" model
- Configure inputs:
  - **Property Purchase Price:** £500,000
  - **Down Payment Percentage:** 25%
  - **Mortgage Interest Rate:** 4.5%
  - **Mortgage Term:** 25 years
  - **Monthly Rent Income:** £3,500
  - **Rent Growth Rate:** 3%
  - **Subscription Services:**
    - Smart Home Package: £50/month, 2 tenants
    - Cleaning Service: £80/month, 1 tenant
  - **Pay-per-Visit Services:**
    - Maintenance Calls: £120/visit, 3 visits/month, 2% growth
  - **Property Tax:** 1.2%
  - **Insurance:** £2,400/year
  - **Vacancy Rate:** 5%

**Step 3: Verify Forecast Output**
- **Expected Results:**
  - Multiple revenue streams combined
  - Mortgage payments properly deducted
  - Operating expenses calculated
  - Net cash flow realistic
  - Property appreciation considered

---

## Comprehensive Flow Verification Checklist

For each model, verify:

### ✅ Input Preservation
- [ ] All input values are saved correctly
- [ ] Values persist after page refresh
- [ ] No data loss during navigation

### ✅ Calculation Accuracy
- [ ] Revenue calculations use correct formulas
- [ ] Growth rates applied properly
- [ ] Costs deducted appropriately
- [ ] Net profit = Revenue - Costs

### ✅ Output Display
- [ ] Forecast tab shows summary metrics
- [ ] Revenue by model table displays correct values
- [ ] Charts render with actual data
- [ ] Analysis tab shows key metrics

### ✅ Data Flow Integrity
- [ ] Input changes immediately update forecasts
- [ ] All tabs reflect the same underlying data
- [ ] Save/load functionality works correctly
- [ ] Multiple models can be combined

### ✅ Edge Cases
- [ ] Zero values handled gracefully
- [ ] Large numbers display properly
- [ ] Negative scenarios don't break calculations
- [ ] Growth rates don't cause infinite loops

## Expected Results Summary

| Model Type | Key Success Indicators |
|------------|------------------------|
| SAAS | Monthly recurring revenue growth, churn impact visible, pricing tiers reflected |
| Hardware + SAAS | Dual revenue streams, conversion rates applied, hardware sales drive SAAS |
| Straight Sales | Seasonal patterns visible, unit economics clear, growth trajectory consistent |
| Marketplace | GMV and take rate relationship clear, scalable model demonstrated |
| Property Play | Multiple income streams, expense calculations accurate, cash flow realistic |

## Troubleshooting

If any test fails:

1. **Check Browser Console** for JavaScript errors
2. **Verify API Responses** in Network tab
3. **Confirm Database** persistence via direct queries
4. **Test Individual Components** in isolation
5. **Review Calculation Logic** in AdvancedBusinessModelingEngine.tsx

## Test Completion

✅ **All Models Tested Successfully**
- [ ] SAAS Model
- [ ] Hardware + SAAS Model  
- [ ] Straight Sales Model
- [ ] Marketplace Model
- [ ] Property Play Model

✅ **Data Flow Verified**
- [ ] Inputs → Calculations → Outputs
- [ ] Persistence → Retrieval → Display
- [ ] User Interface → API → Database

✅ **Business Logic Validated**
- [ ] Revenue calculations accurate
- [ ] Cost structures applied correctly
- [ ] Growth rates functioning properly
- [ ] Break-even analysis working
- [ ] Multi-model combinations supported

---

*This manual test ensures comprehensive verification of the business modeling system end-to-end.* 