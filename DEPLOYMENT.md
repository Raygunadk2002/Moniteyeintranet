# Vercel Deployment Guide

## Pre-Deployment Setup ✅

### 1. Fixed Configuration Issues
- ✅ Updated `postcss.config.js` to use `@tailwindcss/postcss` 
- ✅ Fixed `next.config.js` with proper CSS chunking and Vercel optimization
- ✅ Created `vercel.json` configuration
- ✅ Build successful with no errors

### 2. Environment Variables Required

Set these in your Vercel dashboard under Project Settings > Environment Variables:

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

## Deployment Steps

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### Option 2: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

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