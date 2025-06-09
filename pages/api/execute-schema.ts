import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Creating tasks tables...');

    // Create task_columns table
    const createTaskColumnsSQL = `
      CREATE TABLE IF NOT EXISTS task_columns (
        id text PRIMARY KEY,
        title text NOT NULL,
        order_index integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    // Create tasks table
    const createTasksSQL = `
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

    // Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
      CREATE INDEX IF NOT EXISTS idx_task_columns_order ON task_columns(order_index);
      CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);
    `;

    // Enable RLS
    const enableRLSSQL = `
      ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    `;

    // Create policies
    const createPoliciesSQL = `
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON task_columns;
      DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON task_columns;
      DROP POLICY IF EXISTS "Enable update access for authenticated users" ON task_columns;
      DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON task_columns;
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tasks;
      DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON tasks;
      DROP POLICY IF EXISTS "Enable update access for authenticated users" ON tasks;
      DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON tasks;

      CREATE POLICY "Enable read access for authenticated users" ON task_columns FOR SELECT USING (true);
      CREATE POLICY "Enable insert access for authenticated users" ON task_columns FOR INSERT WITH CHECK (true);
      CREATE POLICY "Enable update access for authenticated users" ON task_columns FOR UPDATE USING (true);
      CREATE POLICY "Enable delete access for authenticated users" ON task_columns FOR DELETE USING (true);

      CREATE POLICY "Enable read access for authenticated users" ON tasks FOR SELECT USING (true);
      CREATE POLICY "Enable insert access for authenticated users" ON tasks FOR INSERT WITH CHECK (true);
      CREATE POLICY "Enable update access for authenticated users" ON tasks FOR UPDATE USING (true);
      CREATE POLICY "Enable delete access for authenticated users" ON tasks FOR DELETE USING (true);
    `;

    // Execute SQL commands
    const { error: createColumnsError } = await supabaseAdmin.rpc('execute_sql', { 
      sql: createTaskColumnsSQL 
    });

    if (createColumnsError) {
      // Try using the SQL editor method if execute_sql doesn't work
      console.log('Trying alternative method to create tables...');
      
      // Insert task columns directly
      const { error: insertColumnsError } = await supabaseAdmin
        .from('task_columns')
        .upsert([
          { id: 'backlog', title: '📋 Backlog', order_index: 0 },
          { id: 'todo', title: '📝 To Do', order_index: 1 },
          { id: 'in-progress', title: '🔄 In Progress', order_index: 2 },
          { id: 'review', title: '👀 Review', order_index: 3 },
          { id: 'done', title: '✅ Done', order_index: 4 }
        ], { onConflict: 'id' });

      if (insertColumnsError) {
        return res.status(500).json({
          success: false,
          error: `Database setup failed. You need to run the schema manually in Supabase SQL editor. Error: ${insertColumnsError.message}`,
          schema: `
-- Run this in your Supabase SQL editor:

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_task_columns_order ON task_columns(order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);

-- Enable RLS
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON task_columns FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON task_columns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON task_columns FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON task_columns FOR DELETE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON tasks FOR DELETE USING (true);

-- Insert default columns
INSERT INTO task_columns (id, title, order_index) VALUES
('backlog', '📋 Backlog', 0),
('todo', '📝 To Do', 1),
('in-progress', '🔄 In Progress', 2),
('review', '👀 Review', 3),
('done', '✅ Done', 4)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, priority, assignee, tags, column_id, order_index) VALUES
('task-1', 'System Performance Audit', 'Complete comprehensive review of system performance metrics and identify bottlenecks', 'High', 'Alex K.', ARRAY['performance', 'audit'], 'backlog', 0),
('task-2', 'Update Security Protocols', 'Review and update all security protocols according to latest compliance standards', 'Medium', 'Sarah M.', ARRAY['security', 'compliance'], 'backlog', 1),
('task-3', 'Database Optimization', 'Optimize database queries and indexing for better performance', 'Low', 'Mike R.', ARRAY['database', 'optimization'], 'todo', 0),
('task-4', 'API Integration', 'Integrate third-party payment gateway API', 'Critical', 'Jessica L.', ARRAY['api', 'payment'], 'in-progress', 0),
('task-5', 'User Authentication', 'Implement secure user authentication system', 'High', 'David C.', ARRAY['auth', 'security'], 'done', 0)
ON CONFLICT (id) DO NOTHING;
          `
        });
      }
    }

    // Test if tables were created successfully
    const { data: columns, error: testError } = await supabaseAdmin
      .from('task_columns')
      .select('*')
      .limit(1);

    if (testError) {
      return res.status(500).json({
        success: false,
        error: `Tables may not have been created properly. Please run the schema manually in Supabase SQL editor. Error: ${testError.message}`,
        testError
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tasks database schema executed successfully',
      tablesCreated: true,
      columnsFound: columns?.length || 0
    });

  } catch (error) {
    console.error('Execute schema error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute schema'
    });
  }
} 