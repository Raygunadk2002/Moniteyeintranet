import type { NextApiRequest, NextApiResponse } from 'next';

function calculateTasksChange(openTasks: number, completedTasks: number): string {
  // Calculate a percentage based on task completion ratio
  // If more tasks are completed than open, show positive change
  // This is a simplified calculation - in a real app you'd compare to previous period
  const completionRatio = completedTasks / (openTasks + completedTasks);
  const changePercentage = Math.round((completionRatio - 0.5) * 100);
  return `${changePercentage > 0 ? '+' : ''}${changePercentage}%`;
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
    // Fetch holiday data from Timetastic to enhance dashboard metrics
    const currentYear = new Date().getFullYear();
    const holidayResponse = await fetch(`https://app.timetastic.co.uk/api/publicholidays?year=${currentYear}`, {
      headers: {
        'Authorization': `Bearer acf87e83-3e43-42df-b7d6-861a69f90414`,
        'Content-Type': 'application/json'
      }
    });

    const holidayData = await holidayResponse.json();
    const upcomingHolidays = Array.isArray(holidayData) ? holidayData.filter((holiday: any) => {
      const holidayDate = new Date(holiday.date);
      const today = new Date();
      return holidayDate > today;
    }).length : 0;

    // Fetch team holiday metrics
    const teamHolidaysResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/team-holidays-metrics`);
    let teamHolidaysData = { next14Days: 0, next30Days: 0, currentlyOnHoliday: 0, totalUpcoming: 0 };
    
    if (teamHolidaysResponse.ok) {
      teamHolidaysData = await teamHolidaysResponse.json();
    } else {
      console.log('Failed to fetch team holidays data');
    }

    // Fetch Pipedrive data
    const pipedriveResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/pipedrive`);
    let pipedriveData = { newDealsCount: 0, newDealsValue: 0, currency: 'USD' };
    
    if (pipedriveResponse.ok) {
      pipedriveData = await pipedriveResponse.json();
    } else {
      console.log('Failed to fetch Pipedrive data');
    }

    // Fetch LIVE Tasks data from tasks API
    const tasksResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/tasks`);
    let tasksData = { 
      total: 0, 
      open: 0, 
      completed: 0, 
      inProgress: 0, 
      inReview: 0,
      columnCounts: {},
      completionRate: 0,
      tasks: [],
      columns: []
    };
    
    if (tasksResponse.ok) {
      tasksData = await tasksResponse.json();
    } else {
      console.log('Failed to fetch tasks data');
    }

    // Fetch revenue data
    const revenueResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/revenue-data`);
    let revenueData = { revenueData: [12, 15, 18, 22, 19, 25] };
    
    if (revenueResponse.ok) {
      revenueData = await revenueResponse.json();
    } else {
      console.log('Failed to fetch revenue data');
    }

    // Calculate completion percentage
    const tasksChange = calculateTasksChange(tasksData.open, tasksData.completed);
    const tasksChangeType = tasksData.completed > tasksData.open ? 'increase' : 'decrease';

    // Calculate holiday trends
    const holidayChange = teamHolidaysData.next14Days > 0 ? `${teamHolidaysData.next30Days} in 30d` : 'None upcoming';

    // Format currency for deals
    const currencySymbol = pipedriveData.currency === 'GBP' ? '£' : '$';

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
          value: '£72,564',
          change: '+8.3%',
          changeType: 'increase'
        },
        twelveMonthTotal: {
          value: '£864,379',
          change: '+12.1%',
          changeType: 'increase'
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
      activities: [
        { action: `${tasksData.open} open tasks`, user: 'Task System', time: 'Live count', type: 'task' },
        { action: `${tasksData.completed}/${tasksData.total} tasks completed (${tasksData.completionRate}%)`, user: 'Task System', time: 'Live stats', type: 'task' },
        { action: `${teamHolidaysData.currentlyOnHoliday} team members on holiday`, user: 'Holiday System', time: 'Live count', type: 'holiday' },
        { action: `${pipedriveData.newDealsCount} new deals (${currencySymbol}${pipedriveData.newDealsValue.toLocaleString()})`, user: 'Sales Team', time: 'Last 30 days', type: 'deal' },
        { action: 'Dashboard refreshed', user: 'System', time: 'Just now', type: 'system' }
      ]
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
} 