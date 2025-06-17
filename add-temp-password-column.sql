-- Add temp_password column to profiles table for database-only authentication
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_password TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.temp_password IS 'Temporary password for database-only authentication (bypassing Supabase Auth)';

-- Update existing admin user to have a temp password
UPDATE profiles 
SET temp_password = 'moniteye2024' 
WHERE email = 'akeal@moniteye.co.uk' AND temp_password IS NULL; 