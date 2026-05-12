DROP POLICY IF EXISTS "team_messages_insert" ON public.team_messages;
DROP POLICY IF EXISTS "team_message_attachments_insert" ON public.team_message_attachments;

CREATE POLICY "team_messages_insert" ON public.team_messages
  FOR INSERT WITH CHECK (
    sender_id = public.get_current_user_id()
    AND office_owner_id = public.get_current_office_owner_id()
    AND (
      reply_to_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.team_messages tm
        WHERE tm.id = public.team_messages.reply_to_id
          AND tm.office_owner_id = public.team_messages.office_owner_id
      )
    )
  );

CREATE POLICY "team_message_attachments_insert" ON public.team_message_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = public.get_current_user_id()
    AND office_owner_id = public.get_current_office_owner_id()
    AND bucket = 'team-message-files'
    AND storage_path LIKE (office_owner_id::text || '/' || uploaded_by::text || '/%')
    AND EXISTS (
      SELECT 1
      FROM public.team_messages tm
      WHERE tm.id = public.team_message_attachments.message_id
        AND tm.office_owner_id = public.team_message_attachments.office_owner_id
    )
  );
