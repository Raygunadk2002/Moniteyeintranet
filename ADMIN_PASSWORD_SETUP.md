# Master Admin Password Setup

This document explains how to set up and use the master admin password system to protect sensitive business modules.

## Overview

The Moniteye intranet now has two levels of authentication:
1. **Site Password**: Protects the entire site from unauthorized access
2. **Master Admin Password**: Protects sensitive business and administrative modules

## Protected Modules

The following modules require master admin authentication:
- **Business Ideas**: Business planning and revenue modeling tools
- **Admin Dashboard**: Database management and system administration

## Environment Setup

### For Development (Local)
Add to your `.env.local` file:
```
ADMIN_PASSWORD=your-secure-admin-password
```

### For Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new environment variable:
   - **Name**: `ADMIN_PASSWORD`
   - **Value**: `your-secure-admin-password`
   - **Environment**: Production (and Preview if needed)

## Recommended Password

For production use, we recommend:
```
ADMIN_PASSWORD=MoniteyeAdmin2025!
```

## How It Works

### Navigation Hiding
- Business Ideas and Admin links are automatically hidden from the sidebar navigation for non-admin users
- Links only appear once a user has successfully authenticated with the master admin password

### Access Control
- When a user tries to access `/admin` or `/business-ideas`, they see a restricted access screen
- Users can click "Request Admin Access" to enter the admin password
- Successful authentication grants access for 4 hours
- Admin sessions automatically expire for security

### Session Management
- Admin authentication is stored in localStorage with timestamp
- Sessions expire after 4 hours of inactivity
- Users can manually logout from admin mode using the "Logout Admin" button
- Navigation links disappear when admin session expires

## Security Features

1. **Time-based Expiry**: Admin sessions expire after 4 hours
2. **Separate Authentication**: Independent from site-wide password
3. **Visual Indicators**: Clear admin status indicators when authenticated
4. **Manual Logout**: Users can manually end admin sessions
5. **Automatic Cleanup**: Expired sessions are automatically removed

## Usage Instructions

### For Regular Users
- Regular users will not see Business Ideas or Admin links in navigation
- If they manually navigate to protected URLs, they'll see a restricted access screen
- They can request admin access if they have the password

### For Admin Users
1. Navigate to a protected module (or click the link if already authenticated)
2. Click "Request Admin Access" on the restricted screen
3. Enter the master admin password
4. Access is granted for 4 hours
5. Admin status indicator appears at the top of protected pages
6. Use "Logout Admin" to manually end the session

## API Endpoints

- `POST /api/auth/admin-login`: Validates admin password
- Admin authentication is handled client-side with localStorage

## Troubleshooting

### Admin Links Not Showing
- Check if admin authentication has expired (4-hour limit)
- Clear localStorage and re-authenticate: `localStorage.clear()`

### Cannot Access Admin Modules
- Verify `ADMIN_PASSWORD` environment variable is set correctly
- Check browser console for authentication errors
- Ensure you're using the correct password

### Environment Variable Issues
- For Vercel: Redeploy after adding environment variables
- For local development: Restart your development server after adding to `.env.local`

## Default Passwords (Change These!)

If no environment variable is set, the system uses these defaults:
- Development: `admin123`
- **⚠️ Change these defaults for production use!**

## Security Best Practices

1. Use strong, unique passwords for both site and admin access
2. Regularly rotate admin passwords
3. Don't share admin passwords in plain text
4. Monitor admin access logs if needed
5. Keep admin sessions as short as practical

## Integration with Existing Site Password

This system works alongside the existing site-wide password protection:
1. Users first authenticate with site password (`SITE_PASSWORD`)
2. Then authenticate with admin password (`ADMIN_PASSWORD`) for sensitive modules
3. Both systems are independent and can use different passwords 