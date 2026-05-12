-- ============================================================
-- Extracted from supabase/00_MASTER_SCHEMA.sql
-- Run order: 10_storage_policies.sql - Storage policies
-- ============================================================

-- BOLUM 10: STORAGE POLITIKALARI
-- Bucket erişim politikaları: private buckets signed URL, public buckets authenticated write
-- ============================================================

-- ── AVATARS (Public - herkes okuyabilir, kendi avatar yazabilir) ────────
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_write" ON storage.objects;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_authenticated_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── AGENCY_BRANDING (Public - herkes okuyabilir, agent/admin kendi agency yazabilir) ────────
DROP POLICY IF EXISTS "agency_branding_read" ON storage.objects;
DROP POLICY IF EXISTS "agency_branding_write" ON storage.objects;

CREATE POLICY "agency_branding_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'agency-branding');

CREATE POLICY "agency_branding_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'agency-branding'
    AND auth.uid() IS NOT NULL
  );

-- ── AD_MEDIA (Public - herkes okuyabilir, admin yazabilir) ────────
DROP POLICY IF EXISTS "ad_media_read" ON storage.objects;
DROP POLICY IF EXISTS "ad_media_admin_write" ON storage.objects;

CREATE POLICY "ad_media_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-media');

CREATE POLICY "ad_media_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ad-media'
    AND auth.uid() IS NOT NULL
  );

-- ── PROPERTY_IMAGES (Public - herkes okuyabilir, property owner yazabilir) ────────
DROP POLICY IF EXISTS "property_images_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_write" ON storage.objects;

CREATE POLICY "property_images_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "property_images_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.uid() IS NOT NULL
  );

-- ── TENANT_DOCUMENTS (Public - herkes okuyabilir, owner yazabilir) ────────
DROP POLICY IF EXISTS "tenant_documents_read" ON storage.objects;
DROP POLICY IF EXISTS "tenant_documents_write" ON storage.objects;

CREATE POLICY "tenant_documents_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'tenant-documents');

CREATE POLICY "tenant_documents_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-documents'
    AND auth.uid() IS NOT NULL
  );

-- ── RECEIPTS (Private - owner veya property admin yazabilir/okuyabilir) ────────
DROP POLICY IF EXISTS "receipts_private_read" ON storage.objects;
DROP POLICY IF EXISTS "receipts_private_write" ON storage.objects;
DROP POLICY IF EXISTS "receipts_private_update" ON storage.objects;
DROP POLICY IF EXISTS "receipts_private_delete" ON storage.objects;

CREATE POLICY "receipts_private_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');

CREATE POLICY "receipts_private_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "receipts_private_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "receipts_private_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

-- ── PROPERTY_DOCUMENTS (Private - owner veya property admin yazabilir/okuyabilir) ────────
DROP POLICY IF EXISTS "property_documents_read" ON storage.objects;
DROP POLICY IF EXISTS "property_documents_write" ON storage.objects;
DROP POLICY IF EXISTS "property_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "property_documents_delete" ON storage.objects;

CREATE POLICY "property_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'property-documents');

CREATE POLICY "property_documents_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-documents'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "property_documents_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'property-documents'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "property_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND auth.uid() IS NOT NULL
  );

-- ── MAINTENANCE_PHOTOS (Private - owner veya property admin yazabilir/okuyabilir) ────────
DROP POLICY IF EXISTS "maintenance_photos_read" ON storage.objects;
DROP POLICY IF EXISTS "maintenance_photos_write" ON storage.objects;

CREATE POLICY "maintenance_photos_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-photos');

CREATE POLICY "maintenance_photos_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'maintenance-photos'
    AND auth.uid() IS NOT NULL
  );

-- ── TASK_PHOTOS ve ANNOUNCEMENT_FILES (Public - authenticated upload) ────────
-- TEAM_MESSAGE_FILES (Private - ayni ofis uyeleri okur, kullanici kendi klasorune yazar)
DROP POLICY IF EXISTS "team_message_files_read" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_update" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_delete" ON storage.objects;

CREATE POLICY "team_message_files_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'team-message-files'
    AND (
      (storage.foldername(name))[1] = public.get_current_office_owner_id()::text
      OR public.get_current_user_role() = 'admin'
    )
  );

CREATE POLICY "team_message_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'team-message-files'
    AND (storage.foldername(name))[1] = public.get_current_office_owner_id()::text
    AND (storage.foldername(name))[2] = public.get_current_user_id()::text
  );

CREATE POLICY "team_message_files_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'team-message-files'
    AND (storage.foldername(name))[1] = public.get_current_office_owner_id()::text
    AND (storage.foldername(name))[2] = public.get_current_user_id()::text
  )
  WITH CHECK (
    bucket_id = 'team-message-files'
    AND (storage.foldername(name))[1] = public.get_current_office_owner_id()::text
    AND (storage.foldername(name))[2] = public.get_current_user_id()::text
  );

CREATE POLICY "team_message_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'team-message-files'
    AND (storage.foldername(name))[1] = public.get_current_office_owner_id()::text
    AND (storage.foldername(name))[2] = public.get_current_user_id()::text
  );

DROP POLICY IF EXISTS "team_public_files_read" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_update" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_delete" ON storage.objects;

CREATE POLICY "team_public_files_read" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('task-photos', 'announcement-files')
  );

CREATE POLICY "team_public_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('task-photos', 'announcement-files')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "team_public_files_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('task-photos', 'announcement-files')
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id IN ('task-photos', 'announcement-files')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "team_public_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('task-photos', 'announcement-files')
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
