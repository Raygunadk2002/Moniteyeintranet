# Environment Variables Setup

## Overview
The Monitey Environmental Intranet uses environment variables for API integrations. All integrations have fallback data, so the application will work without configuration, but live data requires proper setup.

## Required Variables

### Supabase Database (Required for revenue data)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Optional Variables (Fallback data used if not configured)

### Pipedrive Integration
```env
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token_here
PIPEDRIVE_COMPANY_DOMAIN=your_company_domain
```
**Fallback**: Shows 27 deals worth £605,132 from realistic test data

### Timetastic Integration
```env
TIMETASTIC_API_TOKEN=your_timetastic_api_token_here
```
**Fallback**: Shows 2 upcoming holidays in 14 days, 3 in 30 days

### GitHub Integration
```env
GITHUB_TOKEN=your_github_token_here
```
**Fallback**: Basic project management features

## Setup Instructions

1. Copy this template to `.env.local` in your project root:
```bash
cp ENVIRONMENT_SETUP.md .env.local
# Edit .env.local with your actual values
```

2. For Vercel deployment, add these variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add each variable with its value

## Current Status

✅ **Application works without any environment variables** (uses fallback data)
✅ **Pipedrive API**: Graceful fallback to realistic test data
✅ **Tasks API**: Working with Supabase integration
✅ **Revenue API**: Working with Supabase integration
✅ **Holiday API**: Graceful fallback to test data

## Testing

Test API endpoints individually:
```bash
curl http://localhost:3000/api/pipedrive
curl http://localhost:3000/api/tasks
curl http://localhost:3000/api/revenue-data
 