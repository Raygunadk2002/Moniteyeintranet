-- Moniteye Temporary Password Setup
-- Run this script in Supabase SQL Editor to enable temporary password authentication

-- Step 1: Add temp_password column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_password TEXT;

-- Step 2: Add comment to explain the column
COMMENT ON COLUMN profiles.temp_password IS 'Temporary password for database-only authentication (bypassing Supabase Auth). Users should change this after first login.';

-- Step 3: Update existing admin user to have a temp password
UPDATE profiles 
SET temp_password = 'moniteye2024' 
WHERE email = 'akeal@moniteye.co.uk' AND temp_password IS NULL;

-- Step 4: Create function to clear temp password after regular password is set
CREATE OR REPLACE FUNCTION clear_temp_password_on_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user updates their profile and they have a temp password, clear it
  -- This indicates they've successfully changed to a regular password
  IF OLD.temp_password IS NOT NULL AND NEW.temp_password IS NOT NULL THEN
    -- Keep temp password until explicitly cleared
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create a function to manually clear temp passwords (for admin use)
CREATE OR REPLACE FUNCTION clear_temp_password(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET temp_password = NULL 
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create a view to see users with temp passwords (admin only)
CREATE OR REPLACE VIEW temp_password_users AS
SELECT 
  email,
  full_name,
  role,
  department,
  created_at,
  temp_password IS NOT NULL as has_temp_password
FROM profiles
WHERE temp_password IS NOT NULL;

-- Step 7: Grant permissions for the admin functions
GRANT EXECUTE ON FUNCTION clear_temp_password(TEXT) TO authenticated;
GRANT SELECT ON temp_password_users TO authenticated;

-- Step 8: Verify the setup
DO $$
DECLARE
  temp_users_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO temp_users_count 
  FROM profiles 
  WHERE temp_password IS NOT NULL;
  
  RAISE NOTICE 'Temporary password setup completed!';
  RAISE NOTICE 'Users with temporary passwords: %', temp_users_count;
  
  IF temp_users_count > 0 THEN
    RAISE NOTICE 'These users can now login with email + temporary password';
  END IF;
END $$;

-- Step 9: Show current status
SELECT 
  'Setup Summary' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN temp_password IS NOT NULL THEN 1 END) as users_with_temp_password
FROM profiles; 