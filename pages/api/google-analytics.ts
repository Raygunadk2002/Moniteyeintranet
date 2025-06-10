import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface GoogleAnalyticsData {
  visitorsLast30Days: number;
  visitorsLast30DaysChange: number;
  visitorsLast3Months: number;
  visitorsLast3MonthsChange: number;
  visitorsToday: number;
  visitorsYesterday: number;
  pageViews30Days: number;
  bounceRate: number;
  avgSessionDuration: number;
  dailyVisitors: number[]; // Array of 30 daily visitor counts
  monthlyVisitors: number[]; // Array of 6 monthly visitor counts
  insights: {
    topPage: {
      path: string;
      views: number;
    };
    mobilePercentage: number;
    topCountry: {
      name: string;
      percentage: number;
    };
    trafficSources: Array<{
      source: string;
      percentage: number;
    }>;
    deviceTypes: Array<{
      category: string;
      percentage: number;
    }>;
  };
}

// Mock Google Analytics data - replace with actual Google Analytics API integration
const getMockAnalyticsData = (): GoogleAnalyticsData => {
  const now = new Date();
  const baseVisitors = 10000;
  const randomVariation = () => (Math.random() - 0.5) * 0.3; // ±15% variation
  
  // Generate realistic daily visitor data for past 30 days
  const dailyVisitors = Array.from({ length: 30 }, (_, i) => {
    const dayIndex = 29 - i; // Start from 30 days ago
    const isWeekend = (dayIndex % 7 === 0 || dayIndex % 7 === 6);
    const baseDaily = isWeekend ? 250 : 350; // Lower on weekends
    const variation = Math.random() * 200 - 100; // ±100 visitors
    return Math.max(50, Math.floor(baseDaily + variation)); // Minimum 50 visitors
  });
  
  return {
    visitorsLast30Days: Math.floor(baseVisitors * (1 + randomVariation())),
    visitorsLast30DaysChange: Number((randomVariation() * 50).toFixed(1)), // ±25% change
    visitorsLast3Months: Math.floor(baseVisitors * 3.2 * (1 + randomVariation())),
    visitorsLast3MonthsChange: Number((randomVariation() * 60).toFixed(1)), // ±30% change
    visitorsToday: Math.floor(300 + Math.random() * 200), // 300-500 visitors today
    visitorsYesterday: Math.floor(280 + Math.random() * 180), // 280-460 visitors yesterday
    pageViews30Days: Math.floor(baseVisitors * 4.2 * (1 + randomVariation())),
    bounceRate: Number((35 + Math.random() * 25).toFixed(1)), // 35-60% bounce rate
    avgSessionDuration: Math.floor(120 + Math.random() * 180), // 2-5 minutes
    dailyVisitors,
    monthlyVisitors: Array.from({ length: 6 }, () => Math.floor(baseVisitors * (1 + randomVariation()))),
    insights: {
      topPage: {
        path: '/environmental-monitoring',
        views: 2847
      },
      mobilePercentage: 68,
      topCountry: {
        name: 'United Kingdom',
        percentage: 82
      },
      trafficSources: [
        { source: 'Organic Search', percentage: 45 },
        { source: 'Direct', percentage: 30 },
        { source: 'Social', percentage: 15 },
        { source: 'Referral', percentage: 7 },
        { source: 'Email', percentage: 3 }
      ],
      deviceTypes: [
        { category: 'mobile', percentage: 68 },
        { category: 'desktop', percentage: 28 },
        { category: 'tablet', percentage: 4 }
      ]
    }
  };
};

// Real Google Analytics Data API integration
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
});

const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

