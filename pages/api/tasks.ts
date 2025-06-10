import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: "Low" | "Medium" | "High" | "Critical";
  assignee?: string;
  tags?: string[];
  column_id: string;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

interface TaskColumn {
  id: string;
  title: string;
  order_index: number;
  tasks: Task[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch tasks and columns from Supabase
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('task_columns')
        .select('*')
        .order('order_index');

      if (columnsError) {
        console.error('Error fetching task columns:', columnsError);
        throw new Error(`Failed to fetch task columns: ${columnsError.message}`);
      }

      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .order('order_index');

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
      }

      // Group tasks by column
      const tasksData: TaskColumn[] = (columns || []).map(column => ({
        ...column,
        tasks: (tasks || []).filter(task => task.column_id === column.id)
      }));

      // Calculate task statistics
      const allTasks = tasks || [];
      
      // Open tasks are tasks not in "Done" column
      const openTasks = allTasks.filter(task => task.column_id !== 'done');
      const completedTasks = allTasks.filter(task => task.column_id === 'done');

      // Group by priority
      const priorityCounts = allTasks.reduce((acc, task) => {
        const priority = task.priority || 'Medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by column
      const columnCounts = tasksData.reduce((acc, column) => {
        acc[column.title] = column.tasks.length;
        return acc;
      }, {} as Record<string, number>);

      // Recent tasks (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentTasks = allTasks.filter(task => 
        new Date(task.created_at) >= sevenDaysAgo
      );

      res.status(200).json({
        total: allTasks.length,
        open: openTasks.length,
        completed: completedTasks.length,
        inProgress: allTasks.filter(task => task.column_id === 'in-progress').length,
        inReview: allTasks.filter(task => task.column_id === 'review').length,
        priorityCounts,
        columnCounts,
        recentTasks: recentTasks.length,
        completionRate: allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0,
        tasks: allTasks.map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          assignee: task.assignee,
          tags: task.tags,
          created_at: task.created_at,
          column: tasksData.find(col => col.id === task.column_id)?.title
        })),
        columns: tasksData
      });

    } else if (req.method === 'POST') {
      // Create a new task
      const { title, description, priority, assignee, tags, column_id } = req.body;

      if (!title || !column_id) {
        return res.status(400).json({ error: 'Title and column_id are required' });
      }

      // Generate a unique ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get the next order index for the column
      const { data: existingTasks } = await supabaseAdmin
        .from('tasks')
        .select('order_index')
        .eq('column_id', column_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingTasks && existingTasks.length > 0 
        ? existingTasks[0].order_index + 1 
        : 0;

      const { data: newTask, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          id: taskId,
          title,
          description,
          priority: priority || 'Medium',
          assignee,
          tags: tags || [],
          column_id,
          order_index: nextOrderIndex
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ error: `Failed to create task: ${error.message}` });
      }

      res.status(201).json(newTask);

    } else if (req.method === 'PUT') {
      // Update an existing task
      const { id, title, description, priority, assignee, tags, column_id, order_index } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (assignee !== undefined) updateData.assignee = assignee;
      if (tags !== undefined) updateData.tags = tags;
      if (column_id !== undefined) updateData.column_id = column_id;
      if (order_index !== undefined) updateData.order_index = order_index;

      const { data: updatedTask, error } = await supabaseAdmin
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return res.status(500).json({ error: `Failed to update task: ${error.message}` });
      }

      res.status(200).json(updatedTask);

    } else if (req.method === 'DELETE') {
      // Delete a task
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        return res.status(500).json({ error: `Failed to delete task: ${error.message}` });
      }

      res.status(200).json({ message: 'Task deleted successfully' });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Tasks API error:', error);
    console.log('Using fallback task data due to Supabase error');
    
    // Fallback task data when Supabase is unavailable
    const fallbackTasks = [
      {
        id: 'task-1',
        title: 'Review Q1 financial reports',
        priority: 'High',
        assignee: 'Sarah Chen',
        tags: ['finance', 'quarterly'],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        column: 'In Progress'
      },
      {
        id: 'task-2',
        title: 'Update client presentation slides',
        priority: 'Medium',
        assignee: 'Mike Johnson',
        tags: ['presentation', 'client'],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        column: 'To Do'
      },
      {
        id: 'task-3',
        title: 'Database backup and maintenance',
        priority: 'Critical',
        assignee: 'Alex Rodriguez',
        tags: ['maintenance', 'database'],
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        column: 'In Progress'
      },
      {
        id: 'task-4',
        title: 'Prepare monthly team meeting agenda',
        priority: 'Low',
        assignee: 'Emma Wilson',
        tags: ['meeting', 'agenda'],
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        column: 'Done'
      },
      {
        id: 'task-5',
        title: 'Code review for authentication module',
        priority: 'High',
        assignee: 'James Lee',
        tags: ['code-review', 'security'],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        column: 'In Review'
      },
      {
        id: 'task-6',
        title: 'Update user documentation',
        priority: 'Medium',
        assignee: 'Lisa Zhang',
        tags: ['documentation', 'user-guide'],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        column: 'To Do'
      },
      {
        id: 'task-7',
        title: 'Security audit compliance check',
        priority: 'Critical',
        assignee: 'David Park',
        tags: ['security', 'compliance'],
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        column: 'In Progress'
      },
      {
        id: 'task-8',
        title: 'Client feedback integration',
        priority: 'High',
        assignee: 'Rachel Kim',
        tags: ['feedback', 'client'],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        column: 'Done'
      }
    ];

    const fallbackColumns = [
      { id: 'todo', title: 'To Do', order_index: 0 },
      { id: 'in-progress', title: 'In Progress', order_index: 1 },
      { id: 'review', title: 'In Review', order_index: 2 },
      { id: 'done', title: 'Done', order_index: 3 }
    ];

    // Calculate statistics from fallback data
    const totalTasks = fallbackTasks.length;
    const openTasks = fallbackTasks.filter(task => task.column !== 'Done').length;
    const completedTasks = fallbackTasks.filter(task => task.column === 'Done').length;
    const inProgressTasks = fallbackTasks.filter(task => task.column === 'In Progress').length;
    const inReviewTasks = fallbackTasks.filter(task => task.column === 'In Review').length;

    const priorityCounts = fallbackTasks.reduce((acc, task) => {
      const priority = task.priority || 'Medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const columnCounts = fallbackTasks.reduce((acc, task) => {
      acc[task.column] = (acc[task.column] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent tasks (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTasksCount = fallbackTasks.filter(task => 
      new Date(task.created_at) >= sevenDaysAgo
    ).length;

    res.status(200).json({
      total: totalTasks,
      open: openTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      inReview: inReviewTasks,
      priorityCounts,
      columnCounts,
      recentTasks: recentTasksCount,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasks: fallbackTasks,
      columns: fallbackColumns.map(col => ({
        ...col,
        tasks: fallbackTasks.filter(task => task.column === col.title)
      })),
      error: error instanceof Error ? error.message : 'Failed to fetch task data',
      note: 'Using fallback data - Supabase connection unavailable'
    });
  }
} 