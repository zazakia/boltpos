-- Add active field to profiles table
-- This field allows for soft deletion/deactivation of users
-- active = false means the user is deactivated but still exists in the database

-- Add the active column with default value true
ALTER TABLE profiles ADD COLUMN active boolean DEFAULT true NOT NULL;

-- Update existing profiles to be active (for backward compatibility)
UPDATE profiles SET active = true WHERE active IS NULL;

-- Add index on active field for performance
CREATE INDEX idx_profiles_active ON profiles(active);

-- Add comment explaining the field
COMMENT ON COLUMN profiles.active IS 'User activation status. When false, user is deactivated and should be restricted from operations.';