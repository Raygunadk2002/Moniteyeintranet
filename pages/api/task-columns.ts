import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

interface TaskColumn {
  id: string;
  title: string;
  order_index: number;
  created_at?: Date;
  updated_at?: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch all task columns
      const { data: columns, error } = await supabaseAdmin
        .from('task_columns')
        .select('*')
        .order('order_index');

      if (error) {
        console.error('Error fetching task columns:', error);
        return res.status(500).json({ error: `Failed to fetch task columns: ${error.message}` });
      }

      res.status(200).json(columns || []);

    } else if (req.method === 'POST') {
      // Create a new column
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Generate a unique ID
      const columnId = `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get the next order index
      const { data: existingColumns } = await supabaseAdmin
        .from('task_columns')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingColumns && existingColumns.length > 0 
        ? existingColumns[0].order_index + 1 
        : 0;

      const { data: newColumn, error } = await supabaseAdmin
        .from('task_columns')
        .insert({
          id: columnId,
          title,
          order_index: nextOrderIndex
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating column:', error);
        return res.status(500).json({ error: `Failed to create column: ${error.message}` });
      }

      res.status(201).json(newColumn);

    } else if (req.method === 'PUT') {
      // Update an existing column
      const { id, title, order_index } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Column ID is required' });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (order_index !== undefined) updateData.order_index = order_index;
      updateData.updated_at = new Date();

      const { data: updatedColumn, error } = await supabaseAdmin
        .from('task_columns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating column:', error);
        return res.status(500).json({ error: `Failed to update column: ${error.message}` });
      }

      res.status(200).json(updatedColumn);

    } else if (req.method === 'DELETE') {
      // Delete a column and all its tasks
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Column ID is required' });
      }

      // First delete all tasks in the column
      const { error: tasksError } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('column_id', id);

      if (tasksError) {
        console.error('Error deleting tasks in column:', tasksError);
        return res.status(500).json({ error: `Failed to delete tasks in column: ${tasksError.message}` });
      }

      // Then delete the column
      const { error: columnError } = await supabaseAdmin
        .from('task_columns')
        .delete()
        .eq('id', id);

      if (columnError) {
        console.error('Error deleting column:', columnError);
        return res.status(500).json({ error: `Failed to delete column: ${columnError.message}` });
      }

      res.status(200).json({ message: 'Column and all its tasks deleted successfully' });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }

  } catch (error: any) {
    console.error('Task columns API error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
} 