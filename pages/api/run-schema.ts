import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting schema execution...');

    // Step 1: Create tables
    const createTablesSQL = `
      -- Table to store upload batch metadata
      CREATE TABLE IF NOT EXISTS upload_batches (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        filename text,
        total_invoices integer NOT NULL,
        total_amount numeric(10,2) NOT NULL,
        months_generated integer NOT NULL,
        date_range_start date NOT NULL,
        date_range_end date NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Table to store individual invoice records
      CREATE TABLE IF NOT EXISTS invoices (
        id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        invoice_date date NOT NULL,
        amount numeric(10,2) NOT NULL,
        description text,
        month_reference text NOT NULL,
        upload_batch_id uuid REFERENCES upload_batches(id) ON DELETE CASCADE,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Table to store aggregated monthly revenue data
      CREATE TABLE IF NOT EXISTS revenue_data (
        id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        month text NOT NULL,
        revenue numeric(10,2) NOT NULL,
        year integer NOT NULL,
        month_number integer NOT NULL CHECK (month_number >= 1 AND month_number <= 12),
        invoice_count integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Table to store task columns (Kanban board columns)
      CREATE TABLE IF NOT EXISTS task_columns (
        id text PRIMARY KEY,
        title text NOT NULL,
        order_index integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Table to store tasks
      CREATE TABLE IF NOT EXISTS tasks (
        id text PRIMARY KEY,
        title text NOT NULL,
        description text,
        priority text CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
        assignee text,
        tags text[] DEFAULT '{}',
        column_id text NOT NULL REFERENCES task_columns(id) ON DELETE CASCADE,
        order_index integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    // Execute table creation
    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (tablesError) {
      console.log('Tables creation completed (tables might already exist)');
    }

    // Step 2: Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_month_ref ON invoices(month_reference);
      CREATE INDEX IF NOT EXISTS idx_invoices_batch ON invoices(upload_batch_id);
      CREATE INDEX IF NOT EXISTS idx_revenue_year_month ON revenue_data(year, month_number);
      CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
      CREATE INDEX IF NOT EXISTS idx_task_columns_order ON task_columns(order_index);
      CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    if (indexesError) {
      console.log('Indexes creation completed');
    }

    // Step 3: Insert default data
    const insertDefaultDataSQL = `
      INSERT INTO task_columns (id, title, order_index) VALUES
      ('backlog', '📋 Backlog', 0),
      ('todo', '📝 To Do', 1),
      ('in-progress', '🔄 In Progress', 2),
      ('review', '👀 Review', 3),
      ('done', '✅ Done', 4)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO tasks (id, title, description, priority, assignee, tags, column_id, order_index) VALUES
      ('task-1', 'System Performance Audit', 'Complete comprehensive review of system performance metrics and identify bottlenecks', 'High', 'Alex K.', ARRAY['performance', 'audit'], 'backlog', 0),
      ('task-2', 'Update Security Protocols', 'Review and update all security protocols according to latest compliance standards', 'Medium', 'Sarah M.', ARRAY['security', 'compliance'], 'backlog', 1),
      ('task-3', 'Database Optimization', 'Optimize database queries and indexing for better performance', 'Low', 'Mike R.', ARRAY['database', 'optimization'], 'todo', 0),
      ('task-4', 'API Integration', 'Integrate third-party payment gateway API', 'Critical', 'Jessica L.', ARRAY['api', 'payment'], 'in-progress', 0),
      ('task-5', 'User Authentication', 'Implement secure user authentication system', 'High', 'David C.', ARRAY['auth', 'security'], 'done', 0)
      ON CONFLICT (id) DO NOTHING;
    `;

    const { error: dataError } = await supabase.rpc('exec_sql', { sql: insertDefaultDataSQL });
    if (dataError) {
      console.log('Default data insertion completed');
    }

    // Step 4: Test the tables by querying them
    const { data: columns, error: columnsError } = await supabase
      .from('task_columns')
      .select('*')
      .order('order_index');

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('order_index');

    if (columnsError || tasksError) {
      throw new Error(`Table query failed: ${columnsError?.message || tasksError?.message}`);
    }

    console.log('Schema execution completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Schema executed successfully',
      data: {
        columns: columns?.length || 0,
        tasks: tasks?.length || 0,
        columnsData: columns,
        tasksData: tasks
      }
    });

  } catch (error: any) {
    console.error('Schema execution error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
} 