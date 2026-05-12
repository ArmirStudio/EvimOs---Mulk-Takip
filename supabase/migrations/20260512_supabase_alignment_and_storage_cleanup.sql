INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('team-message-files', 'team-message-files', FALSE, 10485760)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 10485760;

CREATE TABLE IF NOT EXISTS public.team_message_attachments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id       UUID NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
  office_owner_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  uploaded_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  bucket           TEXT NOT NULL DEFAULT 'team-message-files',
  storage_path     TEXT NOT NULL,
  file_name        TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  size_bytes       INTEGER,
  kind             TEXT NOT NULL CHECK (kind IN ('image', 'document', 'file')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_message_attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_team_message_attachments_message_created
  ON public.team_message_attachments(message_id, created_at);

CREATE INDEX IF NOT EXISTS idx_team_message_attachments_office_created
  ON public.team_message_attachments(office_owner_id, created_at DESC);

GRANT SELECT, INSERT ON public.team_message_attachments TO authenticated;
GRANT ALL ON public.team_message_attachments TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.team_message_reads TO authenticated;
GRANT ALL ON public.team_message_reads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_meetings TO authenticated;
GRANT ALL ON public.team_meetings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_expenses TO authenticated;
GRANT ALL ON public.office_expenses TO service_role;

ALTER FUNCTION public.get_current_user_id() SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public;
ALTER FUNCTION public.get_current_employee_access_level() SET search_path = public;
ALTER FUNCTION public.get_current_office_owner_id() SET search_path = public;
ALTER FUNCTION public.is_full_employee() SET search_path = public;
ALTER FUNCTION public.current_user_can_view_property(UUID) SET search_path = public;
ALTER FUNCTION public.current_user_can_manage_property(UUID) SET search_path = public;
ALTER FUNCTION public.current_user_can_view_maintenance_scope(UUID) SET search_path = public;
ALTER FUNCTION public.current_user_office_owner_id() SET search_path = public;

REVOKE ALL ON FUNCTION public.get_current_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_employee_access_level() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_office_owner_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_full_employee() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_can_view_property(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_can_manage_property(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_can_view_maintenance_scope(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_office_owner_id() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_employee_access_level() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_office_owner_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_full_employee() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_can_view_property(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_can_manage_property(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_can_view_maintenance_scope(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_office_owner_id() TO authenticated, service_role;

DROP POLICY IF EXISTS "tmr_select" ON public.team_message_reads;
DROP POLICY IF EXISTS "tmr_upsert" ON public.team_message_reads;
DROP POLICY IF EXISTS "team_message_reads_select" ON public.team_message_reads;
DROP POLICY IF EXISTS "team_message_reads_insert" ON public.team_message_reads;
DROP POLICY IF EXISTS "team_message_reads_update" ON public.team_message_reads;

CREATE POLICY "team_message_reads_select" ON public.team_message_reads
  FOR SELECT USING (
    office_owner_id = public.get_current_office_owner_id()
    OR user_id = public.get_current_user_id()
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "team_message_reads_insert" ON public.team_message_reads
  FOR INSERT WITH CHECK (
    office_owner_id = public.get_current_office_owner_id()
    AND user_id = public.get_current_user_id()
  );

CREATE POLICY "team_message_reads_update" ON public.team_message_reads
  FOR UPDATE USING (
    office_owner_id = public.get_current_office_owner_id()
    AND user_id = public.get_current_user_id()
  )
  WITH CHECK (
    office_owner_id = public.get_current_office_owner_id()
    AND user_id = public.get_current_user_id()
  );

DROP POLICY IF EXISTS "office_members_meetings" ON public.team_meetings;
DROP POLICY IF EXISTS "admin_all_meetings" ON public.team_meetings;
DROP POLICY IF EXISTS "team_meetings_read" ON public.team_meetings;
DROP POLICY IF EXISTS "team_meetings_write" ON public.team_meetings;

CREATE POLICY "team_meetings_read" ON public.team_meetings
  FOR SELECT USING (
    office_owner_id = public.get_current_office_owner_id()
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "team_meetings_write" ON public.team_meetings
  FOR ALL USING (
    office_owner_id = public.get_current_office_owner_id()
    OR public.get_current_user_role() = 'admin'
  )
  WITH CHECK (
    office_owner_id = public.get_current_office_owner_id()
    OR public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "office_members_view_expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "office_members_insert_expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "office_members_update_expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "office_members_delete_expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "admin_all_expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "office_expenses_read" ON public.office_expenses;
DROP POLICY IF EXISTS "office_expenses_insert" ON public.office_expenses;
DROP POLICY IF EXISTS "office_expenses_update" ON public.office_expenses;
DROP POLICY IF EXISTS "office_expenses_delete" ON public.office_expenses;

CREATE POLICY "office_expenses_read" ON public.office_expenses
  FOR SELECT USING (
    office_owner_id = public.get_current_office_owner_id()
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "office_expenses_insert" ON public.office_expenses
  FOR INSERT WITH CHECK (
    office_owner_id = public.get_current_office_owner_id()
    AND created_by = public.get_current_user_id()
  );

CREATE POLICY "office_expenses_update" ON public.office_expenses
  FOR UPDATE USING (
    public.get_current_user_role() = 'admin'
    OR office_owner_id = public.get_current_office_owner_id()
  )
  WITH CHECK (
    public.get_current_user_role() = 'admin'
    OR office_owner_id = public.get_current_office_owner_id()
  );

CREATE POLICY "office_expenses_delete" ON public.office_expenses
  FOR DELETE USING (
    public.get_current_user_role() = 'admin'
    OR office_owner_id = public.get_current_office_owner_id()
  );

DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
CREATE POLICY "notif_insert" ON public.notifications
  FOR INSERT WITH CHECK (
    user_id = public.get_current_user_id()
    OR public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "ann_recipients_insert" ON public.announcement_recipients;
CREATE POLICY "ann_recipients_insert" ON public.announcement_recipients
  FOR INSERT WITH CHECK (
    user_id = public.get_current_user_id()
    OR EXISTS (
      SELECT 1
      FROM public.announcements a
      WHERE a.id = announcement_id
        AND (
          a.created_by = public.get_current_user_id()
          OR a.office_owner_id = public.get_current_office_owner_id()
          OR public.get_current_user_role() = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "team_message_attachments_read" ON public.team_message_attachments;
DROP POLICY IF EXISTS "team_message_attachments_insert" ON public.team_message_attachments;

CREATE POLICY "team_message_attachments_read" ON public.team_message_attachments
  FOR SELECT USING (
    office_owner_id = public.get_current_office_owner_id()
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "team_message_attachments_insert" ON public.team_message_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = public.get_current_user_id()
    AND office_owner_id = public.get_current_office_owner_id()
    AND bucket = 'team-message-files'
    AND storage_path LIKE (office_owner_id::text || '/' || uploaded_by::text || '/%')
    AND EXISTS (
      SELECT 1 FROM public.team_messages tm
      WHERE tm.id = public.team_message_attachments.message_id
        AND tm.office_owner_id = public.team_message_attachments.office_owner_id
    )
  );

DROP POLICY IF EXISTS "receipts_private_read" ON storage.objects;
DROP POLICY IF EXISTS "receipts_private_write" ON storage.objects;
DROP POLICY IF EXISTS "receipts_private_update" ON storage.objects;
DROP POLICY IF EXISTS "receipts_private_delete" ON storage.objects;
DROP POLICY IF EXISTS "property_documents_read" ON storage.objects;
DROP POLICY IF EXISTS "property_documents_write" ON storage.objects;
DROP POLICY IF EXISTS "property_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "property_documents_delete" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_read" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_update" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_delete" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_read" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_update" ON storage.objects;
DROP POLICY IF EXISTS "team_public_files_delete" ON storage.objects;

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
