import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// This approach uses a service account that employees share their calendars with
const serviceAccountKey = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token"
};

// Employee calendars - employees share their calendar with the service account email
const EMPLOYEE_CALENDARS = [
  {
    name: 'Alex Keal',
    email: 'alex@moniteye.com',
    calendarId: 'alex@moniteye.com', // Their Google Calendar email
    color: '#3B82F6'
  },
  {
    name: 'Mark Richardson', 
    email: 'mark.r@moniteye.com',
    calendarId: 'mark.r@moniteye.com',
    color: '#10B981'
  },
  {
    name: 'Mark Nockles',
    email: 'mark.n@moniteye.com', 
    calendarId: 'mark.n@moniteye.com',
    color: '#F59E0B'
  },
  {
    name: 'Richard Booth',
    email: 'richard@moniteye.com',
    calendarId: 'richard@moniteye.com', 
    color: '#EF4444'
  }
];

async function getCalendarEvents(calendarId: string, employeeName: string, color: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: oneMonthFromNow.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items || [];
    
    return events.map(event => ({
      id: `${calendarId}-${event.id}`,
      title: event.summary || 'Untitled Event',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      description: event.description || '',
      location: event.location || '',
      employeeName,
      employeeEmail: calendarId,
      color
    }));

  } catch (error) {
    console.error(`Error fetching calendar for ${employeeName}:`, error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allEvents: any[] = [];
    
    // Check if service account is configured
    if (!serviceAccountKey.private_key || !serviceAccountKey.client_email) {
      return res.status(400).json({
        error: 'Service account not configured',
        message: 'Please configure Google service account credentials in environment variables',
        setup: {
          required: [
            'GOOGLE_PROJECT_ID',
            'GOOGLE_PRIVATE_KEY_ID', 
            'GOOGLE_PRIVATE_KEY',
            'GOOGLE_SERVICE_ACCOUNT_EMAIL',
            'GOOGLE_CLIENT_ID'
          ],
          instructions: 'See CALENDAR_SETUP_GUIDE.md for setup instructions'
        }
      });
    }
    
    // Fetch all employee calendars in parallel
    const promises = EMPLOYEE_CALENDARS.map(employee =>
      getCalendarEvents(employee.calendarId, employee.name, employee.color)
    );
    
    const results = await Promise.all(promises);
    results.forEach(events => allEvents.push(...events));
    
    // Sort all events by start time
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    const response = {
      events: allEvents,
      totalEvents: allEvents.length,
      employees: EMPLOYEE_CALENDARS.map(emp => ({
        name: emp.name,
        email: emp.email,
        color: emp.color
      })),
      lastUpdated: new Date().toISOString(),
      method: 'service-account'
    };

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Calendar service error:', error);
    res.status(500).json({
      error: 'Failed to fetch calendars',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 