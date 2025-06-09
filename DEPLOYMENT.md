# Vercel Deployment Guide

## Pre-Deployment Setup ✅

### 1. Fixed Configuration Issues
- ✅ Updated `postcss.config.js` to use `@tailwindcss/postcss` 
- ✅ Fixed `next.config.js` with proper CSS chunking and Vercel optimization
- ✅ Created `vercel.json` configuration
- ✅ Build successful with no errors

### 2. Environment Variables Setup

**IMPORTANT:** Set these environment variables directly in your Vercel project dashboard under **Project Settings > Environment Variables**. Do NOT create them as secrets.

**Required Environment Variables:**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# External API Keys
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token
TIMETASTIC_ACCESS_TOKEN=your_timetastic_access_token

# Environment
NODE_ENV=production
```

### 3. Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable with its corresponding value
4. Select environment scope: **Production**, **Preview**, and **Development**
5. Click **Save**

## Deployment Steps

### Option 1: Vercel CLI (Fastest)
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option 2: GitHub Integration
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure the environment variables in project settings (see above)
5. Deploy

### Option 3: Deploy via Vercel Dashboard
1. Go to Vercel dashboard
2. Click **"Add New..."** > **"Project"**
3. Import from GitHub
4. Set environment variables
5. Deploy

## ✅ Build Verification

Your build should now succeed! The configuration fixes include:

- **PostCSS Issues**: Fixed TailwindCSS plugin configuration
- **Next.js Optimization**: Standalone output for Vercel
- **Environment Variables**: Properly configured for Vercel deployment
- **API Routes**: Optimized timeout settings

## 🚀 Post-Deployment

After successful deployment, verify:

1. **Dashboard loads** at your Vercel URL
2. **Environment variables** are properly set
3. **API endpoints** are functioning
4. **Database connections** to Supabase work
5. **External integrations** (Pipedrive, Timetastic) connect properly

## 🔧 Troubleshooting

If deployment fails:

1. **Check environment variables** are set correctly
2. **Verify Supabase connection** in project settings
3. **Review build logs** in Vercel dashboard
4. **Test locally** with `npm run build` first

Your project is now ready for production deployment on Vercel! 🎉

## Post-Deployment

### 1. Database Setup
After deployment, visit `/admin` to:
- Test Supabase connection
- Upload revenue data
- Verify all API endpoints

### 2. API Endpoints to Test
- `/api/dashboard-metrics` - Dashboard data
- `/api/pipedrive` - Pipeline data  
- `/api/timetastic` - Holiday data
- `/api/revenue-data` - Revenue charts

### 3. Pages to Verify
- `/` - Dashboard
- `/calendar` - Holiday calendar
- `/tasks` - Task management
- `/admin` - Admin interface

## Build Output Summary
```
Route (pages)                             Size     First Load JS
┌ ○ /                                     5.32 kB        85.3 kB
├ ○ /admin                                4.31 kB        84.3 kB
├ ○ /calendar                             83.7 kB         164 kB
├ ○ /tasks                                33.6 kB         114 kB
└ ƒ /api/*                               23 API routes
```

## Troubleshooting

### Common Issues
1. **Build Errors**: Check environment variables are set
2. **API Failures**: Verify Supabase and API keys are correct
3. **Styling Issues**: Ensure TailwindCSS is loading properly

### Debug Mode
Set `NODE_ENV=development` temporarily to see detailed error logs.

## Performance Optimizations Applied
- ✅ CSS chunking enabled
- ✅ SWC minification 
- ✅ Static generation where possible
- ✅ API route optimization (30s timeout)
- ✅ Standalone output for better performance 