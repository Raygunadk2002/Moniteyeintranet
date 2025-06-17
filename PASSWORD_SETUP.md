# Password Protection Setup

The Moniteye Intranet now has password protection enabled for the entire site.

## How It Works

- All pages are protected by a single password
- Users must enter the correct password to access any part of the site
- Authentication is stored in a secure cookie that expires after 24 hours
- Users can logout using the door icon (🚪) in the sidebar

## Setting the Password

### Option 1: Environment Variable (Recommended)
Add this to your `.env.local` file or Vercel environment variables:
```
SITE_PASSWORD=your_secure_password_here
```

### Option 2: Default Password
If no environment variable is set, the default password is: `moniteye2024`

## For Vercel Deployment

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add a new variable:
   - **Name**: `SITE_PASSWORD`
   - **Value**: Your desired password
   - **Environment**: Production (and Preview if needed)
5. Redeploy your application

## Security Features

- ✅ Cookie-based authentication
- ✅ Secure cookie settings (httpOnly, secure, sameSite)
- ✅ 24-hour session timeout
- ✅ Logout functionality
- ✅ Protected API routes
- ✅ Middleware-based protection (runs on all requests)

## Files Added/Modified

- `middleware.ts` - Main authentication logic
- `pages/login.tsx` - Login page
- `pages/api/auth/login.ts` - Login API
- `pages/api/auth/logout.ts` - Logout API
- `components/Layout.tsx` - Added logout button

## Testing

1. Try accessing any page - you should be redirected to `/login`
2. Enter the correct password - you should be logged in
3. Try accessing pages - they should work normally
4. Click the logout button - you should be redirected back to login
5. Try accessing pages after logout - you should be redirected to login again 