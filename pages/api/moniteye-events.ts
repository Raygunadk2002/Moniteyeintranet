import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MoniteyeEvent {
  id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  event_type: 'company' | 'meeting' | 'holiday' | 'announcement';
  created_by: string;
  location?: string;
  attendees?: string[];
  created_at?: string;
  updated_at?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Moniteye Events API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { start_date, end_date } = req.query;

  let query = supabase
    .from('moniteye_events')
    .select('*')
    .order('start_date', { ascending: true });

  // Filter by date range if provided
  if (start_date) {
    query = query.gte('start_date', start_date);
  }
  if (end_date) {
    query = query.lte('end_date', end_date);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error fetching Moniteye events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }

  console.log(`✅ Fetched ${events?.length || 0} Moniteye events`);
  return res.status(200).json({ events: events || [] });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const eventData: MoniteyeEvent = req.body;

  // Validate required fields
  if (!eventData.title || !eventData.start_date || !eventData.end_date || !eventData.created_by) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, start_date, end_date, created_by' 
    });
  }

  const { data: event, error } = await supabase
    .from('moniteye_events')
    .insert([{
      title: eventData.title,
      description: eventData.description || '',
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      all_day: eventData.all_day || false,
      event_type: eventData.event_type || 'company',
      created_by: eventData.created_by,
      location: eventData.location || '',
      attendees: eventData.attendees || [],
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating Moniteye event:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }

  console.log(`✅ Created Moniteye event: ${event.title}`);
  return res.status(201).json({ event });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const eventData: MoniteyeEvent = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const { data: event, error } = await supabase
    .from('moniteye_events')
    .update({
      title: eventData.title,
      description: eventData.description,
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      all_day: eventData.all_day,
      event_type: eventData.event_type,
      location: eventData.location,
      attendees: eventData.attendees,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating Moniteye event:', error);
    return res.status(500).json({ error: 'Failed to update event' });
  }

  console.log(`✅ Updated Moniteye event: ${event.title}`);
  return res.status(200).json({ event });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const { error } = await supabase
    .from('moniteye_events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting Moniteye event:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }

  console.log(`✅ Deleted Moniteye event with ID: ${id}`);
  return res.status(200).json({ message: 'Event deleted successfully' });
} 