-- =====================================================================
-- INVOICE HARDENING
-- =====================================================================
-- 1) Garantiza numeracion unica por emisor (race condition fix)
-- 2) RPCs transaccionales para crear/actualizar factura + items
-- 3) Incremento atomico de profiles.next_invoice_number con FOR UPDATE
-- =====================================================================

-- 1. UNIQUE INDEX: una factura por (issuer_profile_id, invoice_number)
-- Aceptamos NULL en issuer_profile_id (facturas legacy sin perfil emisor).
CREATE UNIQUE INDEX IF NOT EXISTS invoices_issuer_number_unique
    ON public.invoices (issuer_profile_id, invoice_number)
    WHERE issuer_profile_id IS NOT NULL AND invoice_number IS NOT NULL;

-- 2. RPC: create_invoice_with_items
--    Inserta factura + items + incrementa next_invoice_number,
--    todo en una sola transaccion. Si algo falla, rollback automatico.
CREATE OR REPLACE FUNCTION public.create_invoice_with_items(
    p_invoice jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_invoice_id uuid;
    v_invoice_row jsonb;
    v_issuer uuid;
BEGIN
    -- Lock el perfil del emisor para evitar race condition en numeracion.
    v_issuer := (p_invoice->>'issuer_profile_id')::uuid;
    IF v_issuer IS NOT NULL THEN
        PERFORM 1 FROM public.profiles WHERE id = v_issuer FOR UPDATE;
    END IF;

    -- Insert de la factura (jsonb_populate_record traduce el jsonb al rowtype).
    INSERT INTO public.invoices
    SELECT * FROM jsonb_populate_record(NULL::public.invoices, p_invoice)
    RETURNING id INTO v_invoice_id;

    -- Insert de items (puede estar vacio).
    IF jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) > 0 THEN
        INSERT INTO public.invoice_items (
            invoice_id, description, quantity, unit_price, total_price
        )
        SELECT
            v_invoice_id,
            COALESCE(item->>'description', ''),
            COALESCE((item->>'quantity')::numeric, 0),
            COALESCE((item->>'unit_price')::numeric, 0),
            COALESCE((item->>'total_price')::numeric, 0)
        FROM jsonb_array_elements(p_items) AS item;
    END IF;

    -- Increment next_invoice_number en profiles (atomico dentro de la tx).
    IF v_issuer IS NOT NULL THEN
        UPDATE public.profiles
            SET next_invoice_number = COALESCE(next_invoice_number, 0) + 1
            WHERE id = v_issuer;
    END IF;

    -- Devolver la factura como jsonb.
    SELECT row_to_json(i)::jsonb INTO v_invoice_row
        FROM public.invoices i WHERE i.id = v_invoice_id;

    RETURN v_invoice_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_invoice_with_items(jsonb, jsonb) TO authenticated;

-- 3. RPC: update_invoice_with_items
--    Actualiza factura, borra items previos e inserta los nuevos.
--    Todo dentro de la transaccion automatica de la funcion.
CREATE OR REPLACE FUNCTION public.update_invoice_with_items(
    p_invoice_id uuid,
    p_invoice jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_invoice_row jsonb;
BEGIN
    -- Update solo los campos provistos. Tomamos el row actual, mergeamos.
    UPDATE public.invoices SET
        contact_id       = COALESCE((p_invoice->>'contact_id')::uuid, contact_id),
        project_id       = COALESCE((p_invoice->>'project_id')::uuid, project_id),
        invoice_number   = COALESCE(p_invoice->>'invoice_number', invoice_number),
        status           = COALESCE(p_invoice->>'status', status),
        issue_date       = COALESCE((p_invoice->>'issue_date')::date, issue_date),
        due_date         = COALESCE((p_invoice->>'due_date')::date, due_date),
        paid_date        = COALESCE((p_invoice->>'paid_date')::date, paid_date),
        currency         = COALESCE(p_invoice->>'currency', currency),
        notes            = COALESCE(p_invoice->>'notes', notes),
        subtotal         = COALESCE((p_invoice->>'subtotal')::numeric, subtotal),
        tax_rate         = COALESCE((p_invoice->>'tax_rate')::numeric, tax_rate),
        tax_amount       = COALESCE((p_invoice->>'tax_amount')::numeric, tax_amount),
        irpf_rate        = COALESCE((p_invoice->>'irpf_rate')::numeric, irpf_rate),
        irpf_amount      = COALESCE((p_invoice->>'irpf_amount')::numeric, irpf_amount),
        template_id      = COALESCE((p_invoice->>'template_id')::uuid, template_id),
        config           = COALESCE((p_invoice->'config'), config),
        issuer_profile_id = COALESCE((p_invoice->>'issuer_profile_id')::uuid, issuer_profile_id),
        updated_at       = now()
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
    END IF;

    -- Reemplazar items: borra todos y reinsert. Si p_items es null, no reemplaza.
    IF p_items IS NOT NULL THEN
        DELETE FROM public.invoice_items WHERE invoice_id = p_invoice_id;

        IF jsonb_array_length(p_items) > 0 THEN
            INSERT INTO public.invoice_items (
                invoice_id, description, quantity, unit_price, total_price
            )
            SELECT
                p_invoice_id,
                COALESCE(item->>'description', ''),
                COALESCE((item->>'quantity')::numeric, 0),
                COALESCE((item->>'unit_price')::numeric, 0),
                COALESCE((item->>'total_price')::numeric, 0)
            FROM jsonb_array_elements(p_items) AS item;
        END IF;
    END IF;

    SELECT row_to_json(i)::jsonb INTO v_invoice_row
        FROM public.invoices i WHERE i.id = p_invoice_id;

    RETURN v_invoice_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_invoice_with_items(uuid, jsonb, jsonb) TO authenticated;

-- 4. Index complementario para consultas de aging y reports.
CREATE INDEX IF NOT EXISTS invoices_status_due_date_idx
    ON public.invoices (status, due_date)
    WHERE status IN ('sent', 'overdue');

CREATE INDEX IF NOT EXISTS invoices_created_by_idx
    ON public.invoices (created_by);
