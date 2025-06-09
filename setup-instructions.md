# Supabase Database Setup Instructions

## Issue: Policy Already Exists Error
If you're getting the error: `ERROR: 42710: policy "Enable read access for authenticated users" for table "upload_batches" already exists`, this means you have partial database setup.

## Quick Fix Steps:

### 1. Go to your Supabase Dashboard
- Navigate to: https://supabase.com/dashboard
- Select your project

### 2. Go to SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Run the Updated Schema
Copy and paste the entire content from `database-schema.sql` (which has been updated to handle existing policies).

The updated schema includes:
```sql
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON upload_batches;
-- ... (continues with all policies)
```

### 4. Execute the SQL
- Click "Run" to execute the SQL
- This will safely recreate all tables, policies, and permissions

### 5. Test the Setup
- Return to your admin page at http://localhost:3000/admin
- Click "Test Database" to verify everything is working

## Environment Variables
Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## What the Schema Creates:
- **upload_batches**: Stores file upload metadata
- **invoices**: Stores individual invoice records  
- **revenue_data**: Stores aggregated monthly revenue data
- **Proper RLS policies**: For secure authenticated access
- **Indexes**: For better query performance
- **Triggers**: For automatic timestamp updates

## After Setup:
Your upload revenue functionality should work properly without the "policy already exists" errors. 