-- team_meetings: office-level meeting records
CREATE TABLE IF NOT EXISTS public.team_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_meetings_office_idx ON public.team_meetings(office_owner_id);
CREATE INDEX IF NOT EXISTS team_meetings_scheduled_idx ON public.team_meetings(scheduled_at);

ALTER TABLE public.team_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office_members_meetings" ON public.team_meetings
    FOR ALL
    USING (
        office_owner_id = auth.uid()
        OR office_owner_id IN (
            SELECT created_by FROM public.users
            WHERE id = auth.uid() AND role = 'employee'
        )
    );

CREATE POLICY "admin_all_meetings" ON public.team_meetings
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
