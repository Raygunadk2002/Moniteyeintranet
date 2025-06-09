"use strict";(()=>{var e={};e.id=360,e.ids=[360],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,i){return i in t?t[i]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,i)):"function"==typeof t&&"default"===i?t:void 0}}})},502:(e,t,i)=>{i.r(t),i.d(t,{config:()=>m,default:()=>d,routeModule:()=>u});var a={};i.r(a),i.d(a,{default:()=>c});var o=i(1802),n=i(7153),r=i(6249),s=i(6137);async function c(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});try{console.log("Starting schema execution...");let e=`
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
    `,{error:i}=await s.OQ.rpc("exec_sql",{sql:e});i&&console.log("Tables creation completed (tables might already exist)");let a=`
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_month_ref ON invoices(month_reference);
      CREATE INDEX IF NOT EXISTS idx_invoices_batch ON invoices(upload_batch_id);
      CREATE INDEX IF NOT EXISTS idx_revenue_year_month ON revenue_data(year, month_number);
      CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
      CREATE INDEX IF NOT EXISTS idx_task_columns_order ON task_columns(order_index);
      CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);
    `,{error:o}=await s.OQ.rpc("exec_sql",{sql:a});o&&console.log("Indexes creation completed");let n=`
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
    `,{error:r}=await s.OQ.rpc("exec_sql",{sql:n});r&&console.log("Default data insertion completed");let{data:c,error:d}=await s.OQ.from("task_columns").select("*").order("order_index"),{data:m,error:u}=await s.OQ.from("tasks").select("*").order("order_index");if(d||u)throw Error(`Table query failed: ${d?.message||u?.message}`);return console.log("Schema execution completed successfully"),t.status(200).json({success:!0,message:"Schema executed successfully",data:{columns:c?.length||0,tasks:m?.length||0,columnsData:c,tasksData:m}})}catch(e){return console.error("Schema execution error:",e),t.status(500).json({success:!1,error:e.message,details:e})}}let d=(0,r.l)(a,"default"),m=(0,r.l)(a,"config"),u=new o.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/run-schema",pathname:"/api/run-schema",bundlePath:"",filename:""},userland:a})},6137:(e,t,i)=>{i.d(t,{OQ:()=>r,pR:()=>s});let a=require("@supabase/supabase-js"),o="https://tfskdfkzhqiiamziggoB.supabase.co",n=process.env.SUPABASE_SERVICE_ROLE_KEY,r=(0,a.createClient)(o,"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc2tkZmt6aHFpaWFtemlnZ29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Nzc3ODksImV4cCI6MjA2NTA1Mzc4OX0.wUR1GCbNEMrjcVRNG0l03Y0uXDgxd1y7wfAIGxSz5kA",{auth:{autoRefreshToken:!0,persistSession:!0},global:{fetch:(e,t={})=>fetch(e,{...t,signal:AbortSignal.timeout(3e4)})}}),s=(0,a.createClient)(o,n,{auth:{autoRefreshToken:!1,persistSession:!1},global:{fetch:(e,t={})=>fetch(e,{...t,signal:AbortSignal.timeout(45e3)})}})},7153:(e,t)=>{var i;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return i}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(i||(i={}))},1802:(e,t,i)=>{e.exports=i(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var i=t(t.s=502);module.exports=i})();