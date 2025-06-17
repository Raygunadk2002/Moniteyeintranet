-- Invite-Only User System Migration
-- Run this AFTER the main user auth migration

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'employee', 'guest')) DEFAULT 'employee',
  department TEXT,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invitations
CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can view their own invitation (for signup process)
CREATE POLICY "View own invitation" ON invitations
  FOR SELECT USING (true);

-- Create function to generate invitation
CREATE OR REPLACE FUNCTION public.create_invitation(
  invite_email TEXT,
  invite_role TEXT DEFAULT 'employee',
  invite_department TEXT DEFAULT NULL
)
RETURNS TABLE(invitation_id UUID, invitation_token TEXT) AS $$
DECLARE
  new_invitation_id UUID;
  new_token TEXT;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create invitations';
  END IF;

  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = invite_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Check if invitation already exists and is not expired
  IF EXISTS (
    SELECT 1 FROM invitations 
    WHERE email = invite_email 
    AND expires_at > NOW() 
    AND used_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Active invitation already exists for this email';
  END IF;

  -- Create new invitation
  INSERT INTO invitations (email, invited_by, role, department)
  VALUES (invite_email, auth.uid(), invite_role, invite_department)
  RETURNING id, token INTO new_invitation_id, new_token;

  RETURN QUERY SELECT new_invitation_id, new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate invitation
CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  email TEXT,
  role TEXT,
  department TEXT,
  expires_at TIMESTAMP
) AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  SELECT * INTO invitation_record
  FROM invitations
  WHERE token = invitation_token
  AND expires_at > NOW()
  AND used_at IS NULL;

  IF invitation_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP;
  ELSE
    RETURN QUERY SELECT 
      true,
      invitation_record.email,
      invitation_record.role,
      invitation_record.department,
      invitation_record.expires_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark invitation as used
CREATE OR REPLACE FUNCTION public.use_invitation(invitation_token TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  SELECT * INTO invitation_record
  FROM invitations
  WHERE token = invitation_token
  AND expires_at > NOW()
  AND used_at IS NULL;

  IF invitation_record IS NULL THEN
    RETURN false;
  END IF;

  -- Mark invitation as used
  UPDATE invitations
  SET used_at = NOW()
  WHERE token = invitation_token;

  -- Update user profile with invitation details
  UPDATE profiles
  SET 
    role = invitation_record.role,
    department = invitation_record.department
  WHERE id = user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to check for invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if there's a valid invitation for this email
  SELECT * INTO invitation_record
  FROM invitations
  WHERE email = NEW.email
  AND expires_at > NOW()
  AND used_at IS NULL;

  -- If no valid invitation exists, prevent signup
  IF invitation_record IS NULL THEN
    RAISE EXCEPTION 'Registration requires a valid invitation. Contact your administrator.';
  END IF;

  -- Create profile with invitation details
  INSERT INTO public.profiles (id, email, full_name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    invitation_record.role,
    invitation_record.department
  );

  -- Mark invitation as used
  UPDATE invitations
  SET used_at = NOW()
  WHERE id = invitation_record.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON invitations TO authenticated;
GRANT EXECUTE ON FUNCTION create_invitation(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION use_invitation(TEXT, UUID) TO authenticated;

-- Comments
COMMENT ON TABLE invitations IS 'Email invitations for new user registration';
COMMENT ON FUNCTION create_invitation(TEXT, TEXT, TEXT) IS 'Create a new user invitation (admin only)';
COMMENT ON FUNCTION validate_invitation(TEXT) IS 'Validate an invitation token';
COMMENT ON FUNCTION use_invitation(TEXT, UUID) IS 'Mark invitation as used and set user role'; 