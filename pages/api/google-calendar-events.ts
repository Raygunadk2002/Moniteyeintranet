import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  visibility: 'public' | 'private';
}

interface Employee {
  employeeId: string;
  employeeName: string;
  email: string;
  isActive: boolean;
  calendarType: 'google';
  lastSync?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

async function refreshTokenIfNeeded(employeeId: string, refreshToken: string): Promise<any> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/google-calendar-callback`
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update tokens in database
    await supabase
      .from('employee_calendar_tokens')
      .update({
        google_access_token: credentials.access_token,
        google_token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employeeId);

    return credentials;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}

async function fetchEmployeeCalendarEvents(employeeId: string): Promise<CalendarEvent[]> {
  // Get stored tokens for this employee
  const { data: tokenData, error: tokenError } = await supabase
    .from('employee_calendar_tokens')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .single();

  if (tokenError || !tokenData) {
    console.log(`No tokens found for employee ${employeeId}`);
    return [];
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Check if token needs refresh
  const now = new Date();
  const tokenExpiry = new Date(tokenData.google_token_expiry);
  
  let accessToken = tokenData.google_access_token;
  
  if (tokenExpiry <= now) {
    try {
      const newCredentials = await refreshTokenIfNeeded(employeeId, tokenData.google_refresh_token);
      accessToken = newCredentials.access_token;
    } catch (error) {
      console.error(`Failed to refresh token for employee ${employeeId}:`, error);
      return [];
    }
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: tokenData.google_refresh_token
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // Get events for the next 30 days
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items || [];
    
    return events.map(event => ({
      id: event.id || '',
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      startDateTime: event.start?.dateTime || event.start?.date || '',
      endDateTime: event.end?.dateTime || event.end?.date || '',
      isAllDay: !event.start?.dateTime,
      location: event.location || '',
      attendees: event.attendees?.map(a => a.email || '') || [],
      organizer: tokenData.google_name || tokenData.google_email,
      status: (event.status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed',
      visibility: event.visibility === 'private' ? 'private' : 'public'
    }));

  } catch (error) {
    console.error(`Failed to fetch calendar events for employee ${employeeId}:`, error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all employees with stored tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('employee_calendar_tokens')
        .select('*')
        .eq('is_active', true);

      if (tokenError) {
        console.error('Failed to fetch token data:', tokenError);
        return res.status(500).json({ error: 'Failed to fetch employee tokens' });
      }

      const employees: Employee[] = [
        { employeeId: 'alex-keal', employeeName: 'Alex Keal', email: 'alex@moniteye.com', isActive: false, calendarType: 'google', connectionStatus: 'disconnected' },
        { employeeId: 'mark-nockles', employeeName: 'Mark Nockles', email: 'mark.n@moniteye.com', isActive: false, calendarType: 'google', connectionStatus: 'disconnected' },
        { employeeId: 'richard-booth', employeeName: 'Richard Booth', email: 'richard@moniteye.com', isActive: false, calendarType: 'google', connectionStatus: 'disconnected' }
      ];

      // Update employee status based on stored tokens
      const employeesWithTokens = employees.map(emp => {
        const hasToken = tokenData?.find(token => token.employee_id === emp.employeeId);
        return {
          ...emp,
          isActive: !!hasToken,
          connectionStatus: hasToken ? 'connected' : 'disconnected' as 'connected' | 'disconnected' | 'error',
          lastSync: hasToken?.updated_at
        };
      });

      // Fetch calendar events for all active employees
      const allEvents: CalendarEvent[] = [];
      
      for (const employee of employeesWithTokens.filter(emp => emp.isActive)) {
        try {
          const events = await fetchEmployeeCalendarEvents(employee.employeeId);
          allEvents.push(...events);
        } catch (error) {
          console.error(`Failed to fetch events for ${employee.employeeName}:`, error);
          // Update employee status to error
          const empIndex = employeesWithTokens.findIndex(emp => emp.employeeId === employee.employeeId);
          if (empIndex !== -1) {
            employeesWithTokens[empIndex].connectionStatus = 'error';
          }
        }
      }

      // Sort events by start time
      allEvents.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

      res.json({
        employees: employeesWithTokens,
        events: allEvents,
        totalEvents: allEvents.length,
        lastUpdated: new Date().toISOString(),
        dataSource: 'google-calendar-api'
      });

    } catch (error) {
      console.error('Google Calendar API error:', error);
      res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 