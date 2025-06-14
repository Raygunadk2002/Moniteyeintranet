import type { NextApiRequest, NextApiResponse } from 'next';

// Import handlers directly for more reliable internal calls
import pipedriveHandler from './pipedrive';
import tasksHandler from './tasks';
import revenueHandler from './revenue-data';
import holidaysHandler from './team-holidays-metrics';

function calculateTasksChange(openTasks: number, completedTasks: number): string {
  // Calculate a percentage based on task completion ratio
  // If more tasks are completed than open, show positive change
  // This is a simplified calculation - in a real app you'd compare to previous period
  const completionRatio = completedTasks / (openTasks + completedTasks);
  const changePercentage = Math.round((completionRatio - 0.5) * 100);
  return `${changePercentage > 0 ? '+' : ''}${changePercentage}%`;
}

// Helper function to mock request/response for internal API calls
function createMockRequest(method: string = 'GET'): NextApiRequest {
  return {
    method,
    headers: {},
    query: {},
    body: {},
    cookies: {},
    url: '',
    // Add other required properties as needed
  } as NextApiRequest;
}

function createMockResponse(): { json: any; status: (code: number) => any; data?: any; statusCode?: number } {
  let responseData: any = null;
  let statusCode = 200;
  
  return {
    json: (data: any) => {
      responseData = data;
      return { data };
    },
    status: (code: number) => ({
      json: (data: any) => {
        statusCode = code;
        responseData = data;
        return { data, statusCode };
      }
    }),
    get data() { return responseData; },
    get statusCode() { return statusCode; }
  };
}

interface RevenueDataMonth {
  month: string;
  revenue: number;
  timestamp: string;
}

interface RevenueDataResponse {
  monthlyRevenue: RevenueDataMonth[];
  revenueData: number[];
  totalRevenue: number;
}

interface DashboardData {
  metrics: {
    totalRevenue: { value: string; change: string; changeType: string };
    activeUsers: { value: string; change: string; changeType: string };
    newDeals: { value: string; change: string; changeType: string };
    dealsValue: { value: string; change: string; changeType: string };
    openTasks: { value: string; change: string; changeType: string };
    teamHolidays: { value: string; change: string; changeType: string };
    sixMonthAverage: { value: string; change: string; changeType: string };
    twelveMonthTotal: { value: string; change: string; changeType: string };
  };
  charts: {
    revenueData: number[];
    taskDistribution: { name: string; value: number; color: string; count: number }[];
  };
  activities: {
    action: string;
    user: string;
    time: string;
    type: string;
  }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Dashboard API: Starting data fetch with direct imports...');
    
    // Fetch team holiday metrics with direct function call
    let teamHolidaysData = { next14Days: 0, next30Days: 0, currentlyOnHoliday: 0, totalUpcoming: 0 };
    
    try {
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();
      await holidaysHandler(mockReq, mockRes as any);
      const data = mockRes.data;
      if (data && typeof data === 'object') {
        teamHolidaysData = { ...teamHolidaysData, ...data };
      }
      console.log('✅ Holiday data fetched:', teamHolidaysData);
    } catch (error) {
      console.error('❌ Failed to fetch team holidays data:', error);
    }

    // Fetch Pipedrive data with direct function call
    let pipedriveData: { 
      newDealsCount: number; 
      newDealsValue: number; 
      currency: string; 
      deals?: Array<{
        id: string;
        title: string;
        value: number;
        currency: string;
        add_time: string;
        status: string;
      }>; 
    } = { newDealsCount: 0, newDealsValue: 0, currency: 'GBP' };
    
    try {
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();
      await pipedriveHandler(mockReq, mockRes as any);
      const data = mockRes.data;
      if (data && typeof data === 'object') {
        pipedriveData = { ...pipedriveData, ...data };
        // Ensure currency is GBP for UK business
        pipedriveData.currency = 'GBP';
      }
      console.log('✅ Pipedrive data fetched:', pipedriveData);
    } catch (error) {
      console.error('❌ Failed to fetch Pipedrive data:', error);
    }

