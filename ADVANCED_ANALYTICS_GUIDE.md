# 📊 Advanced Analytics & Sensitivity Analysis Guide

## 🎯 Overview

The Advanced Analytics system provides comprehensive sensitivity analysis, scenario modeling, and market benchmarking for your business models. This powerful suite of tools helps you understand how changes in key parameters affect your projections and compare your model against industry standards.

## ✨ Features

### 🎚️ Sensitivity Analysis
Interactive sliders to adjust key business parameters and see real-time impact on projections:

- **Monthly Growth Rate**: ±50% adjustment range
- **Churn Rate**: ±20% adjustment range  
- **Customer Acquisition Cost (CAC)**: ±30% adjustment range
- **Upfront Costs**: -50% to +100% adjustment range
- **Pricing**: ±40% adjustment range

**Real-time Feedback:**
- Instant calculation updates
- 5-year projection recalculation
- Visual charts showing revenue and cost impact
- Compound growth rate conversions (e.g., 1% monthly = ~12.7% annually)

### 📈 Scenario Comparison
Pre-built scenarios to compare different business strategies:

1. **Base Case**: Your current model parameters (0% adjustments)
2. **Aggressive Growth**: +25% growth, -10% churn, +15% CAC, +50% upfront costs, +20% pricing
3. **Conservative**: -15% growth, +10% churn, -5% CAC, -20% upfront costs, -10% pricing

**Comparison Features:**
- Side-by-side revenue projections
- 5-year total revenue comparison
- Profit analysis across scenarios
- Interactive line charts showing scenario performance

### 💰 CAC vs LTV Analysis
Customer economics analysis with health indicators:

**Key Metrics:**
- Current Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- LTV:CAC Ratio (target: 3:1 or higher)
- Payback Period (target: 12 months or less)

**Health Indicators:**
- ✅ Healthy: LTV:CAC ≥ 3:1 and payback ≤ 12 months
- ⚠️ Needs Improvement: Below healthy thresholds

**Recommendations:**
- Automated suggestions for improving unit economics
- Guidance on CAC optimization
- LTV improvement strategies

### 🎲 Monte Carlo Simulations
Risk modeling through probabilistic analysis:

**Simulation Options:**
- 100, 500, 1,000, or 5,000 simulation runs
- Random parameter variations within realistic ranges
- Normal distribution approximation for key variables

**Results Analysis:**
- Average 5-year revenue and profit projections
- Profitability rate (% of simulations showing profit)
- Risk level assessment (Low/Medium/High)
- Revenue distribution histogram
- Statistical confidence intervals

### 📊 Market Benchmarks
Industry comparison data from leading research sources:

**Business Model Coverage:**
- **SaaS**: General, Enterprise, SMB segments
- **E-commerce**: General retail and online sales
- **Marketplace**: Platform business models
- **Hardware + SaaS**: IoT and connected devices
- **Property/Real Estate**: Property investment models
- **Subscription Products**: Consumer subscriptions

**Benchmark Metrics:**
- Monthly churn rates
- Customer acquisition costs
- Lifetime value ratios
- Growth rates
- Gross and net margins
- Conversion rates

**Your Model vs Industry:**
- Real-time comparison with industry averages
- Performance indicators (✅ above average, ⚠️ below average)
- Percentile rankings
- Improvement recommendations

### 📤 Export & Integration
Multiple export formats for further analysis:

- **CSV Export**: Raw data for spreadsheet analysis
- **PDF Export**: Professional reports (requires jsPDF integration)
- **Google Sheets**: Direct integration (requires Google Sheets API)

## 🚀 How to Use

### 1. Access Advanced Analytics
1. Navigate to Business Ideas
2. Select or create a business model
3. Configure your model parameters in the "Models" tab
4. Click on the "🔍 Analysis" tab
5. The sensitivity analysis will load automatically

### 2. Sensitivity Analysis
1. Use the sliders to adjust parameters
2. Watch real-time updates to projections
3. Note the impact summary showing adjusted values
4. Review the revenue projection chart
5. Click "Reset to Baseline" to return to original values

### 3. Scenario Comparison
1. Switch to the "📈 Scenario Comparison" tab
2. Review the three pre-built scenarios
3. Compare 5-year revenue projections
4. Analyze the scenario comparison chart
5. Add custom scenarios (coming soon)

### 4. CAC vs LTV Analysis
1. Switch to the "💰 CAC vs LTV" tab
2. Review your current unit economics
3. Check the LTV:CAC ratio and payback period
4. Follow the automated recommendations
5. Monitor the ratio trend over time

