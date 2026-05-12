DROP POLICY IF EXISTS "team_messages_read" ON public.team_messages;
DROP POLICY IF EXISTS "team_messages_insert" ON public.team_messages;
DROP POLICY IF EXISTS "team_messages_delete" ON public.team_messages;

CREATE POLICY "team_messages_read" ON public.team_messages
  FOR SELECT USING (
    office_owner_id = public.get_current_office_owner_id()
    OR public.get_current_user_role() = 'admin'
  );

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

CREATE POLICY "team_messages_delete" ON public.team_messages
  FOR DELETE USING (
    sender_id = public.get_current_user_id()
    OR public.get_current_user_role() = 'admin'
  );
