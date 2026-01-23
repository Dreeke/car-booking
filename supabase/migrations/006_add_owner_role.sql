-- Add is_owner column to profiles table
ALTER TABLE profiles ADD COLUMN is_owner BOOLEAN DEFAULT FALSE;

-- Ensure only one owner can exist at a time
CREATE UNIQUE INDEX idx_single_owner ON profiles (is_owner) WHERE is_owner = TRUE;

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Users can update their own display_name but not role fields
CREATE POLICY "Users can update own display_name" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
    AND is_owner = (SELECT is_owner FROM profiles WHERE id = auth.uid())
  );

-- Owner can update anyone
CREATE POLICY "Owner manages all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

-- Admins can toggle admin status on non-owners only
CREATE POLICY "Admins can manage non-owner admin status" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    AND id != auth.uid()
    AND NOT is_owner
  )
  WITH CHECK (is_owner = false);

-- Set initial owner (also ensure they're an admin)
UPDATE profiles SET is_owner = true, is_admin = true WHERE id = '57fe0e68-68ad-4a7d-90af-fda1098746e9';
