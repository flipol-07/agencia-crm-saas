-- =====================================================================
-- RLS AUDIT — defensive policies idempotentes
-- =====================================================================
-- Habilita RLS y crea policies basicas si no existen.
-- Patron: filas accesibles por (created_by = auth.uid()) o (assigned_to = auth.uid()).
-- Las policies usan DROP/CREATE para ser deterministas.
-- =====================================================================

-- ---------- contacts ----------
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_owner" ON public.contacts;
CREATE POLICY "contacts_select_owner" ON public.contacts
    FOR SELECT TO authenticated
    USING (created_by = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "contacts_insert_owner" ON public.contacts;
CREATE POLICY "contacts_insert_owner" ON public.contacts
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "contacts_update_owner" ON public.contacts;
CREATE POLICY "contacts_update_owner" ON public.contacts
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid() OR assigned_to = auth.uid())
    WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "contacts_delete_owner" ON public.contacts;
CREATE POLICY "contacts_delete_owner" ON public.contacts
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- ---------- invoices ----------
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_owner" ON public.invoices;
CREATE POLICY "invoices_select_owner" ON public.invoices
    FOR SELECT TO authenticated
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "invoices_insert_owner" ON public.invoices;
CREATE POLICY "invoices_insert_owner" ON public.invoices
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "invoices_update_owner" ON public.invoices;
CREATE POLICY "invoices_update_owner" ON public.invoices
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "invoices_delete_owner" ON public.invoices;
CREATE POLICY "invoices_delete_owner" ON public.invoices
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- ---------- invoice_items ----------
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Acceso a items via ownership de la factura padre.
DROP POLICY IF EXISTS "invoice_items_all_via_invoice" ON public.invoice_items;
CREATE POLICY "invoice_items_all_via_invoice" ON public.invoice_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id AND i.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id AND i.created_by = auth.uid()
        )
    );

-- ---------- contact_files ----------
DO $$ BEGIN
    EXECUTE 'ALTER TABLE public.contact_files ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "contact_files_via_contact" ON public.contact_files';
    EXECUTE 'CREATE POLICY "contact_files_via_contact" ON public.contact_files
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_files.contact_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())))
        WITH CHECK (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_files.contact_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())))';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ---------- contact_emails ----------
DO $$ BEGIN
    EXECUTE 'ALTER TABLE public.contact_emails ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "contact_emails_via_contact" ON public.contact_emails';
    EXECUTE 'CREATE POLICY "contact_emails_via_contact" ON public.contact_emails
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_emails.contact_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())))
        WITH CHECK (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_emails.contact_id AND (c.created_by = auth.uid() OR c.assigned_to = auth.uid())))';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
