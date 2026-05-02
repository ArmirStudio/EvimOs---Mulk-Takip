-- ============================================================
-- Extracted from supabase/00_MASTER_SCHEMA.sql
-- Run order: 10_storage_policies.sql - Storage policies
-- ============================================================

-- BOLUM 10: STORAGE POLITIKALARI
-- Team hub public bucket'lari icin authenticated upload izni.
-- ============================================================

DROP POLICY IF EXISTS "team_public_files_read" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_insert" ON storage.objects;

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

-- ============================================================