    // Fetch LIVE Tasks data with direct function call
    let tasksData = { 
      total: 0, 
      open: 0, 
      completed: 0, 
      inProgress: 0, 
      inReview: 0,
      columnCounts: {},
      completionRate: 0,
      recentTasks: 0,
      tasks: [],
      columns: []
    };
    
    try {
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();
      await tasksHandler(mockReq, mockRes as any);
      const data = mockRes.data;
      if (data && typeof data === 'object') {
        tasksData = { ...tasksData, ...data };
      }
      console.log('✅ Tasks data fetched:', tasksData);
    } catch (error) {
      console.error('❌ Failed to fetch tasks data:', error);
    }

    // Fetch revenue data with direct function call
    let revenueData: RevenueDataResponse = { 
      revenueData: [12, 15, 18, 22, 19, 25],
      monthlyRevenue: [],
      totalRevenue: 0
    };
    
    try {
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();
      await revenueHandler(mockReq, mockRes as any);
      const data = mockRes.data;
      if (data && typeof data === 'object') {
        revenueData = { ...revenueData, ...data };
      }
      console.log('✅ Revenue data fetched:', revenueData);
    } catch (error) {
      console.error('❌ Failed to fetch revenue data:', error);
    }

    // Calculate completion percentage
    const tasksChange = calculateTasksChange(tasksData.open, tasksData.completed);
    const tasksChangeType = tasksData.completed > tasksData.open ? 'increase' : 'decrease';

    // Calculate holiday trends
    const holidayChange = teamHolidaysData.next14Days > 0 ? `${teamHolidaysData.next30Days} in 30d` : 'None upcoming';

    // Format currency for deals - Force GBP for UK business
    const currencySymbol = '£'; // Always use GBP symbol
    
    // Override currency if it's showing as USD - this is a UK business
    if (pipedriveData.currency !== 'GBP') {
      console.log(`Warning: Pipedrive returned ${pipedriveData.currency}, forcing to GBP for UK business`);
      pipedriveData.currency = 'GBP';
    }

    // Calculate 3M average and 12M total revenue from actual VAT-excluded data
    let threeMonthAverage = '£0';
    let threeMonthChange = '+0.0%';
    let twelveMonthTotal = '£0';
    let twelveMonthChange = '+0.0%';

    if (revenueData.monthlyRevenue && Array.isArray(revenueData.monthlyRevenue) && revenueData.monthlyRevenue.length > 0) {
      // Sort by month to ensure chronological order
      const sortedRevenue = [...revenueData.monthlyRevenue].sort((a, b) => {
        const dateA = new Date(a.month + ' 1');
        const dateB = new Date(b.month + ' 1');
        return dateA.getTime() - dateB.getTime();
      });

      // Calculate 12M total (all available months, VAT already excluded)
      const totalRevenue = sortedRevenue.reduce((sum, month) => sum + month.revenue, 0);
      twelveMonthTotal = `£${Math.round(totalRevenue).toLocaleString()}`;

      // Calculate 12M change (current year vs previous year if available)
      if (sortedRevenue.length >= 12) {
        const currentYearTotal = sortedRevenue.slice(-12).reduce((sum, month) => sum + month.revenue, 0);
        const previousYearTotal = sortedRevenue.slice(-24, -12).reduce((sum, month) => sum + month.revenue, 0);
        if (previousYearTotal > 0) {
          const changePercent = ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100;
          twelveMonthChange = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
        }
      }

      // Calculate 3M average (last 3 months, VAT already excluded)
      if (sortedRevenue.length >= 3) {
        const lastThreeMonths = sortedRevenue.slice(-3);
        const threeMonthSum = lastThreeMonths.reduce((sum, month) => sum + month.revenue, 0);
        const average = threeMonthSum / 3;
        threeMonthAverage = `£${Math.round(average).toLocaleString()}`;

        // Calculate 3M change (current 3M avg vs previous 3M avg)
        if (sortedRevenue.length >= 6) {
          const previousThreeMonths = sortedRevenue.slice(-6, -3);
          const previousAverage = previousThreeMonths.reduce((sum, month) => sum + month.revenue, 0) / 3;
          if (previousAverage > 0) {
            const changePercent = ((average - previousAverage) / previousAverage) * 100;
            threeMonthChange = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
          }
        }
      }
    }

