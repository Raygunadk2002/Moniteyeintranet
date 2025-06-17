-- Moniteye Temporary Password Setup (FIXED)
-- This handles existing views and column conflicts properly

-- Step 1: Drop any existing conflicting views first
DROP VIEW IF EXISTS temp_password_users;

-- Step 2: Temporarily drop the foreign key constraint for temp password users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 3: Add columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_temp_user BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_password TEXT;

-- Step 4: Add comments
COMMENT ON COLUMN profiles.temp_password IS 'Temporary password for database-only authentication (bypassing Supabase Auth)';
COMMENT ON COLUMN profiles.is_temp_user IS 'TRUE for users created with temp passwords, FALSE for Supabase Auth users';

-- Step 5: Update existing admin user to have a temp password
UPDATE profiles 
SET 
  temp_password = 'moniteye2024',
  is_temp_user = TRUE
WHERE email = 'akeal@moniteye.co.uk' 
  AND (temp_password IS NULL OR temp_password = '');

-- Step 6: Create function to clear temp password after regular password is set
CREATE OR REPLACE FUNCTION clear_temp_password_on_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user updates their profile and they have a temp password, clear it
  IF OLD.temp_password IS NOT NULL AND NEW.temp_password IS NULL THEN
    NEW.is_temp_user = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for temp password clearing
DROP TRIGGER IF EXISTS clear_temp_password_trigger ON profiles;
CREATE TRIGGER clear_temp_password_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION clear_temp_password_on_auth();

-- Step 8: Create a function to manually clear temp passwords (for admin use)
CREATE OR REPLACE FUNCTION clear_temp_password(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    temp_password = NULL,
    is_temp_user = FALSE
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create the temp password users view with unique name
CREATE OR REPLACE VIEW moniteye_temp_users AS
SELECT 
  id as user_id,
  email as user_email,
  full_name,
  role,
  department,
  created_at,
  is_temp_user,
  (temp_password IS NOT NULL) as has_temp_password
FROM profiles
WHERE is_temp_user = TRUE OR temp_password IS NOT NULL;

-- Step 10: Grant permissions
GRANT EXECUTE ON FUNCTION clear_temp_password(TEXT) TO authenticated;
GRANT SELECT ON moniteye_temp_users TO authenticated;

-- Step 11: Verify setup and show results
DO $$
DECLARE
  temp_users_count INTEGER;
  total_users_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO temp_users_count 
  FROM profiles 
  WHERE temp_password IS NOT NULL;
  
  SELECT COUNT(*) INTO total_users_count 
  FROM profiles;
  
  RAISE NOTICE 'Temporary Password Setup Complete!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total users: %', total_users_count;
  RAISE NOTICE 'Users with temp passwords: %', temp_users_count;
  RAISE NOTICE '';
  
  IF temp_users_count > 0 THEN
    RAISE NOTICE 'Ready for temp password login!';
    RAISE NOTICE 'Admin can login with: akeal@moniteye.co.uk / moniteye2024';
  END IF;
END $$;

-- Step 12: Show current status
SELECT 
  'Setup Summary' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN temp_password IS NOT NULL THEN 1 END) as users_with_temp_password,
  COUNT(CASE WHEN is_temp_user = TRUE THEN 1 END) as temp_users
FROM profiles; 