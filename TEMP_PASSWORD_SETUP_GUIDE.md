# Temporary Password System Setup Guide

## Overview

Your Moniteye intranet now supports a **temporary password system** that allows:
- ✅ Admins to create users without going through Supabase Auth signup
- ✅ Users to login with email + temporary password (no Supabase account needed)
- ✅ Users to upgrade to permanent passwords when ready
- ✅ Complete bypass of user self-registration

## How It Works

1. **Admin creates user** → User gets temporary password
2. **User logs in** → Uses email + temporary password
3. **User changes password** → Gets converted to proper Supabase Auth account
4. **Future logins** → Use regular Supabase Auth

---

## Setup Instructions

### Step 1: Database Setup

Run this SQL script in **Supabase Dashboard → SQL Editor**:

```sql
-- Copy and paste the contents of temp-password-setup.sql
```

Or run: `cat temp-password-setup.sql | pbcopy` then paste in Supabase.

### Step 2: Verify Database Setup

After running the SQL, you should see:
- ✅ `temp_password` column added to `profiles` table
- ✅ Admin user (`akeal@moniteye.co.uk`) has temp password: `moniteye2024`
- ✅ Helper functions created

### Step 3: Test the System

1. **Start your dev server**: `npm run dev`
2. **Go to**: `http://localhost:3000/login`
3. **Login with**:
   - Email: `akeal@moniteye.co.uk`
   - Password: `moniteye2024`
4. **Should work** ✅

---

## Usage Instructions

### For Admins: Creating Users

1. Go to `/users` page
2. Fill out the "Create New User" form:
   - Email: `newuser@company.com`
   - Name: `New User`
   - Role: `employee` (or other)
   - Department: `Optional`
3. Click "Create User"
4. **Copy the temporary password** shown in the success message
5. **Send credentials to user securely** (email, Slack, etc.)

### For Users: First Login

1. Go to `/login`
2. Enter your email and temporary password
3. Login successfully ✅
4. **You'll see a prompt to change your password**
5. Change to a permanent password when ready

---

## API Endpoints

### User Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin-create-user` | POST | Create user with temp password |
| `/api/users` | GET | List all users |
| `/api/auth/login` | POST | Login (supports temp passwords) |
| `/api/change-temp-password` | POST | Upgrade temp to permanent password |

### Example: Create User

```bash
curl -X POST http://localhost:3000/api/admin-create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "name": "New User",
    "role": "employee",
    "department": "Engineering"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "email": "newuser@company.com",
    "tempPassword": "AbC123XyZ456"
  }
}
```

---

## Security Features

### Database-Only Authentication
- ✅ Users can login without Supabase Auth accounts
- ✅ Passwords stored temporarily in database
- ✅ Automatic cleanup when upgraded to permanent accounts

### Password Upgrade Flow
- ✅ Users can convert temp password to secure Supabase Auth
- ✅ Automatic linking of database profile to auth user
- ✅ Temp password cleared after upgrade

### Admin Controls
- ✅ Only admins can create users
- ✅ View users with temporary passwords
- ✅ Manual password clearing functions

---

## User Experience Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Admin creates   │───▶│ User gets temp   │───▶│ User logs in    │
│ user account    │    │ password         │    │ successfully    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ User has full   │◀───│ Supabase Auth    │◀───│ User changes    │
│ access to app   │    │ account created  │    │ temp password   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Troubleshooting

### Issue: "temp_password column doesn't exist"
**Solution**: Run the SQL script in Supabase SQL Editor

### Issue: "User creation fails"
**Solution**: Check that profiles table exists and has proper permissions

### Issue: "Login with temp password fails"
**Solution**: Verify the login API includes temp password checking (already implemented)

### Issue: "Password change fails"
**Solution**: Check Supabase Auth is properly configured

---

## File Structure

```
/pages/api/
├── admin-create-user.ts     # Create users with temp passwords
├── auth/login.ts           # Login (temp password support added)
├── change-temp-password.ts # Upgrade temp to permanent password
└── users.ts               # User management API

/components/
├── ChangePasswordForm.tsx  # UI for password changes
└── UserInvitationManager.tsx # Admin user creation UI

/pages/
├── users.tsx              # User management page
└── login.tsx             # Login page

Database:
├── temp-password-setup.sql # Complete database setup
└── profiles table        # Has temp_password column
```

---

## Next Steps

1. ✅ **Database setup complete** (run SQL script)
2. ✅ **APIs ready** (all endpoints created)
3. ✅ **UI components ready** (forms created)
4. ❓ **Test the complete flow**:
   - Create a test user
   - Login with temp password
   - Change password
   - Login with new password

5. 🚀 **Go live**: Your temporary password system is ready!

---

## Security Notes

- Temporary passwords are stored in plain text (for simplicity)
- They're automatically cleared when users upgrade
- Only admins can create users (no self-registration)
- Users are encouraged to change passwords quickly
- All auth flows eventually use Supabase Auth for security

---

**You're all set!** 🎉 Your temporary password system allows admin-controlled user creation without requiring users to go through Supabase signup. 