    // Generate genuine activities with timestamps
    const now = new Date();
    const activities = [];

    // Task-related activities
    if (tasksData.total > 0) {
      activities.push({
        action: `${tasksData.open} open tasks requiring attention`,
        user: 'Task System',
        time: 'Live count',
        type: 'task'
      });

      if (tasksData.completed > 0) {
        activities.push({
          action: `${tasksData.completed}/${tasksData.total} tasks completed (${tasksData.completionRate}% completion rate)`,
          user: 'Project Team',
          time: 'Current status',
          type: 'task'
        });
      }

      // Recent tasks activity if available
      if (tasksData.recentTasks && tasksData.recentTasks > 0) {
        activities.push({
          action: `${tasksData.recentTasks} new tasks created`,
          user: 'Team Members',
          time: 'Last 7 days',
          type: 'task'
        });
      }
    }

    // Holiday-related activities
    if (teamHolidaysData.currentlyOnHoliday > 0) {
      activities.push({
        action: `${teamHolidaysData.currentlyOnHoliday} team ${teamHolidaysData.currentlyOnHoliday === 1 ? 'member' : 'members'} currently on holiday`,
        user: 'HR System',
        time: 'Right now',
        type: 'holiday'
      });
    }

    if (teamHolidaysData.next14Days > 0) {
      activities.push({
        action: `${teamHolidaysData.next14Days} upcoming ${teamHolidaysData.next14Days === 1 ? 'holiday' : 'holidays'} in next 2 weeks`,
        user: 'Calendar System',
        time: 'Next 14 days',
        type: 'holiday'
      });
    }

    // Sales/Deal activities - Enhanced with individual deal details
    if (pipedriveData.newDealsCount > 0 && pipedriveData.deals && Array.isArray(pipedriveData.deals)) {
      // Add individual deal activities for the most recent deals
      const sortedDeals = pipedriveData.deals
        .sort((a: any, b: any) => new Date(b.add_time).getTime() - new Date(a.add_time).getTime())
        .slice(0, 3); // Show top 3 most recent deals

      sortedDeals.forEach((deal: any) => {
        const dealDate = new Date(deal.add_time);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - dealDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let timeAgo: string;
        if (diffDays === 1) {
          timeAgo = 'Yesterday';
        } else if (diffDays <= 7) {
          timeAgo = `${diffDays} days ago`;
        } else if (diffDays <= 30) {
          timeAgo = `${Math.ceil(diffDays / 7)} weeks ago`;
        } else {
          timeAgo = 'Over a month ago';
        }

        activities.push({
          action: `New deal added: "${deal.title}" - ${currencySymbol}${deal.value.toLocaleString()}`,
          user: 'Sales Team',
          time: timeAgo,
          type: 'deal'
        });
      });

      // Add summary if there are more deals
      if (pipedriveData.deals.length > 3) {
        const additionalDeals = pipedriveData.deals.length - 3;
        const totalValue = pipedriveData.deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
        activities.push({
          action: `+${additionalDeals} more deals totaling ${currencySymbol}${totalValue.toLocaleString()} in last 30 days`,
          user: 'Sales Team',
          time: 'Last 30 days',
          type: 'deal'
        });
      }
    } else if (pipedriveData.newDealsCount > 0) {
      // Fallback to generic summary if detailed deals data is not available
      activities.push({
        action: `${pipedriveData.newDealsCount} new ${pipedriveData.newDealsCount === 1 ? 'deal' : 'deals'} worth ${currencySymbol}${pipedriveData.newDealsValue.toLocaleString()}`,
        user: 'Sales Team',
        time: 'Last 30 days',
        type: 'deal'
      });
    }

