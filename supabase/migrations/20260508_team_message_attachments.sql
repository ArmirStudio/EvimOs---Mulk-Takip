-- Team message attachments and private storage bucket

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('team-message-files', 'team-message-files', FALSE, 10485760)
ON CONFLICT (id) DO UPDATE SET public = FALSE, file_size_limit = 10485760;

CREATE TABLE IF NOT EXISTS public.team_message_attachments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id      UUID NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
  office_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  uploaded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  bucket          TEXT NOT NULL DEFAULT 'team-message-files' CHECK (bucket = 'team-message-files'),
  storage_path    TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  mime_type       TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes      INTEGER CHECK (size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 10485760)),
  kind            TEXT NOT NULL CHECK (kind IN ('image', 'document', 'file')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_message_attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_team_message_attachments_message_created
  ON public.team_message_attachments(message_id, created_at);

CREATE INDEX IF NOT EXISTS idx_team_message_attachments_office_created
  ON public.team_message_attachments(office_owner_id, created_at DESC);

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
      WHERE tm.id = message_id
        AND tm.office_owner_id = office_owner_id
    )
  );

GRANT SELECT, INSERT ON public.team_message_attachments TO authenticated;
GRANT ALL ON public.team_message_attachments TO service_role;

DROP POLICY IF EXISTS "team_message_files_read" ON storage.objects;
DROP POLICY IF EXISTS "team_message_files_insert" ON storage.objects;

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
