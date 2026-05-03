-- ============================================================
-- DRIVER PROFILE PHOTO + ID VERIFICATION
-- Run in Supabase SQL Editor
-- ============================================================

-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verification_pending boolean DEFAULT false;

-- Storage buckets (public for avatars, private for ID docs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('id-documents', 'id-documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: avatars (public read, owner write)
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_select_all" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Storage RLS: id-documents (owner upload, admin read)
CREATE POLICY "id_docs_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "id_docs_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "id_docs_select_own_or_admin" ON storage.objects FOR SELECT
  USING (bucket_id = 'id-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin()
  ));
