# Property Play Business Model

## Overview
The Property Play business model is designed for property investment and rental modeling. It provides comprehensive financial analysis for property investments, including mortgage calculations, multiple income streams, renovation financing, and property appreciation forecasting.

## Key Features

### 🏠 Property Purchase & Financing
- **Property Purchase Price**: Total cost of acquiring the property
- **Down Payment Percentage**: Percentage of purchase price paid upfront
- **Mortgage Interest Rate**: Annual interest rate for the mortgage loan
- **Mortgage Term**: Number of years to repay the mortgage
- **Automatic Mortgage Calculator**: Calculates monthly mortgage payments using standard amortization formula

### 💰 Income Streams

#### Primary Rental Income
- **Monthly Rent Income**: Base monthly rental income
- **Rent Growth Rate**: Annual percentage increase in rental income
- **Vacancy Rate**: Percentage of time property is expected to be vacant

#### Subscription Services
Add recurring revenue streams from services provided to tenants:
- **Service Name**: Description of the service (e.g., "Gym Access", "Parking Space")
- **Monthly Price**: Monthly fee per tenant
- **Expected Tenants**: Number of tenants expected to use the service

#### Pay-Per-Visit Services
Add variable revenue streams from usage-based services:
- **Service Name**: Description of the service (e.g., "Laundry", "Storage Access")
- **Price Per Visit**: Cost per use
- **Visits Per Month**: Expected monthly usage
- **Growth Rate**: Annual growth rate for service usage

### 🔧 Renovation & Improvements
- **Initial Renovation Cost**: Upfront cost for property improvements
- **Renovation Financing Rate**: Interest rate for renovation loan
- **Renovation Spread Years**: Number of years to finance renovation costs
- **Ongoing Maintenance Percentage**: Annual maintenance cost as percentage of property value

### 📊 Operating Expenses
- **Property Tax Percentage**: Annual property tax as percentage of property value
- **Insurance Cost Annual**: Annual insurance premium
- **Property Management Fee**: Percentage of rental income paid to property managers
- **Vacancy Rate**: Accounts for lost income during vacant periods

### 📈 Property Appreciation
- **Property Appreciation Rate**: Annual percentage increase in property value
- **Planned Holding Period**: Expected years before selling the property
- **Selling Costs Percentage**: Transaction costs when selling (agent fees, legal, etc.)

## Financial Calculations

### Monthly Cash Flow Calculation
```
Total Monthly Revenue = Adjusted Rent + Subscription Services + Pay-Per-Visit Services

Where:
- Adjusted Rent = Base Rent × (1 + Growth Rate)^Years × (1 - Vacancy Rate)
- Subscription Revenue = Σ(Service Price × Expected Tenants)
- Pay-Per-Visit Revenue = Σ(Price Per Visit × Monthly Visits × (1 + Growth Rate)^Years)

Total Monthly Expenses = Mortgage Payment + Property Tax + Insurance + 
                        Maintenance + Management Fee + Renovation Payment

Net Monthly Cash Flow = Total Revenue - Total Expenses
```

### Mortgage Payment Formula
```
Monthly Payment = Loan Amount × [r(1+r)^n] / [(1+r)^n - 1]

Where:
- Loan Amount = Purchase Price × (1 - Down Payment %)
- r = Monthly Interest Rate (Annual Rate / 12)
- n = Total Number of Payments (Years × 12)
```

### Property Value Appreciation
```
Current Property Value = Purchase Price × (1 + Appreciation Rate)^Years Since Purchase
```

## Use Cases

### 1. Buy-to-Let Investment
- Standard rental property with monthly rent income
- Factor in vacancy periods and property management costs
- Model long-term appreciation and eventual sale

### 2. Multi-Income Property
- Primary rental income plus additional services
- Subscription services like gym access, parking, storage
- Pay-per-use services like laundry, conference rooms

### 3. Renovation Projects
- Properties requiring significant upfront investment
- Spread renovation costs over multiple years with financing
- Model improved rental income post-renovation

### 4. Commercial Property
- Office buildings with multiple revenue streams
- Meeting room rentals, parking fees, service charges
- Tenant subscription services

## Key Metrics Tracked

### Revenue Metrics
- Monthly rental income (adjusted for growth and vacancy)
- Subscription service revenue
- Pay-per-visit service revenue
- Total monthly revenue

### Expense Metrics
- Monthly mortgage payment
- Property taxes and insurance
- Maintenance and management fees
- Renovation loan payments

### Profitability Metrics
- Net monthly cash flow
- Cash-on-cash return
- Property appreciation (unrealized gains)
- Total return on investment

## Advanced Features

### Growth Modeling
- Rent increases over time with inflation/market growth
- Service usage growth for pay-per-visit offerings
- Property value appreciation

### Financing Options
- Separate financing for renovations with different rates
- Flexible renovation payment periods
- Mortgage amortization calculations

### Risk Factors
- Vacancy rate modeling
- Maintenance cost escalation
- Market appreciation assumptions

## Tips for Accurate Modeling

1. **Research Local Market**: Use realistic rent growth and appreciation rates for your area
2. **Conservative Vacancy Rates**: Factor in 5-10% vacancy depending on market conditions
3. **Maintenance Reserves**: Budget 1-2% of property value annually for maintenance
4. **Professional Management**: If using property management, factor in 5-10% of rental income
5. **Exit Strategy**: Consider holding period and selling costs for total return calculation

## Integration with Business Ideas

The Property Play model integrates seamlessly with the Advanced Business Modeling Engine:
- Combines with other business models for diversified portfolios
- Multi-year forecasting with different activation periods
- Comprehensive cost structure analysis
- Visual charts and analytics for decision making

This model is perfect for real estate investors, property developers, and anyone looking to analyze the financial viability of property investments with multiple income streams. 