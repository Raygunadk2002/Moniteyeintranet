import type { NextApiRequest, NextApiResponse } from 'next';

interface WebhookCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  employeeName: string;
  employeeEmail: string;
  action: 'created' | 'updated' | 'deleted';
}

// In production, you'd store this in a database
let calendarEvents: WebhookCalendarEvent[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Webhook endpoint to receive events from Zapier/IFTTT
  if (req.method === 'POST') {
    try {
      const event: WebhookCalendarEvent = req.body;
      
      // Validate required fields
      if (!event.id || !event.title || !event.start || !event.employeeEmail) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['id', 'title', 'start', 'employeeEmail']
        });
      }

      // Handle different actions
      switch (event.action) {
        case 'created':
        case 'updated':
          // Remove existing event with same ID if it exists
          calendarEvents = calendarEvents.filter(e => e.id !== event.id);
          // Add new/updated event
          calendarEvents.push(event);
          break;
          
        case 'deleted':
          // Remove event
          calendarEvents = calendarEvents.filter(e => e.id !== event.id);
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid action. Must be: created, updated, or deleted' });
      }

      // Remove old events (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      calendarEvents = calendarEvents.filter(e => new Date(e.start) > thirtyDaysAgo);

      console.log(`📅 Calendar webhook: ${event.action} event "${event.title}" for ${event.employeeName}`);
      
      res.status(200).json({
        success: true,
        message: `Event ${event.action} successfully`,
        totalEvents: calendarEvents.length
      });
      
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // GET endpoint to retrieve events
  else if (req.method === 'GET') {
    try {
      // Filter to next 30 days only
      const now = new Date();
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const upcomingEvents = calendarEvents
        .filter(event => {
          const eventDate = new Date(event.start);
          return eventDate >= now && eventDate <= oneMonthFromNow;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      const employeeCounts = upcomingEvents.reduce((acc, event) => {
        acc[event.employeeEmail] = (acc[event.employeeEmail] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.status(200).json({
        events: upcomingEvents,
        totalEvents: upcomingEvents.length,
        employeeCounts,
        lastUpdated: new Date().toISOString(),
        method: 'webhook',
        setup: {
          webhookUrl: `${req.headers.host}/api/webhook-calendar-events`,
          zapierInstructions: 'Create a Zap that triggers on calendar events and sends to this webhook URL'
        }
      });
      
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        error: 'Failed to get events',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed. Use GET to retrieve events or POST to add events.' });
  }
} 