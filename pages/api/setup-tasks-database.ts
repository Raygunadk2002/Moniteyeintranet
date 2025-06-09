import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Setting up tasks database tables...');

    // First, create the task_columns table and insert default columns
    const { error: columnsError } = await supabaseAdmin
      .from('task_columns')
      .upsert([
        { id: 'backlog', title: '📋 Backlog', order_index: 0 },
        { id: 'todo', title: '📝 To Do', order_index: 1 },
        { id: 'in-progress', title: '🔄 In Progress', order_index: 2 },
        { id: 'review', title: '👀 Review', order_index: 3 },
        { id: 'done', title: '✅ Done', order_index: 4 }
      ], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (columnsError) {
      console.error('Error setting up task columns:', columnsError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to setup task columns: ${columnsError.message}` 
      });
    }

    // Check if we already have tasks in the database
    const { data: existingTasks, error: checkError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing tasks:', checkError);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to check existing tasks: ${checkError.message}` 
      });
    }

    // Only insert sample tasks if none exist
    if (!existingTasks || existingTasks.length === 0) {
      const sampleTasks = [
        {
          id: 'task-1',
          title: 'System Performance Audit',
          description: 'Complete comprehensive review of system performance metrics and identify bottlenecks',
          priority: 'High',
          assignee: 'Alex K.',
          tags: ['performance', 'audit'],
          column_id: 'backlog',
          order_index: 0
        },
        {
          id: 'task-2',
          title: 'Update Security Protocols',
          description: 'Review and update all security protocols according to latest compliance standards',
          priority: 'Medium',
          assignee: 'Sarah M.',
          tags: ['security', 'compliance'],
          column_id: 'backlog',
          order_index: 1
        },
        {
          id: 'task-3',
          title: 'Database Optimization',
          description: 'Optimize database queries and indexing for better performance',
          priority: 'Low',
          assignee: 'Mike R.',
          tags: ['database', 'optimization'],
          column_id: 'todo',
          order_index: 0
        },
        {
          id: 'task-4',
          title: 'API Integration',
          description: 'Integrate third-party payment gateway API',
          priority: 'Critical',
          assignee: 'Jessica L.',
          tags: ['api', 'payment'],
          column_id: 'in-progress',
          order_index: 0
        },
        {
          id: 'task-5',
          title: 'User Authentication',
          description: 'Implement secure user authentication system',
          priority: 'High',
          assignee: 'David C.',
          tags: ['auth', 'security'],
          column_id: 'done',
          order_index: 0
        }
      ];

      const { error: tasksError } = await supabaseAdmin
        .from('tasks')
        .insert(sampleTasks);

      if (tasksError) {
        console.error('Error inserting sample tasks:', tasksError);
        return res.status(500).json({ 
          success: false, 
          error: `Failed to insert sample tasks: ${tasksError.message}` 
        });
      }

      console.log('Sample tasks inserted successfully');
    } else {
      console.log('Tasks already exist, skipping sample data insertion');
    }

    // Verify the setup by fetching the data
    const { data: columns } = await supabaseAdmin
      .from('task_columns')
      .select('*')
      .order('order_index');

    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .order('order_index');

    res.status(200).json({
      success: true,
      message: 'Tasks database setup completed successfully',
      columns: columns?.length || 0,
      tasks: tasks?.length || 0,
      data: {
        columns,
        tasks
      }
    });

  } catch (error) {
    console.error('Setup tasks database error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup tasks database'
    });
  }
} 