const getRealAnalyticsData = async (): Promise<GoogleAnalyticsData> => {
  try {
    // Get daily visitors for last 30 days
    const [responseDailyVisitors] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // Get monthly visitors for last 6 months
    const [responseMonthlyVisitors] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '180daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [{ name: 'yearMonth' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
    });

    // Get daily bounce rate for last 30 days (for proper averaging)
    const [responseDailyBounceRate] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'bounceRate' },
        { name: 'sessions' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // Get visitors for last 30 days
    const [response30Days] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' }
      ],
    });

    // Get visitors for previous 30 days (31-60 days ago) for comparison
    const [responsePrevious30Days] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '60daysAgo',
          endDate: '31daysAgo',
        },
      ],
      metrics: [{ name: 'activeUsers' }],
    });

    // Get visitors for last 3 months
    const [response3Months] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '90daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [{ name: 'activeUsers' }],
    });

    // Get visitors for previous 3 months for comparison
    const [responsePrevious3Months] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '180daysAgo',
          endDate: '91daysAgo',
        },
      ],
      metrics: [{ name: 'activeUsers' }],
    });

    // Get today's visitors
    const [responseToday] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: 'today',
          endDate: 'today',
        },
      ],
      metrics: [{ name: 'activeUsers' }],
    });

    // Get yesterday's visitors
    const [responseYesterday] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: 'yesterday',
          endDate: 'yesterday',
        },
      ],
      metrics: [{ name: 'activeUsers' }],
    });

    // Extract daily visitor data
    const dailyVisitors = responseDailyVisitors.rows?.map(row => {
      return parseInt(row.metricValues?.[0]?.value || '0');
    }) || [];

    // Fill missing days with 0 if needed (ensure we have 30 days)
    while (dailyVisitors.length < 30) {
      dailyVisitors.unshift(0);
    }

    // Extract monthly visitor data
    const monthlyVisitors = responseMonthlyVisitors.rows?.map(row => {
      return parseInt(row.metricValues?.[0]?.value || '0');
    }) || [];

    // Fill missing months with 0 if needed (ensure we have 6 months)
    while (monthlyVisitors.length < 6) {
      monthlyVisitors.unshift(0);
    }

    // Fetch insights data
    // Top pages
    const [responseTopPages] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 1,
    });

    // Device category
    const [responseDeviceCategory] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    });

    // Country data
    const [responseCountry] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 1,
    });

    // Traffic sources
    const [responseTrafficSources] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });

    // Process insights data
    const topPage = responseTopPages.rows?.[0] ? {
      path: responseTopPages.rows[0].dimensionValues?.[0]?.value || '/',
      views: parseInt(responseTopPages.rows[0].metricValues?.[0]?.value || '0')
    } : { path: '/', views: 0 };

    // Calculate device percentages
    const totalDeviceUsers = responseDeviceCategory.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0');
    }, 0) || 1;

    const mobileUsers = responseDeviceCategory.rows?.find(row => 
      row.dimensionValues?.[0]?.value === 'mobile'
    );
    const mobilePercentage = mobileUsers ? 
      Math.round((parseInt(mobileUsers.metricValues?.[0]?.value || '0') / totalDeviceUsers) * 100) : 0;

    const deviceTypes = responseDeviceCategory.rows?.map(row => ({
      category: row.dimensionValues?.[0]?.value || 'Unknown',
      percentage: Math.round((parseInt(row.metricValues?.[0]?.value || '0') / totalDeviceUsers) * 100)
    })) || [];

    // Process country data
    const totalCountryUsers = responseCountry.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0');
    }, 0) || 1;

    const topCountry = responseCountry.rows?.[0] ? {
      name: responseCountry.rows[0].dimensionValues?.[0]?.value || 'Unknown',
      percentage: Math.round((parseInt(responseCountry.rows[0].metricValues?.[0]?.value || '0') / totalCountryUsers) * 100)
    } : { name: 'Unknown', percentage: 0 };

    // Process traffic sources
    const totalSessions = responseTrafficSources.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0');
    }, 0) || 1;

    const trafficSources = responseTrafficSources.rows?.slice(0, 5).map(row => ({
      source: row.dimensionValues?.[0]?.value || 'Unknown',
      percentage: Math.round((parseInt(row.metricValues?.[0]?.value || '0') / totalSessions) * 100)
    })) || [];

    // Calculate 30-day average bounce rate properly
    let totalBounceRate = 0;
    let validDays = 0;

    responseDailyBounceRate.rows?.forEach(row => {
      const dailyBounceRate = parseFloat(row.metricValues?.[0]?.value || '0');
      const dailySessions = parseInt(row.metricValues?.[1]?.value || '0');
      
      if (dailySessions > 0) {
        totalBounceRate += dailyBounceRate * dailySessions; // Weight by sessions
        validDays++;
      }
    });

    // Calculate weighted average bounce rate as percentage
    const bounceRate = validDays > 0 ? (totalBounceRate / validDays) * 100 : 0;

    // Extract data from responses
    const visitorsLast30Days = parseInt(response30Days.rows?.[0]?.metricValues?.[0]?.value || '0');
    const visitorsPrevious30Days = parseInt(responsePrevious30Days.rows?.[0]?.metricValues?.[0]?.value || '0');
    const visitorsLast3Months = parseInt(response3Months.rows?.[0]?.metricValues?.[0]?.value || '0');
    const visitorsPrevious3Months = parseInt(responsePrevious3Months.rows?.[0]?.metricValues?.[0]?.value || '0');
    const visitorsToday = parseInt(responseToday.rows?.[0]?.metricValues?.[0]?.value || '0');
    const visitorsYesterday = parseInt(responseYesterday.rows?.[0]?.metricValues?.[0]?.value || '0');
    const pageViews30Days = parseInt(response30Days.rows?.[0]?.metricValues?.[1]?.value || '0');
    const avgSessionDuration = parseInt(response30Days.rows?.[0]?.metricValues?.[2]?.value || '0');

    // Calculate percentage changes
    const visitorsLast30DaysChange = visitorsPrevious30Days > 0 
      ? ((visitorsLast30Days - visitorsPrevious30Days) / visitorsPrevious30Days) * 100 
      : 0;
    
    const visitorsLast3MonthsChange = visitorsPrevious3Months > 0 
      ? ((visitorsLast3Months - visitorsPrevious3Months) / visitorsPrevious3Months) * 100 
      : 0;

    return {
      visitorsLast30Days,
      visitorsLast30DaysChange: Number(visitorsLast30DaysChange.toFixed(1)),
      visitorsLast3Months,
      visitorsLast3MonthsChange: Number(visitorsLast3MonthsChange.toFixed(1)),
      visitorsToday,
      visitorsYesterday,
      pageViews30Days,
      bounceRate: Number(bounceRate.toFixed(1)), // Properly formatted bounce rate as percentage
      avgSessionDuration,
      dailyVisitors: dailyVisitors.slice(-30), // Ensure exactly 30 days
      monthlyVisitors: monthlyVisitors.slice(-6), // Ensure exactly 6 months
      insights: {
        topPage,
        mobilePercentage,
        topCountry,
        trafficSources,
        deviceTypes
      }
    };
  } catch (error) {
    console.error('Error fetching Google Analytics data:', error);
    throw error;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔄 Google Analytics API: Starting data fetch...');
    
    // Check if Google Analytics is configured
    const isGoogleAnalyticsConfigured = 
      process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL && 
      process.env.GOOGLE_ANALYTICS_PRIVATE_KEY && 
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

    let analyticsData: GoogleAnalyticsData;

    if (isGoogleAnalyticsConfigured) {
      console.log('✅ Google Analytics configured, fetching real data...');
      analyticsData = await getRealAnalyticsData();
    } else {
      console.log('⚠️ Google Analytics not configured, using mock data...');
      analyticsData = getMockAnalyticsData();
    }

    console.log('📊 Google Analytics data:', {
      visitorsLast30Days: analyticsData.visitorsLast30Days,
      visitorsToday: analyticsData.visitorsToday,
      change30Days: `${analyticsData.visitorsLast30DaysChange}%`,
      change3Months: `${analyticsData.visitorsLast3MonthsChange}%`
    });

    res.status(200).json({
      ...analyticsData,
      note: isGoogleAnalyticsConfigured 
        ? 'Live Google Analytics data' 
        : 'Mock data - configure Google Analytics environment variables for live data',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Google Analytics API error:', error);
    
    // Return fallback data on error
    const fallbackData = getMockAnalyticsData();
    res.status(200).json({
      ...fallbackData,
      note: 'Fallback data due to API error',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastUpdated: new Date().toISOString()
    });
  }
} 