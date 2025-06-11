# Google Calendar OAuth Integration Setup Guide

This guide will help you set up secure Google Calendar integration using OAuth for the Moniteye intranet.

## 🚀 Overview

The new Google Calendar integration replaces the previous iCal URL approach with a secure OAuth-based system that:
- ✅ **Keeps calendars private** - no need to make calendars public
- ✅ **Secure authentication** - uses Google OAuth 2.0
- ✅ **Automatic token refresh** - seamless experience for users
- ✅ **Granular permissions** - only read calendar data
- ✅ **Revocable access** - employees can disconnect anytime

## 📋 Prerequisites

1. **Google Cloud Console Access** - You'll need admin access to create a Google Cloud project
2. **Supabase Database** - The system stores OAuth tokens securely in Supabase
3. **Environment Variables** - Configure OAuth credentials

## 🛠️ Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Calendar API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google Calendar API"
   - Click **Enable**

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **Internal** (if using Google Workspace) or **External**
3. Fill in required information:
   - **App name**: "Moniteye Team Calendar"
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **App domain**: Your domain (e.g., `moniteye.co.uk`)
   - **Authorized domains**: Add your domain
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: "Moniteye Calendar Integration"
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/google-calendar-callback` (for development)
     - `https://your-domain.com/api/google-calendar-callback` (for production)
5. Save and note down the **Client ID** and **Client Secret**

### Step 4: Set Up Database

Run the SQL migration to create the required table:

```sql
-- Run this in your Supabase SQL editor
-- (The content is in supabase-oauth-migration.sql)
```

### Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar-callback

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### Step 6: Deploy and Test

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the calendar page**: `http://localhost:3000/calendar`

3. **Test the OAuth flow**:
   - Click "Connect" next to any employee name
   - You'll be redirected to Google OAuth
   - Grant permissions
   - You'll be redirected back with success message

## 👥 Employee Instructions

### How to Connect Your Calendar

1. **Go to the Team Calendar page**
2. **Find your name** in the "Employee Calendars" section
3. **Click the "Connect" button** next to your name
4. **You'll be redirected to Google** to sign in and grant permissions
5. **Grant access** to:
   - View your calendar events
   - View your basic profile info
6. **You'll be redirected back** to the calendar page
7. **Your status will show "Connected"** ✅

### Permissions Granted

The integration only requests **read-only** access to:
- 📅 **Calendar events** (title, time, location)
- 👤 **Basic profile** (name, email for identification)
- 🔒 **No write access** - we cannot modify your calendar

### How to Disconnect

1. **Go to the Team Calendar page**
2. **Click "Disconnect"** next to your name
3. **Confirm the disconnection**
4. **Your calendar data will no longer be visible** to the team

You can also revoke access directly in your [Google Account settings](https://myaccount.google.com/permissions).

## 🔧 API Endpoints

The system provides these new API endpoints:

- **`/api/google-calendar-oauth`** - Initiate OAuth flow
- **`/api/google-calendar-callback`** - Handle OAuth callback
- **`/api/google-calendar-events`** - Fetch calendar events
- **`/api/employee-calendar-subscriptions`** - Manage subscriptions

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check your OAuth credentials in Google Cloud Console
   - Ensure redirect URI matches exactly (including protocol)

2. **"Calendar not showing as connected"**
   - Check browser console for errors
   - Verify environment variables are set correctly
   - Check Supabase database for token storage

3. **"No events showing"**
   - Verify the user has events in their calendar
   - Check if events are in the next 30 days
   - Confirm calendar permissions were granted

### Debug Mode

To see detailed logs, check:
- **Browser console** for frontend errors
- **Server logs** for API errors
- **Supabase logs** for database issues

## 🔐 Security Notes

- **Tokens are stored securely** in Supabase with RLS enabled
- **Refresh tokens** are used to maintain access without re-authentication
- **Scope is limited** to read-only calendar access
- **Users can revoke access** at any time through Google or the app

## 📱 Production Deployment

When deploying to production:

1. **Update OAuth credentials** with production domain
2. **Set production environment variables**
3. **Update CORS settings** if needed
4. **Test OAuth flow** on production domain
5. **Monitor token refresh** functionality

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review server and browser logs
3. Test with a different Google account
4. Contact the development team

---

**🎉 Once set up, your team will have secure, private calendar integration without compromising security!** 