import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  calendarType: 'google' | 'outlook' | 'ical';
  employeeEmail: string;
  employeeName: string;
  color: string;
  isPrivate?: boolean;
}

interface EmployeeCalendarTokens {
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiryDate?: number;
}

// In production, this would be fetched from your database
const getEmployeeTokens = async (employeeEmail: string): Promise<EmployeeCalendarTokens | null> => {
  // This is where you'd query your database for stored tokens
  // For now, return null to indicate no tokens stored
  return null;
};

const saveEmployeeTokens = async (tokens: EmployeeCalendarTokens): Promise<void> => {
  // This is where you'd save refreshed tokens to your database
  console.log('Saving refreshed tokens for:', tokens.email);
};

const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return credentials.access_token;
};

const fetchGoogleCalendarEvents = async (
  employeeTokens: EmployeeCalendarTokens,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Check if token needs refresh
  let accessToken = employeeTokens.accessToken;
  if (employeeTokens.expiryDate && Date.now() > employeeTokens.expiryDate) {
    accessToken = await refreshAccessToken(employeeTokens.refreshToken);
    
    // Save refreshed token
    await saveEmployeeTokens({
      ...employeeTokens,
      accessToken,
      expiryDate: Date.now() + 3600000 // 1 hour from now
    });
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate,
      timeMax: endDate,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    return events.map((event): CalendarEvent => ({
      id: event.id ?? 'unknown',
      title: event.summary ?? 'No Title',
      start: event.start?.dateTime ?? event.start?.date ?? '',
      end: event.end?.dateTime ?? event.end?.date ?? '',
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      attendees: event.attendees?.map(attendee => attendee.email ?? '').filter(Boolean) || [],
      calendarType: 'google',
      employeeEmail: employeeTokens.email,
      employeeName: employeeTokens.name,
      color: '#4285f4', // Google blue
      isPrivate: event.visibility === 'private'
    }));

  } catch (error) {
    console.error(`Error fetching Google Calendar events for ${employeeTokens.email}:`, error);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      employeeEmails = 'all',
      startDate = new Date().toISOString().split('T')[0],
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      includePrivate = 'false'
    } = req.query;

    const includePrivateEvents = includePrivate === 'true';
    
    // Get employee emails to fetch
    const employeeEmailList = employeeEmails === 'all' 
      ? ['alex.keal@moniteye.com', 'mark.richardson@moniteye.com', 'mark.nash@moniteye.com', 'richard.booth@moniteye.com']
      : (employeeEmails as string).split(',');

    const allEvents: CalendarEvent[] = [];

    // Fetch events for each employee
    for (const email of employeeEmailList) {
      const tokens = await getEmployeeTokens(email.trim());
      
      if (tokens) {
        const events = await fetchGoogleCalendarEvents(
          tokens,
          `${startDate}T00:00:00Z`,
          `${endDate}T23:59:59Z`
        );
        
        // Filter private events if requested
        const filteredEvents = includePrivateEvents 
          ? events 
          : events.filter(event => !event.isPrivate);
        
        allEvents.push(...filteredEvents);
      } else {
        console.log(`No tokens found for employee: ${email}`);
        
        // Return mock data for demo purposes
        allEvents.push({
          id: `mock-${email}-${Date.now()}`,
          title: `${email} - Calendar Not Connected`,
          start: new Date().toISOString(),
          end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          description: 'Employee needs to authorize calendar access',
          calendarType: 'google',
          employeeEmail: email,
          employeeName: email.split('@')[0].replace('.', ' '),
          color: '#f44336',
          isPrivate: false
        });
      }
    }

    // Sort events by start time
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const response = {
      success: true,
      count: allEvents.length,
      events: allEvents,
      meta: {
        startDate,
        endDate,
        includePrivate: includePrivateEvents,
        employeesQueried: employeeEmailList.length,
        lastUpdated: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching real calendar events:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 