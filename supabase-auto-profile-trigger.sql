-- ============================================================
-- AUTO-CREATE PROFILE WHEN AUTH USER IS CREATED
-- Run in Supabase SQL Editor
--
-- This guarantees every auth user has a profile row, even if
-- the client-side signup flow fails partway through.
-- The profile is later filled in by the verify handler.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'passenger'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- BACKFILL: create profiles for any existing zombie auth users
-- ============================================================
INSERT INTO public.profiles (id, email, phone, full_name, role)
SELECT
  u.id,
  u.email,
  u.phone,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'passenger'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
