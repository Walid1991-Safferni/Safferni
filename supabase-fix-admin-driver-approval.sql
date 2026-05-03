-- ============================================================
-- FIX: Admin driver approval + is_admin() helper
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Create is_admin() helper (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Fix profiles_update_admin policy (was broken because is_admin() didn't exist)
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- Allow admin to insert profiles too (needed for upsert on new applicants)
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- 3. SECURITY DEFINER function so admin can set role = 'driver' reliably
--    (bypasses RLS entirely, only callable by authenticated users)
CREATE OR REPLACE FUNCTION public.approve_driver_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'driver'
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_driver_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_driver_role(uuid) TO authenticated;

-- 4. Fix id_docs_select_own_or_admin policy (also used is_admin() which didn't exist)
DROP POLICY IF EXISTS "id_docs_select_own_or_admin" ON storage.objects;
CREATE POLICY "id_docs_select_own_or_admin" ON storage.objects FOR SELECT
  USING (bucket_id = 'id-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin()
  ));
