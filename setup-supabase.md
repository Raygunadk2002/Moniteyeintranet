# 🔧 Supabase Setup Guide

## Current Status
✅ `.env.local` file created with placeholders  
❌ Need to add your actual Supabase credentials  
❌ Need to run database schema  

## Step 1: Get Your Supabase Credentials

### If you don't have a Supabase account:
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up
3. Create a new project (it takes ~2 minutes to provision)

### If you have a Supabase account:
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)

### Get your credentials:
3. Navigate to **Settings** → **API**
4. Copy these three values:

```
Project URL: https://your-project-id.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 2: Update Your Environment File

Open `.env.local` and replace the placeholder values:

```env
# Replace these with your actual values:
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

## Step 3: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `database-schema.sql` file
4. Paste it in the SQL editor
5. Click **Run** to execute

This will create all the necessary tables:
- `upload_batches` - For revenue file uploads
- `invoices` - Individual invoice records  
- `revenue_data` - Monthly aggregated revenue
- `tasks` - Task management system
- `task_columns` - Kanban board columns

## Step 4: Restart Your Development Server

```bash
# Stop your current server (Ctrl+C)
npm run dev
```

## Step 5: Test the Connection

Visit: [http://localhost:3000/admin](http://localhost:3000/admin)

Click "Test Database" - you should see:
✅ **All database tables are ready!**

## Troubleshooting

### "TypeError: fetch failed"
- Double-check your Supabase URL and keys
- Make sure your Supabase project is active (not paused)
- Verify you're using the correct region URL

### "Tables not accessible"  
- Run the database schema in Supabase SQL Editor
- Check that your service_role key has the right permissions

### "Connection timeout"
- Your Supabase project might be paused (free tier pauses after inactivity)
- Go to your dashboard and check project status

## What This Enables

Once connected, you'll have:
- ✅ **Live Revenue Data**: Upload CSV files and see real revenue trends
- ✅ **Task Management**: Full Kanban board with real data persistence  
- ✅ **Data Analytics**: Revenue charts based on your actual data
- ✅ **Admin Tools**: Database management and data upload features

## Need Help?

The system works with fallback data even without Supabase, but for full functionality and data persistence, the database connection is essential.

Current test endpoint: [http://localhost:3000/api/test-supabase](http://localhost:3000/api/test-supabase) 