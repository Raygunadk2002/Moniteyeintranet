import type { NextApiRequest, NextApiResponse } from 'next';

// Market benchmark data for different business models and industries
interface MarketBenchmark {
  industry: string;
  businessModel: string;
  metrics: {
    // SaaS Metrics
    monthlyChurnRate?: number; // %
    cac?: number; // $
    ltv?: number; // $
    ltvCacRatio?: number;
    monthlyGrowthRate?: number; // %
    
    // General Business Metrics
    grossMargin?: number; // %
    netMargin?: number; // %
    customerAcquisitionCost?: number; // $
    averageRevenuePerUser?: number; // $
    
    // Industry-specific
    conversionRate?: number; // %
    averageDealSize?: number; // $
    salesCycleLength?: number; // days
    
    // Ranges for sensitivity analysis
    ranges?: {
      growthRateMin: number;
      growthRateMax: number;
      churnRateMin: number;
      churnRateMax: number;
      cacMin: number;
      cacMax: number;
    };
  };
  source: string;
  lastUpdated: string;
}

const marketBenchmarks: MarketBenchmark[] = [
  // SaaS Benchmarks
  {
    industry: 'SaaS - General',
    businessModel: 'SAAS',
    metrics: {
      monthlyChurnRate: 5.2, // Annual: ~50%
      cac: 205,
      ltv: 1230,
      ltvCacRatio: 6.0,
      monthlyGrowthRate: 2.3,
      grossMargin: 78,
      netMargin: 12,
      averageRevenuePerUser: 58,
      conversionRate: 15.3,
      ranges: {
        growthRateMin: 0.5,
        growthRateMax: 8.0,
        churnRateMin: 2.0,
        churnRateMax: 12.0,
        cacMin: 50,
        cacMax: 500
      }
    },
    source: 'SaaS Capital Survey 2024',
    lastUpdated: '2024-12-01'
  },
  {
    industry: 'SaaS - Enterprise',
    businessModel: 'SAAS',
    metrics: {
      monthlyChurnRate: 2.8,
      cac: 1420,
      ltv: 8950,
      ltvCacRatio: 6.3,
      monthlyGrowthRate: 1.8,
      grossMargin: 85,
      netMargin: 18,
      averageRevenuePerUser: 312,
      conversionRate: 8.2,
      salesCycleLength: 89,
      ranges: {
        growthRateMin: 0.8,
        growthRateMax: 4.0,
        churnRateMin: 1.0,
        churnRateMax: 6.0,
        cacMin: 500,
        cacMax: 3000
      }
    },
    source: 'OpenView Partners',
    lastUpdated: '2024-11-15'
  },
  {
    industry: 'SaaS - SMB',
    businessModel: 'SAAS',
    metrics: {
      monthlyChurnRate: 8.1,
      cac: 89,
      ltv: 445,
      ltvCacRatio: 5.0,
      monthlyGrowthRate: 3.2,
      grossMargin: 72,
      netMargin: 8,
      averageRevenuePerUser: 28,
      conversionRate: 22.1,
      ranges: {
        growthRateMin: 1.0,
        growthRateMax: 12.0,
        churnRateMin: 4.0,
        churnRateMax: 15.0,
        cacMin: 25,
        cacMax: 200
      }
    },
    source: 'ChartMogul SaaS Metrics',
    lastUpdated: '2024-11-20'
  },
  
  // E-commerce Benchmarks
  {
    industry: 'E-commerce - General',
    businessModel: 'Straight Sales',
    metrics: {
      grossMargin: 42,
      netMargin: 6.5,
      customerAcquisitionCost: 87,
      averageRevenuePerUser: 165,
      conversionRate: 2.8,
      monthlyChurnRate: 25.0, // High due to one-time purchases
      ranges: {
        growthRateMin: 1.5,
        growthRateMax: 8.0,
        churnRateMin: 15.0,
        churnRateMax: 40.0,
        cacMin: 30,
        cacMax: 200
      }
    },
    source: 'Shopify Commerce Report',
    lastUpdated: '2024-10-30'
  },
  
  // Marketplace Benchmarks
  {
    industry: 'Marketplace - General',
    businessModel: 'Marketplace',
    metrics: {
      grossMargin: 85, // High since it's mostly fees
      netMargin: 15,
      customerAcquisitionCost: 45,
      averageRevenuePerUser: 23, // Lower per user but higher volume
      conversionRate: 12.5,
      monthlyGrowthRate: 4.2,
      ranges: {
        growthRateMin: 2.0,
        growthRateMax: 15.0,
        churnRateMin: 8.0,
        churnRateMax: 25.0,
        cacMin: 20,
        cacMax: 120
      }
    },
    source: 'Marketplace Pulse 2024',
    lastUpdated: '2024-11-10'
  },
  
  // Hardware + SaaS
  {
    industry: 'Hardware + SaaS',
    businessModel: 'Hardware + SAAS',
    metrics: {
      grossMargin: 45, // Lower due to hardware costs
      netMargin: 8,
      customerAcquisitionCost: 340,
      averageRevenuePerUser: 89,
      monthlyChurnRate: 3.2, // Lower churn due to hardware investment
      monthlyGrowthRate: 2.8,
      ranges: {
        growthRateMin: 1.0,
        growthRateMax: 6.0,
        churnRateMin: 1.5,
        churnRateMax: 8.0,
        cacMin: 150,
        cacMax: 800
      }
    },
    source: 'IoT Analytics Report',
    lastUpdated: '2024-11-05'
  },
  
  // Property/Real Estate
  {
    industry: 'Property/Real Estate',
    businessModel: 'Property Play',
    metrics: {
      grossMargin: 65,
      netMargin: 25,
      averageRevenuePerUser: 1250, // Monthly rent
      monthlyGrowthRate: 0.5, // Property appreciation
      ranges: {
        growthRateMin: 0.1,
        growthRateMax: 2.0,
        churnRateMin: 5.0,
        churnRateMax: 20.0,
        cacMin: 200,
        cacMax: 2000
      }
    },
    source: 'REIT Industry Report',
    lastUpdated: '2024-10-15'
  },
  
  // Subscription Products
  {
    industry: 'Subscription - Consumer',
    businessModel: 'Subscription Product',
    metrics: {
      monthlyChurnRate: 6.8,
      cac: 32,
      ltv: 180,
      ltvCacRatio: 5.6,
      monthlyGrowthRate: 4.1,
      grossMargin: 68,
      netMargin: 12,
      averageRevenuePerUser: 19,
      conversionRate: 18.7,
      ranges: {
        growthRateMin: 2.0,
        growthRateMax: 10.0,
        churnRateMin: 3.0,
        churnRateMax: 15.0,
        cacMin: 15,
        cacMax: 80
      }
    },
    source: 'Subscription Economy Index',
    lastUpdated: '2024-11-25'
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { industry, businessModel } = req.query;

  try {
    let filteredBenchmarks = marketBenchmarks;

    // Filter by industry if specified
    if (industry && typeof industry === 'string') {
      filteredBenchmarks = filteredBenchmarks.filter(
        benchmark => benchmark.industry.toLowerCase().includes(industry.toLowerCase())
      );
    }

    // Filter by business model if specified
    if (businessModel && typeof businessModel === 'string') {
      filteredBenchmarks = filteredBenchmarks.filter(
        benchmark => benchmark.businessModel.toLowerCase() === businessModel.toLowerCase()
      );
    }

    // If no specific filters, return summary statistics
    if (!industry && !businessModel) {
      const summary = {
        totalBenchmarks: marketBenchmarks.length,
        industries: Array.from(new Set(marketBenchmarks.map(b => b.industry))),
        businessModels: Array.from(new Set(marketBenchmarks.map(b => b.businessModel))),
        averageMetrics: {
          cac: calculateAverage(marketBenchmarks, 'cac'),
          ltv: calculateAverage(marketBenchmarks, 'ltv'),
          ltvCacRatio: calculateAverage(marketBenchmarks, 'ltvCacRatio'),
          monthlyChurnRate: calculateAverage(marketBenchmarks, 'monthlyChurnRate'),
          monthlyGrowthRate: calculateAverage(marketBenchmarks, 'monthlyGrowthRate'),
          grossMargin: calculateAverage(marketBenchmarks, 'grossMargin'),
          netMargin: calculateAverage(marketBenchmarks, 'netMargin')
        }
      };
      
      return res.status(200).json({
        summary,
        benchmarks: marketBenchmarks
      });
    }

    return res.status(200).json({
      benchmarks: filteredBenchmarks,
      count: filteredBenchmarks.length
    });

  } catch (error) {
    console.error('Error fetching market benchmarks:', error);
    return res.status(500).json({ error: 'Failed to fetch market benchmarks' });
  }
}

// Helper function to calculate average of a metric across benchmarks
function calculateAverage(benchmarks: MarketBenchmark[], metric: keyof MarketBenchmark['metrics']): number | null {
  const values = benchmarks
    .map(b => b.metrics[metric])
    .filter((value): value is number => typeof value === 'number');
  
  if (values.length === 0) return null;
  
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
} 