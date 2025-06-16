import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

interface EquipmentNote {
  id: string;
  serial_number: string; // Primary reference to equipment
  equipment_id: string | null; // Optional backward compatibility
  note_text: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { serial_number, equipment_id } = req.query;
      
      let query = supabaseAdmin
        .from('equipment_notes')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by serial_number (preferred) or equipment_id (backward compatibility)
      if (serial_number) {
        query = query.eq('serial_number', serial_number);
      } else if (equipment_id) {
        query = query.eq('equipment_id', equipment_id);
      }

      const { data: notes, error } = await query;

      if (error) {
        console.error('Notes fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      return res.status(200).json(notes || []);
    } catch (error) {
      console.error('Notes API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { serial_number, equipment_id, note_text, author } = req.body;

      // Validate required fields
      if (!serial_number || !note_text) {
        return res.status(400).json({ 
          error: 'Serial number and note text are required' 
        });
      }

      // Verify equipment exists
      const { data: equipment, error: equipmentError } = await supabaseAdmin
        .from('equipment_inventory')
        .select('serial_number, equipment_id')
        .eq('serial_number', serial_number)
        .single();

      if (equipmentError || !equipment) {
        return res.status(404).json({ 
          error: 'Equipment not found with this serial number' 
        });
      }

      const noteData = {
        serial_number,
        equipment_id: equipment_id || equipment.equipment_id, // Use provided or fetch from equipment
        note_text,
        author: author || 'System User'
      };

      const { data, error } = await supabaseAdmin
        .from('equipment_notes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        console.error('Note creation error:', error);
        return res.status(500).json({ error: 'Failed to create note' });
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error('Note creation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, note_text, author } = req.body;

      if (!id || !note_text) {
        return res.status(400).json({ 
          error: 'Note ID and text are required' 
        });
      }

      const { data, error } = await supabaseAdmin
        .from('equipment_notes')
        .update({ 
          note_text, 
          author: author || 'System User',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Note update error:', error);
        return res.status(500).json({ error: 'Failed to update note' });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Note update error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Note ID is required' });
      }

      const { error } = await supabaseAdmin
        .from('equipment_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Note deletion error:', error);
        return res.status(500).json({ error: 'Failed to delete note' });
      }

      return res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Note deletion error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 