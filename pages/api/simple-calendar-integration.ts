import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  calendarType: 'google' | 'oauth';
  employeeName: string;
  employeeId: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  organizer?: {
    email?: string;
    displayName?: string;
  };
  status?: string;
  visibility?: string;
}

// Updated employee configurations - matching the OAuth system
const EMPLOYEE_CONFIGS = [
  {
    id: 'alex-keal',
    name: 'Alex Keal',
    email: 'akeal@moniteye.co.uk',
    color: '#3B82F6'
  },
  {
    id: 'mark-nockles',
    name: 'Mark Nockles',
    email: 'mnockles@moniteye.co.uk',
    color: '#F59E0B'
  },
  {
    id: 'richard-booth',
    name: 'Richard Booth',
    email: 'rbooth@moniteye.co.uk',
    color: '#EF4444'
  }
];

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function fetchGoogleCalendarEvents(
  accessToken: string,
  employeeName: string,
  employeeId: string,
  employeeEmail: string
): Promise<CalendarEvent[]> {
  try {
    console.log(`🔄 Fetching Google Calendar events for ${employeeName}`);
    
    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}&` +
      `timeMax=${oneMonthFromNow.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=100&` +
      `showDeleted=false`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Google Calendar API error for ${employeeName}:`, response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const events = data.items || [];

    // Filter out cancelled events and events where user declined
    const validEvents = events.filter((event: GoogleCalendarEvent) => {
      // Skip cancelled events
      if (event.status === 'cancelled') {
        console.log(`⏭️ Skipping cancelled event: ${event.summary}`);
        return false;
      }

      // Check if the user declined this event
      if (event.attendees) {
        const userAttendee = event.attendees.find(attendee => 
          attendee.email?.toLowerCase() === employeeEmail.toLowerCase()
        );
        
        if (userAttendee && userAttendee.responseStatus === 'declined') {
          console.log(`⏭️ Skipping declined event: ${event.summary}`);
          return false;
        }
      }

      return true;
    });

    const calendarEvents: CalendarEvent[] = validEvents.map((event: GoogleCalendarEvent) => {
      const startDateTime = event.start?.dateTime || event.start?.date || new Date().toISOString();
      const endDateTime = event.end?.dateTime || event.end?.date || startDateTime;
      const isAllDay = !event.start?.dateTime; // If no time, it's all-day

      return {
        id: `${employeeId}-${event.id}`,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        startDateTime,
        endDateTime,
        isAllDay,
        location: event.location || '',
        attendees: event.attendees?.map(a => a.email || a.displayName || '') || [],
        organizer: event.organizer?.email || employeeEmail,
        status: (event.status as any) || 'confirmed',
        visibility: (event.visibility as any) || 'public',
        calendarType: 'google',
        employeeName,
        employeeId
      };
    });

    console.log(`✅ Successfully fetched ${calendarEvents.length} valid events for ${employeeName} (filtered from ${events.length} total)`);
    return calendarEvents;
  } catch (error) {
    console.error(`❌ Error fetching Google Calendar for ${employeeName}:`, error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting OAuth-based calendar integration...');
    
    const allEvents: CalendarEvent[] = [];
    const employeeStatuses: Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      email: string;
      calendarType: 'google';
      isActive: boolean;
      lastSync: string;
      hasToken?: boolean;
      tokenStatus?: string;
    }> = [];

    // Fetch OAuth tokens for all employees
    for (const employee of EMPLOYEE_CONFIGS) {
      console.log(`🔍 Checking OAuth token for ${employee.name} (${employee.id})`);
      
      const { data: tokenData, error: tokenError } = await supabase
        .from('employee_calendar_tokens')
        .select('*')
        .eq('employee_id', employee.id)
        .single();

      if (tokenError || !tokenData) {
        console.log(`❌ No OAuth token found for ${employee.name}`);
        employeeStatuses.push({
          id: employee.id,
          employeeId: employee.id,
          employeeName: employee.name,
          email: employee.email,
          calendarType: 'google',
          isActive: false,
          lastSync: new Date().toISOString(),
          hasToken: false,
          tokenStatus: 'not_connected'
        });
        continue;
      }

      console.log(`✅ OAuth token found for ${employee.name}`);

      let accessToken = tokenData.google_access_token;
      
      // Check if token needs refresh (if google_token_expiry is past or near expiry)
      if (tokenData.google_token_expiry) {
        const expiresAt = new Date(tokenData.google_token_expiry);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // Refresh if token expires within 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log(`🔄 Refreshing access token for ${employee.name}`);
          const newAccessToken = await refreshAccessToken(tokenData.google_refresh_token);
          
          if (newAccessToken) {
            accessToken = newAccessToken;
            // Update token in database
            await supabase
              .from('employee_calendar_tokens')
              .update({
                google_access_token: newAccessToken,
                google_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
              })
              .eq('employee_id', employee.id);
          } else {
            console.log(`❌ Failed to refresh token for ${employee.name}`);
            employeeStatuses.push({
              id: employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              email: employee.email,
              calendarType: 'google',
              isActive: false,
              lastSync: new Date().toISOString(),
              hasToken: true,
              tokenStatus: 'refresh_failed'
            });
            continue;
          }
        }
      }

      // Fetch calendar events using the access token
      try {
        const events = await fetchGoogleCalendarEvents(
          accessToken,
          employee.name,
          employee.id,
          employee.email
        );
        
        allEvents.push(...events);
        
        employeeStatuses.push({
          id: employee.id,
          employeeId: employee.id,
          employeeName: employee.name,
          email: employee.email,
          calendarType: 'google',
          isActive: true,
          lastSync: new Date().toISOString(),
          hasToken: true,
          tokenStatus: 'connected'
        });

        console.log(`✅ Added ${events.length} events for ${employee.name}`);
      } catch (error) {
        console.error(`❌ Error processing calendar for ${employee.name}:`, error);
        employeeStatuses.push({
          id: employee.id,
          employeeId: employee.id,
          employeeName: employee.name,
          email: employee.email,
          calendarType: 'google',
          isActive: false,
          lastSync: new Date().toISOString(),
          hasToken: true,
          tokenStatus: 'fetch_failed'
        });
      }
    }

    // Sort events by start time
    allEvents.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

    const response = {
      success: true,
      totalEvents: allEvents.length,
      employees: employeeStatuses,
      events: allEvents,
      lastUpdated: new Date().toISOString(),
      integrationMethod: 'oauth'
    };

    console.log(`🎉 OAuth calendar integration complete: ${allEvents.length} total events`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Calendar integration error:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar data',
      message: error instanceof Error ? error.message : 'Unknown error',
      integrationMethod: 'oauth'
    });
  }
} 