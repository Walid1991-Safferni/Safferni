-- Run in Supabase SQL Editor
-- Ensures profiles INSERT + UPDATE policies exist for self-management

-- Allow new users to insert their own profile row
CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY IF NOT EXISTS "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY IF NOT EXISTS "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());