### 5. Monte Carlo Simulations
1. Switch to the "🎲 Monte Carlo" tab
2. Select the number of simulation runs
3. Click "Run Simulation"
4. Review the statistical results
5. Analyze the revenue distribution chart

### 6. Market Benchmarks
1. Switch to the "📊 Market Benchmarks" tab
2. Review industry benchmark cards
3. Compare your model vs industry averages
4. Check performance indicators
5. Review data sources and methodology

## 📋 Data Sources

Our market benchmarks are compiled from leading industry research:

- **SaaS Capital Survey 2024**: SaaS industry metrics
- **OpenView Partners**: Enterprise SaaS benchmarks  
- **ChartMogul SaaS Metrics**: SMB SaaS data
- **Shopify Commerce Report**: E-commerce benchmarks
- **Marketplace Pulse 2024**: Platform business data
- **IoT Analytics Report**: Hardware + SaaS metrics
- **REIT Industry Report**: Property investment data
- **Subscription Economy Index**: Consumer subscription metrics

## 🎯 Best Practices

### Sensitivity Analysis
- Test extreme scenarios (±50% changes) to understand model resilience
- Focus on parameters with highest impact on profitability
- Use monthly-to-annual growth conversions for sense-checking
- Document assumptions behind parameter ranges

### Scenario Planning
- Always model pessimistic scenarios for risk assessment
- Consider market conditions when setting aggressive targets
- Update scenarios quarterly based on actual performance
- Use scenarios for investor presentations and planning

### Unit Economics
- Target LTV:CAC ratio of 3:1 or higher for sustainable growth
- Aim for CAC payback period of 12 months or less
- Monitor trends over time, not just point-in-time ratios
- Consider cohort-based LTV calculations for accuracy

### Risk Assessment
- Run Monte Carlo simulations before major decisions
- Use profitability rate to assess business viability
- Consider external factors not captured in the model
- Stress-test assumptions with domain experts

## 🔧 Technical Implementation

### Architecture
- **Frontend**: React with TypeScript and Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **API**: Next.js API routes for market benchmarks
- **State Management**: React hooks and local state
- **Data Processing**: Real-time calculations with memoization

### Performance Optimizations
- Memoized calculations for expensive operations
- Debounced slider updates to prevent excessive re-renders
- Lazy loading of market benchmark data
- Efficient chart re-rendering with Chart.js

### Extensibility
- Modular component design for easy feature additions
- Configurable parameter ranges via props
- Pluggable export formats
- API-driven benchmark data for easy updates

## 🛠️ Setup Requirements

### Database
Run the database migration to enable model persistence:

```sql
-- See fix-business-models-constraints.sql for full migration
ALTER TABLE advanced_business_models 
ADD CONSTRAINT advanced_models_business_idea_unique UNIQUE (business_idea_id);

ALTER TABLE revenue_models 
ADD CONSTRAINT revenue_models_business_idea_unique UNIQUE (business_idea_id);
```

### Environment
No additional environment variables required. The system uses:
- Existing Supabase configuration
- Chart.js (already installed)
- React and TypeScript (already configured)

## 🐛 Troubleshooting

### Common Issues

**Sensitivity Analysis Not Loading**
- Ensure a business model is configured and saved
- Check that model parameters are properly set
- Verify the baseline model has required fields

**Charts Not Displaying**
- Confirm Chart.js dependencies are installed
- Check browser console for JavaScript errors
- Ensure data arrays are properly formatted

**Market Benchmarks Empty**
- Check `/api/market-benchmarks` endpoint is accessible
- Verify network connectivity
- Review browser console for API errors

**Export Functions Not Working**
- CSV export works out-of-the-box
- PDF export requires jsPDF library integration
- Google Sheets requires API key configuration

### Performance Issues
- Reduce Monte Carlo simulation runs if browser becomes slow
- Use smaller parameter adjustment ranges for faster calculations
- Close other browser tabs if memory usage is high

## 🔮 Future Enhancements

### Planned Features
- Custom scenario builder with drag-and-drop interface
- Advanced Monte Carlo with correlation matrices
- Machine learning-powered parameter recommendations
- Real-time market data integration via APIs
- Collaborative scenario sharing and commenting
- Advanced export formats (PowerPoint, Notion, etc.)
- Mobile-responsive design improvements

### Integration Opportunities
- CRM integration for actual CAC data
- Analytics platforms for real churn rates
- Financial systems for cost data
- Market research APIs for dynamic benchmarks

## 📞 Support

For questions or issues with the Advanced Analytics system:

1. Check this documentation first
2. Review the troubleshooting section
3. Check the browser console for error messages
4. Test with a simple business model configuration
5. Contact the development team with specific error details

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatibility**: All supported business model types 