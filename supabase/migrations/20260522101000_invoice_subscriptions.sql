-- =====================================================================
-- INVOICE SUBSCRIPTIONS — facturas recurrentes
-- =====================================================================
-- Tabla que define plantillas recurrentes. Un cron diario lee las filas
-- con next_run_at <= today y genera una factura nueva copiando los items
-- de la factura template_invoice_id, luego avanza next_run_at segun
-- frequency.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.invoice_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    template_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    issuer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    next_run_at date NOT NULL,
    last_run_at date,
    active boolean NOT NULL DEFAULT true,
    end_date date,
    occurrences_count integer NOT NULL DEFAULT 0,
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_subs_due
    ON public.invoice_subscriptions (next_run_at)
    WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_invoice_subs_contact
    ON public.invoice_subscriptions (contact_id);

CREATE INDEX IF NOT EXISTS idx_invoice_subs_created_by
    ON public.invoice_subscriptions (created_by);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_invoice_subs_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_subs_updated_at ON public.invoice_subscriptions;
CREATE TRIGGER trg_invoice_subs_updated_at
    BEFORE UPDATE ON public.invoice_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_invoice_subs_updated_at();

-- RLS: mismo patron que invoices (owner por created_by)
ALTER TABLE public.invoice_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_subs_select_owner" ON public.invoice_subscriptions;
CREATE POLICY "invoice_subs_select_owner" ON public.invoice_subscriptions
    FOR SELECT TO authenticated
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "invoice_subs_insert_owner" ON public.invoice_subscriptions;
CREATE POLICY "invoice_subs_insert_owner" ON public.invoice_subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "invoice_subs_update_owner" ON public.invoice_subscriptions;
CREATE POLICY "invoice_subs_update_owner" ON public.invoice_subscriptions
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "invoice_subs_delete_owner" ON public.invoice_subscriptions;
CREATE POLICY "invoice_subs_delete_owner" ON public.invoice_subscriptions
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());
