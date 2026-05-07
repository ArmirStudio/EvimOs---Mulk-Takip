-- ============================================================
-- FIX: team_messages Schema Mismatch
-- Issue: content field named wrong, office_id references wrong table
-- Date: 2026-05-07
-- ============================================================

-- Step 1: DROP existing table (temiz başla)
DROP TABLE IF EXISTS public.team_messages CASCADE;

-- Step 2: Recreate with correct schema
CREATE TABLE IF NOT EXISTS public.team_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (char_length(body) <= 4000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
-- READ: Agent kendi mesajlarını, Employee ekibinin mesajlarını okuyabilir
CREATE POLICY "team_messages_read" ON public.team_messages
  FOR SELECT USING (
    -- Agent kendi mesajlarını okusun
    office_owner_id = auth.uid()
    OR
    -- Employee, ekibinin (agent'ının) mesajlarını okusunsun
    office_owner_id = (
      SELECT created_by FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
    OR
    -- Admin hepsini görsün
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: Agent veya employee kendi ekibine mesaj gönderebilir
CREATE POLICY "team_messages_insert" ON public.team_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      -- Agent kendi office'ine mesaj göndersin
      office_owner_id = auth.uid()
      OR
      -- Employee, ekibinin agent'ına mesaj göndersin
      office_owner_id = (
        SELECT created_by FROM public.users
        WHERE id = auth.uid() AND role = 'employee'
      )
    )
  );

-- DELETE: Sadece kendi mesajlarını silebilir, admin hepsini
CREATE POLICY "team_messages_delete" ON public.team_messages
  FOR DELETE USING (
    sender_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Step 5: Create Indexes
CREATE INDEX IF NOT EXISTS idx_team_messages_office_owner_created
  ON public.team_messages(office_owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_messages_sender_created
  ON public.team_messages(sender_id, created_at DESC);

-- ============================================================
-- DONE
-- ============================================================
