-- Reply threading
ALTER TABLE team_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES team_messages(id) ON DELETE SET NULL;

-- Read receipts: per-user last read timestamp per office
CREATE TABLE IF NOT EXISTS team_message_reads (
  office_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (office_owner_id, user_id)
);

ALTER TABLE team_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tmr_select" ON team_message_reads FOR SELECT USING (
  office_owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND agency_id = office_owner_id)
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "tmr_upsert" ON team_message_reads FOR ALL USING (user_id = auth.uid());
