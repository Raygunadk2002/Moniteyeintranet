import type { NextApiRequest, NextApiResponse } from 'next';

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
  calendarType: 'google' | 'outlook' | 'ical' | 'exchange';
  employeeName: string;
  employeeId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGetCalendarEvents(req, res);
    case 'POST':
      return handleSyncCalendars(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetCalendarEvents(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { startDate, endDate, employeeId, includePrivate = 'false' } = req.query;
    
    // Mock calendar events from various sources - in production, fetch from integrated calendars
    const calendarEvents: CalendarEvent[] = [
      // Alex Keal - Google Calendar
      {
        id: 'event-1',
        title: 'Moniteye Team Standup',
        description: 'Daily team sync meeting',
        startDateTime: '2025-06-11T09:00:00Z',
        endDateTime: '2025-06-11T09:30:00Z',
        isAllDay: false,
        location: 'Conference Room A',
        attendees: ['alex@moniteye.com', 'mark.r@moniteye.com', 'mark.n@moniteye.com'],
        organizer: 'alex@moniteye.com',
        status: 'confirmed',
        visibility: 'public',
        calendarType: 'google',
        employeeName: 'Alex Keal',
        employeeId: 'emp-001'
      },
      {
        id: 'event-2',
        title: 'Client Meeting - Environmental Sensors',
        description: 'Discussion about new sensor deployment',
        startDateTime: '2025-06-11T14:00:00Z',
        endDateTime: '2025-06-11T15:30:00Z',
        isAllDay: false,
        location: 'Teams Meeting',
        attendees: ['alex@moniteye.com', 'client@company.com'],
        organizer: 'alex@moniteye.com',
        status: 'confirmed',
        visibility: 'public',
        calendarType: 'google',
        employeeName: 'Alex Keal',
        employeeId: 'emp-001'
      },
      // Mark Richardson - Outlook Calendar
      {
        id: 'event-3',
        title: 'Technical Review Meeting',
        description: 'Review of structural monitoring algorithms',
        startDateTime: '2025-06-11T10:30:00Z',
        endDateTime: '2025-06-11T11:30:00Z',
        isAllDay: false,
        location: 'Engineering Office',
        attendees: ['mark.r@moniteye.com', 'mark.n@moniteye.com'],
        organizer: 'mark.r@moniteye.com',
        status: 'confirmed',
        visibility: 'public',
        calendarType: 'outlook',
        employeeName: 'Mark Richardson',
        employeeId: 'emp-002'
      },
      {
        id: 'event-4',
        title: 'Site Visit - Bridge Monitoring',
        description: 'Install tilt sensors on bridge infrastructure',
        startDateTime: '2025-06-12T08:00:00Z',
        endDateTime: '2025-06-12T17:00:00Z',
        isAllDay: true,
        location: 'Bridge Site, London',
        attendees: ['mark.r@moniteye.com'],
        organizer: 'mark.r@moniteye.com',
        status: 'confirmed',
        visibility: 'public',
        calendarType: 'outlook',
        employeeName: 'Mark Richardson',
        employeeId: 'emp-002'
      },
      // Mark Nockles - Google Calendar
      {
        id: 'event-5',
        title: 'Data Analysis Session',
        description: 'Analyze recent monitoring data trends',
        startDateTime: '2025-06-11T13:00:00Z',
        endDateTime: '2025-06-11T16:00:00Z',
        isAllDay: false,
        location: 'Data Lab',
        attendees: ['mark.n@moniteye.com'],
        organizer: 'mark.n@moniteye.com',
        status: 'confirmed',
        visibility: 'public',
        calendarType: 'google',
        employeeName: 'Mark Nockles',
        employeeId: 'emp-003'
      },
      // Richard Booth - iCal
      {
        id: 'event-6',
        title: 'Intranet Development Sprint',
        description: 'Work on dashboard and user interface improvements',
        startDateTime: '2025-06-11T09:00:00Z',
        endDateTime: '2025-06-11T17:00:00Z',
        isAllDay: true,
        location: 'Home Office',
        attendees: ['r.booth@moniteye.com'],
        organizer: 'r.booth@moniteye.com',
        status: 'confirmed',
        visibility: 'public',
        calendarType: 'ical',
        employeeName: 'Richard Booth',
        employeeId: 'emp-004'
      },
      {
        id: 'event-7',
        title: 'Personal Appointment',
        description: 'Medical appointment',
        startDateTime: '2025-06-13T14:00:00Z',
        endDateTime: '2025-06-13T15:00:00Z',
        isAllDay: false,
        location: 'Medical Center',
        attendees: ['r.booth@moniteye.com'],
        organizer: 'r.booth@moniteye.com',
        status: 'confirmed',
        visibility: 'private',
        calendarType: 'ical',
        employeeName: 'Richard Booth',
        employeeId: 'emp-004'
      },
      // Future events
      {
        id: 'event-8',
        title: 'Monthly All-Hands Meeting',
        description: 'Company-wide update and Q&A session',
        startDateTime: '2025-06-15T15:00:00Z',
        endDateTime: '2025-06-15T16:00:00Z',
        isAllDay: false,
        location: 'Main Conference Room',
        attendees: ['alex@moniteye.com', 'mark.r@moniteye.com', 'mark.n@moniteye.com', 'r.booth@moniteye.com'],
        organizer: 'alex@moniteye.com',
        status: 'confirmed',
        visibility: 'public',
        calendarType: 'google',
        employeeName: 'Alex Keal',
        employeeId: 'emp-001'
      }
    ];

    let filteredEvents = calendarEvents;

    // Filter by employee ID if specified
    if (employeeId) {
      filteredEvents = filteredEvents.filter(event => event.employeeId === employeeId);
    }

    // Filter by date range if specified
    if (startDate) {
      const start = new Date(startDate as string);
      filteredEvents = filteredEvents.filter(event => new Date(event.startDateTime) >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      filteredEvents = filteredEvents.filter(event => new Date(event.startDateTime) <= end);
    }

    // Filter private events unless explicitly requested
    if (includePrivate !== 'true') {
      filteredEvents = filteredEvents.filter(event => event.visibility !== 'private');
    }

    // Sort by start time
    filteredEvents.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

    res.status(200).json({
      events: filteredEvents,
      totalCount: filteredEvents.length,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
}

async function handleSyncCalendars(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { employeeIds, forceRefresh = false } = req.body;

    // Mock sync process - in production, this would:
    // 1. Fetch latest events from each calendar provider
    // 2. Update local cache/database
    // 3. Return sync status

    console.log('Syncing calendars for employees:', employeeIds);
    console.log('Force refresh:', forceRefresh);

    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const syncResults = [
      {
        employeeId: 'emp-001',
        employeeName: 'Alex Keal',
        calendarType: 'google',
        status: 'success',
        eventsFound: 12,
        lastSync: new Date().toISOString()
      },
      {
        employeeId: 'emp-002',
        employeeName: 'Mark Richardson',
        calendarType: 'outlook',
        status: 'success',
        eventsFound: 8,
        lastSync: new Date().toISOString()
      },
      {
        employeeId: 'emp-003',
        employeeName: 'Mark Nockles',
        calendarType: 'google',
        status: 'partial',
        eventsFound: 5,
        error: 'Limited access - some private events excluded',
        lastSync: new Date().toISOString()
      },
      {
        employeeId: 'emp-004',
        employeeName: 'Richard Booth',
        calendarType: 'ical',
        status: 'success',
        eventsFound: 15,
        lastSync: new Date().toISOString()
      }
    ];

    res.status(200).json({
      message: 'Calendar sync completed',
      results: syncResults,
      syncTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing calendars:', error);
    res.status(500).json({ error: 'Failed to sync calendars' });
  }
} 