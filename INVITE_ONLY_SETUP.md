# 🎯 Invite-Only User System Setup

## Overview
This system prevents open registration and requires admin-generated invitations for new users to join your Moniteye intranet.

## 🚀 Quick Setup

### 1. Run SQL Migrations in Supabase

**First, run the main user authentication migration:**
```sql
-- Copy and paste the contents of: supabase-user-auth-migration.sql
-- This creates the profiles table and basic user management
```

**Then, run the invite-only system migration:**
```sql
-- Copy and paste the contents of: supabase-invite-system-migration.sql
-- This creates the invitations table and enforces invite-only signup
```

### 2. Create Your First Admin User

Since the system is now invite-only, you need to create your first admin user manually:

1. **Temporarily disable the invitation requirement:**
   ```sql
   -- Run this in Supabase SQL Editor to allow one signup
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   ```

2. **Sign up with your admin email:**
   - Go to `/auth/login`
   - Create account with your admin email
   - Complete the signup process

3. **Set your role to admin:**
   ```sql
   -- Replace 'your-admin-email@domain.com' with your actual email
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
   ```

4. **Re-enable the invitation system:**
   ```sql
   -- Restore the trigger that enforces invitations
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

### 3. Test the System

1. **Access the admin panel:** Go to `/admin` (only accessible to admin users)
2. **Create an invitation:** Use the "Invite New Team Member" section
3. **Test the invitation:** Copy the generated link and try signing up in an incognito window

## 🎯 How It Works

### For Admins
- **Create Invitations:** Generate secure invitation links for specific email addresses
- **Set Roles:** Assign roles (admin, manager, employee, guest) during invitation
- **Track Status:** Monitor invitation status (active, used, expired)
- **Copy Links:** Share invitation URLs with colleagues

### For New Users
- **Invitation Required:** Cannot sign up without a valid invitation token
- **Email Validation:** Must use the exact email address from the invitation
- **Automatic Role Assignment:** Role is set automatically based on the invitation
- **Secure Process:** Invitations expire after 7 days for security

## 🔧 System Features

### Security
- ✅ **Invitation-Only:** No open registration
- ✅ **Email Validation:** Must match invited email exactly
- ✅ **Token Expiry:** Invitations expire after 7 days
- ✅ **One-Time Use:** Each invitation can only be used once
- ✅ **Admin Only:** Only admins can create invitations

### User Experience
- ✅ **Pre-filled Forms:** Email automatically filled from invitation
- ✅ **Role Explanation:** Clear role descriptions during signup
- ✅ **Visual Feedback:** Clear success/error messages
- ✅ **Invitation Status:** Track pending, used, and expired invitations

## 📋 Admin Interface

The admin panel (`/admin`) now includes:

### User Invitation Manager
- **Create Invitations:** Form to invite new team members
- **Role Selection:** Choose from admin, manager, employee, guest
- **Department Assignment:** Optional department field
- **Invitation List:** View all pending invitations
- **Copy Links:** One-click invitation link copying
- **Status Tracking:** See active, used, and expired invitations

### Invitation Workflow
1. **Admin creates invitation** with email and role
2. **System generates secure token** and invitation URL
3. **Admin shares link** with the colleague
4. **Colleague clicks link** and completes signup
5. **System validates email** matches invitation
6. **Account created** with pre-assigned role
7. **Invitation marked as used**

## 🛠️ Troubleshooting

### Common Issues

**"Registration requires a valid invitation" error:**
- Check if invitation exists and hasn't expired
- Verify email matches invitation exactly
- Ensure invitation hasn't been used already

**Admin can't access invitation manager:**
- Verify user role is set to 'admin' in database
- Check if user is properly authenticated
- Refresh browser and try again

**Invitation links not working:**
- Check if invitation has expired (7 days)
- Verify token is complete in URL
- Try generating a new invitation

### Database Queries

**Check user roles:**
```sql
SELECT email, role, created_at FROM profiles ORDER BY created_at DESC;
```

**View active invitations:**
```sql
SELECT email, role, expires_at, used_at FROM invitations 
WHERE expires_at > NOW() AND used_at IS NULL;
```

**Manually set admin role:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'user@domain.com';
```

## 🚀 Next Steps

### Recommended Enhancements
1. **Email Integration:** Send invitation emails automatically
2. **Bulk Invitations:** Import multiple users from CSV
3. **Role Management:** Interface to change user roles
4. **User Deactivation:** Temporarily disable user accounts
5. **Audit Logging:** Track user actions and changes

### Email Integration Setup
To automatically send invitation emails, you could integrate with:
- **SendGrid:** Professional email service
- **Resend:** Developer-friendly email API
- **Supabase Edge Functions:** Custom email sending logic

### Security Considerations
- **Regular Cleanup:** Remove expired invitations periodically
- **Role Reviews:** Audit user roles quarterly
- **Access Monitoring:** Track admin actions
- **Backup Strategy:** Regular database backups

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all SQL migrations ran successfully
3. Test with a fresh browser session
4. Check browser console for JavaScript errors

The system is designed to be secure by default - no one can join without an explicit invitation from an admin user. 