"use strict";(()=>{var e={};e.id=525,e.ids=[525],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,s){return s in t?t[s]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,s)):"function"==typeof t&&"default"===s?t:void 0}}})},4513:(e,t,s)=>{s.r(t),s.d(t,{config:()=>d,default:()=>u,routeModule:()=>E});var a={};s.r(a),s.d(a,{default:()=>c});var i=s(1802),r=s(7153),o=s(6249),n=s(6137);async function c(e,t){if("POST"!==e.method)return t.status(405).json({message:"Method not allowed"});try{console.log("Creating tasks tables...");let e=`
      CREATE TABLE IF NOT EXISTS task_columns (
        id text PRIMARY KEY,
        title text NOT NULL,
        order_index integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `,{error:s}=await n.pR.rpc("execute_sql",{sql:e});if(s){console.log("Trying alternative method to create tables...");let{error:e}=await n.pR.from("task_columns").upsert([{id:"backlog",title:"\uD83D\uDCCB Backlog",order_index:0},{id:"todo",title:"\uD83D\uDCDD To Do",order_index:1},{id:"in-progress",title:"\uD83D\uDD04 In Progress",order_index:2},{id:"review",title:"\uD83D\uDC40 Review",order_index:3},{id:"done",title:"✅ Done",order_index:4}],{onConflict:"id"});if(e)return t.status(500).json({success:!1,error:`Database setup failed. You need to run the schema manually in Supabase SQL editor. Error: ${e.message}`,schema:`
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
          `})}let{data:a,error:i}=await n.pR.from("task_columns").select("*").limit(1);if(i)return t.status(500).json({success:!1,error:`Tables may not have been created properly. Please run the schema manually in Supabase SQL editor. Error: ${i.message}`,testError:i});t.status(200).json({success:!0,message:"Tasks database schema executed successfully",tablesCreated:!0,columnsFound:a?.length||0})}catch(e){console.error("Execute schema error:",e),t.status(500).json({success:!1,error:e instanceof Error?e.message:"Failed to execute schema"})}}let u=(0,o.l)(a,"default"),d=(0,o.l)(a,"config"),E=new i.PagesAPIRouteModule({definition:{kind:r.x.PAGES_API,page:"/api/execute-schema",pathname:"/api/execute-schema",bundlePath:"",filename:""},userland:a})},6137:(e,t,s)=>{s.d(t,{OQ:()=>o,pR:()=>n});let a=require("@supabase/supabase-js"),i="https://tfskdfkzhqiiamziggoB.supabase.co",r=process.env.SUPABASE_SERVICE_ROLE_KEY,o=(0,a.createClient)(i,"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc2tkZmt6aHFpaWFtemlnZ29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Nzc3ODksImV4cCI6MjA2NTA1Mzc4OX0.wUR1GCbNEMrjcVRNG0l03Y0uXDgxd1y7wfAIGxSz5kA",{auth:{autoRefreshToken:!0,persistSession:!0},global:{fetch:(e,t={})=>fetch(e,{...t,signal:AbortSignal.timeout(3e4)})}}),n=(0,a.createClient)(i,r,{auth:{autoRefreshToken:!1,persistSession:!1},global:{fetch:(e,t={})=>fetch(e,{...t,signal:AbortSignal.timeout(45e3)})}})},7153:(e,t)=>{var s;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return s}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(s||(s={}))},1802:(e,t,s)=>{e.exports=s(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var s=t(t.s=4513);module.exports=s})();