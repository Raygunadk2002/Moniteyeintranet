# User Authentication System Setup

This document explains how to set up and use the new role-based user authentication system that replaces the password-based access control.

## 🚀 **Overview**

The Moniteye intranet now uses **Supabase Authentication** with role-based access control (RBAC) instead of simple password protection. This provides:

- ✅ **Individual user accounts** with email/password authentication
- ✅ **Role-based permissions** (Admin, Manager, Employee, Guest)
- ✅ **Secure session management** with automatic token refresh
- ✅ **Email verification** and password reset capabilities
- ✅ **User profile management** with departments and metadata

## 📋 **Setup Instructions**

### **Step 1: Run Database Migration**

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your Moniteyeintranet project

2. **Run the SQL Migration**
   - Go to SQL Editor
   - Copy the contents of `supabase-user-auth-migration.sql`
   - Execute the migration to create user profiles and policies

### **Step 2: Configure Email Authentication**

1. **Enable Email Authentication**
   - Go to Authentication → Settings
   - Ensure "Enable email confirmations" is checked
   - Set "Site URL" to your domain (e.g., `https://your-app.vercel.app`)

2. **Configure Email Templates** (Optional)
   - Customize signup confirmation emails
   - Set password reset email templates

### **Step 3: Create Your First Admin User**

1. **Sign Up Through the App**
   - Go to `/auth/login` on your deployed app
   - Click "Don't have an account? Sign up"
   - Create an account with your admin email

2. **Promote to Admin Role**
   - Go to Supabase Dashboard → Table Editor → `profiles`
   - Find your user record
   - Change `role` from `employee` to `admin`
   - Save the changes

## 👥 **User Roles & Permissions**

### **Role Hierarchy**
- **🔑 Admin**: Full system access (all modules)
- **📊 Manager**: Business tools + team management (Business Ideas + standard access)
- **👤 Employee**: Standard access (Tasks, Equipment, Calendar, Dashboard)
- **👁️ Guest**: Read-only dashboard access

### **Module Access Requirements**
- **Dashboard**: Guest+ (everyone)
- **Tasks**: Employee+
- **Equipment**: Employee+
- **Calendar**: Employee+
- **Business Ideas**: Manager+
- **Admin Panel**: Admin only
- **User Management**: Admin only

## 🔧 **Technical Implementation**

### **New Components Created**
- `lib/auth.ts` - Authentication utilities and role checking
- `contexts/AuthContext.tsx` - React context for auth state management
- `components/RoleBasedAccess.tsx` - Role-based access control wrapper
- `pages/auth/login.tsx` - Modern login/signup page

### **Updated Components**
- `components/Layout.tsx` - Now shows user info and role-based navigation
- `pages/_app.tsx` - Wrapped with AuthProvider
- `pages/admin.tsx` & `pages/business-ideas.tsx` - Use role-based access

### **Database Schema**
```sql
-- User profiles with role-based access
profiles (
  id UUID (references auth.users),
  email TEXT,
  full_name TEXT,
  role TEXT (admin|manager|employee|guest),
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🔐 **Migration from Password System**

### **Backward Compatibility**
- Old password system (`AdminAccessControl`) is still available as fallback
- New system takes precedence when user is authenticated
- Gradual migration path for existing users

### **Migration Steps**
1. ✅ Deploy new authentication system
2. ✅ Create admin accounts for team leads
3. 🔄 Invite team members to create accounts
4. 🔄 Assign appropriate roles to users
5. 🔄 Remove old password system once everyone migrated

## 📧 **User Management**

### **Adding New Users**
1. **Admin Invitation Process**:
   - Send team members the app URL
   - They sign up with work email
   - Admin assigns appropriate role in Supabase

2. **Bulk User Creation** (Future):
   - CSV import functionality
   - Automated role assignment based on department

### **Role Management**
Admins can change user roles in Supabase:
```sql
-- Promote user to manager
UPDATE profiles 
SET role = 'manager' 
WHERE email = 'user@company.com';

-- Deactivate user
UPDATE profiles 
SET is_active = false 
WHERE email = 'user@company.com';
```

## 🎯 **User Experience**

### **For New Users**
1. Visit app URL → Redirected to login page
2. Click "Sign up" → Enter email, password, full name
3. Check email for confirmation link
4. Confirm email → Automatically logged in
5. Default role: Employee (can be changed by admin)

### **For Existing Users**
1. Visit app URL → See modern login page
2. Sign in with email/password
3. Navigation shows role-appropriate modules
4. Profile shows in sidebar with role badge

### **Navigation Changes**
- **All Users**: Dashboard, Tasks, Equipment, Calendar, About
- **Manager+**: + Business Ideas
- **Admin**: + Admin Panel
- **Not Signed In**: Only shows "Sign In" button

## 🔍 **Troubleshooting**

### **Users Can't Sign Up**
- Check Supabase Auth settings
- Verify email confirmation is enabled
- Check spam folder for confirmation emails

### **Wrong Role Permissions**
- Check user role in `profiles` table
- Verify role hierarchy in `lib/auth.ts`
- Clear browser cache and refresh

### **Email Not Working**
- Configure SMTP settings in Supabase
- Check email templates are enabled
- Verify site URL is correct

### **Session Issues**
- Check Supabase project keys in environment variables
- Verify JWT settings in Supabase Auth
- Clear localStorage and re-login

## 🚀 **Deployment Checklist**

- ✅ Run database migration in Supabase
- ✅ Configure email authentication settings
- ✅ Set correct site URL in Supabase Auth
- ✅ Deploy updated application code
- ✅ Create first admin user account
- ✅ Test role-based access for different user types
- ✅ Invite team members to create accounts

## 🔮 **Future Enhancements**

### **Planned Features**
- **User Management UI**: Admin dashboard for user management
- **SSO Integration**: Google Workspace/Microsoft 365 login
- **Audit Logging**: Track user actions and access
- **Team Invitations**: Email-based team member invitations
- **Advanced Permissions**: Granular module permissions
- **User Profiles**: Enhanced profile pages with avatars

### **Security Improvements**
- **2FA Support**: Two-factor authentication
- **Session Monitoring**: Active session management
- **IP Restrictions**: Location-based access controls
- **Password Policies**: Enforced password complexity

## 📞 **Support**

For setup assistance or questions:
1. Check this documentation first
2. Review Supabase Auth documentation
3. Check browser console for error messages
4. Contact system administrator

---

**🎉 Congratulations!** You now have a professional, scalable user authentication system that will grow with your team! 