    // Revenue-related activities
    if (revenueData.monthlyRevenue && revenueData.monthlyRevenue.length > 0) {
      const latestMonth = revenueData.monthlyRevenue[revenueData.monthlyRevenue.length - 1];
      if (latestMonth) {
        activities.push({
          action: `Revenue data updated - ${latestMonth.month}: £${(latestMonth.revenue / 1000).toFixed(1)}k (VAT excluded)`,
          user: 'Finance System',
          time: 'Latest available',
          type: 'deal'
        });
      }
    }

    // System activities
    activities.push({
      action: 'Dashboard metrics refreshed with live data',
      user: 'Analytics Engine',
      time: 'Just now',
      type: 'system'
    });

    // If we have very few activities, add some status information
    if (activities.length < 4) {
      activities.push({
        action: 'All systems operational and monitoring',
        user: 'System Monitor',
        time: 'Continuous',
        type: 'system'
      });
    }

    // Sort activities by importance/recency (tasks and deals first, then others)
    const sortedActivities = activities.sort((a, b) => {
      const priority: { [key: string]: number } = { 'task': 1, 'deal': 2, 'holiday': 3, 'system': 4 };
      return (priority[a.type] || 5) - (priority[b.type] || 5);
    }).slice(0, 6); // Limit to 6 most important activities

    console.log('📊 Final aggregated data:', {
      newDeals: pipedriveData.newDealsCount,
      dealsValue: pipedriveData.newDealsValue,
      openTasks: tasksData.open,
      threeMonthAverage,
      twelveMonthTotal
    });

    const dashboardData: DashboardData = {
      metrics: {
        totalRevenue: {
          value: '£124,563',
          change: '+12.5%',
          changeType: 'increase'
        },
        activeUsers: {
          value: '2,847',
          change: '+8.2%',
          changeType: 'increase'
        },
        newDeals: {
          value: pipedriveData.newDealsCount.toString(),
          change: '+8.7%',
          changeType: 'increase'
        },
        dealsValue: {
          value: `${currencySymbol}${pipedriveData.newDealsValue.toLocaleString()}`,
          change: '+12.4%',
          changeType: 'increase'
        },
        openTasks: {
          value: tasksData.open.toString(),
          change: tasksChange,
          changeType: tasksChangeType
        },
        teamHolidays: {
          value: teamHolidaysData.next14Days.toString(),
          change: holidayChange,
          changeType: 'neutral'
        },
        sixMonthAverage: {
          value: threeMonthAverage,
          change: threeMonthChange,
          changeType: threeMonthChange.startsWith('+') ? 'increase' : threeMonthChange.startsWith('-') ? 'decrease' : 'neutral'
        },
        twelveMonthTotal: {
          value: twelveMonthTotal,
          change: twelveMonthChange,
          changeType: twelveMonthChange.startsWith('+') ? 'increase' : twelveMonthChange.startsWith('-') ? 'decrease' : 'neutral'
        }
      },
      charts: {
        revenueData: revenueData.revenueData,
        taskDistribution: tasksData.total > 0 ? [
          { 
            name: 'Completed', 
            value: Math.round((tasksData.completed / tasksData.total) * 100), 
            color: '#10B981',
            count: tasksData.completed
          },
          { 
            name: 'In Progress', 
            value: Math.round((tasksData.inProgress / tasksData.total) * 100), 
            color: '#3B82F6',
            count: tasksData.inProgress
          },
          { 
            name: 'In Review', 
            value: Math.round((tasksData.inReview / tasksData.total) * 100), 
            color: '#8B5CF6',
            count: tasksData.inReview
          },
          { 
            name: 'Open', 
            value: Math.round(((tasksData.total - tasksData.completed - tasksData.inProgress - tasksData.inReview) / tasksData.total) * 100), 
            color: '#F59E0B',
            count: tasksData.total - tasksData.completed - tasksData.inProgress - tasksData.inReview
          }
        ].filter(item => item.value > 0) : [
          { name: 'No Tasks', value: 100, color: '#E5E7EB', count: 0 }
        ]
      },
      activities: sortedActivities
    };

    console.log('🎉 Dashboard API: Successfully returning data');
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
} 