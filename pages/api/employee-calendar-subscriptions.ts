import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Force redeploy - ensure production uses latest Supabase query logic
interface EmployeeCalendar {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  calendarType: 'google' | 'outlook' | 'ical' | 'exchange';
  calendarId?: string;
  accessToken?: string;
  refreshToken?: string;
  subscriptionUrl?: string;
  lastSync?: string;
  isActive: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  organizer: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private' | 'confidential';
}

// Employee configuration for Google Calendar OAuth
const EMPLOYEE_CONFIG = [
  {
    id: 'cal-1',
    employeeId: 'alex-keal',
    employeeName: 'Alex Keal',
    email: 'alex@moniteye.com',
    calendarType: 'google' as const,
    calendarId: 'alex@moniteye.com'
  },
  {
    id: 'cal-2',
    employeeId: 'mark-nockles',
    employeeName: 'Mark Nockles',
    email: 'mark.n@moniteye.com',
    calendarType: 'google' as const,
    calendarId: 'mark.n@moniteye.com'
  },
  {
    id: 'cal-3',
    employeeId: 'richard-booth',
    employeeName: 'Richard Booth',
    email: 'r.booth@moniteye.com',
    calendarType: 'google' as const,
    calendarId: 'r.booth@moniteye.com'
  }
];

async function fetchLiveCalendarData() {
  try {
    // Import and use the logic directly instead of making HTTP calls
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Supabase credentials not available, using fallback data');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create employee data with active status based on tokens
    const employees = [
      { employeeId: 'alex-keal', employeeName: 'Alex Keal', email: 'alex@moniteye.com', calendarType: 'google' },
      { employeeId: 'mark-nockles', employeeName: 'Mark Nockles', email: 'mark.n@moniteye.com', calendarType: 'google' },
      { employeeId: 'richard-booth', employeeName: 'Richard Booth', email: 'richard@moniteye.com', calendarType: 'google' }
    ];

    const employeesWithStatus = [];
    
    // Check each employee individually (same pattern as working API)
    for (const emp of employees) {
      const { data: tokenData, error } = await supabase
        .from('employee_calendar_tokens')
        .select('*')
        .eq('employee_id', emp.employeeId)
        .single();

      const hasToken = !error && tokenData;
      
      employeesWithStatus.push({
        ...emp,
        isActive: !!hasToken,
        connectionStatus: hasToken ? 'connected' : 'disconnected' as 'connected' | 'disconnected',
        lastSync: hasToken ? new Date().toISOString() : undefined
      });
    }

    return employeesWithStatus;
  } catch (error) {
    console.error('Error fetching live calendar data:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGetSubscriptions(req, res);
    case 'POST':
      return handleCreateSubscription(req, res);
    case 'DELETE':
      return handleDeleteSubscription(req, res);
    case 'PUT':
      return handleUpdateSubscription(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetSubscriptions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { employeeId } = req.query;
    
    // Try to fetch live calendar data first
    const liveCalendarData = await fetchLiveCalendarData();
    
    let employeeCalendars: EmployeeCalendar[];
    
    if (liveCalendarData && Array.isArray(liveCalendarData)) {
      // Use live data if available
      employeeCalendars = liveCalendarData.map((emp: any) => ({
        id: `cal-${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        email: emp.email,
        calendarType: emp.calendarType,
        calendarId: emp.email,
        isActive: emp.isActive,
        lastSync: emp.lastSync
      }));
    } else {
      // Fallback to default configuration if live data unavailable
      employeeCalendars = EMPLOYEE_CONFIG.map((config) => {
        return {
          id: config.id,
          employeeId: config.employeeId,
          employeeName: config.employeeName,
          email: config.email,
          calendarType: config.calendarType,
          calendarId: config.calendarId,
          isActive: false, // No OAuth tokens available
          lastSync: new Date().toISOString()
        };
      });
    }

    let filteredCalendars = employeeCalendars;
    if (employeeId) {
      filteredCalendars = employeeCalendars.filter(cal => cal.employeeId === employeeId);
    }

    res.status(200).json({
      calendars: filteredCalendars,
      totalCount: filteredCalendars.length,
      dataSource: liveCalendarData ? 'live' : 'environment',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching calendar subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch calendar subscriptions' });
  }
}

async function handleCreateSubscription(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { employeeId, employeeName, email, calendarType, calendarId, accessToken } = req.body;

    if (!employeeId || !employeeName || !email || !calendarType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate subscription ID
    const subscriptionId = `cal-${Date.now()}`;

    // Create new subscription
    const newSubscription: EmployeeCalendar = {
      id: subscriptionId,
      employeeId,
      employeeName,
      email,
      calendarType,
      calendarId,
      accessToken,
      isActive: true,
      lastSync: new Date().toISOString()
    };

    // In production, save to database
    console.log('Creating calendar subscription:', newSubscription);

    res.status(201).json({
      message: 'Calendar subscription created successfully',
      subscription: newSubscription
    });
  } catch (error) {
    console.error('Error creating calendar subscription:', error);
    res.status(500).json({ error: 'Failed to create calendar subscription' });
  }
}

async function handleDeleteSubscription(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { subscriptionId } = req.query;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // In production, delete from database
    console.log('Deleting calendar subscription:', subscriptionId);

    res.status(200).json({ message: 'Calendar subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar subscription:', error);
    res.status(500).json({ error: 'Failed to delete calendar subscription' });
  }
}

async function handleUpdateSubscription(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { subscriptionId } = req.query;
    const updates = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // In production, update in database
    console.log('Updating calendar subscription:', subscriptionId, updates);

    res.status(200).json({ message: 'Calendar subscription updated successfully' });
  } catch (error) {
    console.error('Error updating calendar subscription:', error);
    res.status(500).json({ error: 'Failed to update calendar subscription' });
  }
} 