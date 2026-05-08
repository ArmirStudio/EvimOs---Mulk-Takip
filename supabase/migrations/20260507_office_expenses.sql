CREATE TABLE IF NOT EXISTS public.office_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN ('kira','fatura','ulasim','yemek','malzeme','diger')),
    description TEXT,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS office_expenses_office_idx ON public.office_expenses(office_owner_id);
CREATE INDEX IF NOT EXISTS office_expenses_date_idx   ON public.office_expenses(expense_date);
CREATE INDEX IF NOT EXISTS office_expenses_creator_idx ON public.office_expenses(created_by);

ALTER TABLE public.office_expenses ENABLE ROW LEVEL SECURITY;

-- Tüm ofis üyeleri görür
CREATE POLICY "office_members_view_expenses" ON public.office_expenses
    FOR SELECT
    USING (
        office_owner_id = auth.uid()
        OR office_owner_id IN (
            SELECT created_by FROM public.users WHERE id = auth.uid() AND role = 'employee'
        )
    );

-- Herkes kendi ofisi adına ekleyebilir
CREATE POLICY "office_members_insert_expenses" ON public.office_expenses
    FOR INSERT
    WITH CHECK (
        office_owner_id = auth.uid()
        OR office_owner_id IN (
            SELECT created_by FROM public.users WHERE id = auth.uid() AND role = 'employee'
        )
    );

-- Güncelleme: agent herkesi, employee sadece kendisini güncelleyebilir
CREATE POLICY "office_members_update_expenses" ON public.office_expenses
    FOR UPDATE
    USING (
        office_owner_id = auth.uid()
        OR created_by = auth.uid()
    );

-- Silme: agent herkesi, employee sadece kendisini silebilir
CREATE POLICY "office_members_delete_expenses" ON public.office_expenses
    FOR DELETE
    USING (
        office_owner_id = auth.uid()
        OR created_by = auth.uid()
    );

-- Admin hepsini görür/yönetir
CREATE POLICY "admin_all_expenses" ON public.office_expenses
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
