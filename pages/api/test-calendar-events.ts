import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create test events
    try {
      const { employeeId, createSample = false } = req.body;

      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }

      // Get stored tokens for this employee
      const { data: tokenData, error: tokenError } = await supabase
        .from('employee_calendar_tokens')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .single();

      if (tokenError || !tokenData) {
        return res.status(404).json({ error: 'No active calendar connection found for this employee' });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: tokenData.google_access_token,
        refresh_token: tokenData.google_refresh_token
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      if (createSample) {
        // Create some sample events for testing
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const sampleEvents = [
          {
            summary: 'Team Standup Meeting',
            description: 'Daily team sync meeting',
            start: {
              dateTime: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000).toISOString(),
              timeZone: 'Europe/London',
            },
            end: {
              dateTime: new Date(tomorrow.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
              timeZone: 'Europe/London',
            },
            location: 'Conference Room A',
          },
          {
            summary: 'Client Project Review',
            description: 'Quarterly review with environmental monitoring client',
            start: {
              dateTime: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000).toISOString(),
              timeZone: 'Europe/London',
            },
            end: {
              dateTime: new Date(tomorrow.getTime() + 15.5 * 60 * 60 * 1000).toISOString(),
              timeZone: 'Europe/London',
            },
            location: 'Teams Meeting',
          },
          {
            summary: 'Sensor Data Analysis',
            description: 'Deep dive into recent monitoring data trends',
            start: {
              dateTime: new Date(nextWeek.getTime() + 10 * 60 * 60 * 1000).toISOString(),
              timeZone: 'Europe/London',
            },
            end: {
              dateTime: new Date(nextWeek.getTime() + 12 * 60 * 60 * 1000).toISOString(),
              timeZone: 'Europe/London',
            },
            location: 'Data Lab',
          }
        ];

        const createdEvents = [];
        for (const event of sampleEvents) {
          try {
            const createdEvent = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: event,
            });
            createdEvents.push(createdEvent.data);
          } catch (error) {
            console.error('Error creating event:', error);
          }
        }

        return res.status(200).json({
          success: true,
          message: `Created ${createdEvents.length} sample events`,
          events: createdEvents,
          employeeId
        });
      }

      // If not creating sample events, just list current events
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return res.status(200).json({
        success: true,
        events: response.data.items || [],
        totalEvents: (response.data.items || []).length,
        employeeId
      });

    } catch (error) {
      console.error('Test calendar events error:', error);
      return res.status(500).json({
        error: 'Failed to handle test calendar events',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'GET') {
    // List current events for testing
    try {
      const { employeeId } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }

      // Get stored tokens for this employee
      const { data: tokenData, error: tokenError } = await supabase
        .from('employee_calendar_tokens')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .single();

      if (tokenError || !tokenData) {
        return res.status(404).json({ error: 'No active calendar connection found for this employee' });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: tokenData.google_access_token,
        refresh_token: tokenData.google_refresh_token
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return res.status(200).json({
        success: true,
        events: response.data.items || [],
        totalEvents: (response.data.items || []).length,
        employeeId,
        dateRange: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

    } catch (error) {
      console.error('Test calendar events error:', error);
      return res.status(500).json({
        error: 'Failed to get test calendar events',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method not allowed' });
} 