-- =====================================================================
-- INVOICE UPDATE RPC STATUS ENUM CAST
-- =====================================================================
-- Evita el error "COALESCE types text and invoice_status cannot be matched"
-- al actualizar facturas desde JSONB. p_invoice->>'status' devuelve text,
-- pero invoices.status es el enum public.invoice_status.
-- =====================================================================

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
    -- Update solo los campos provistos. Casteamos status al enum real.
    UPDATE public.invoices SET
        contact_id        = COALESCE((p_invoice->>'contact_id')::uuid, contact_id),
        project_id        = COALESCE((p_invoice->>'project_id')::uuid, project_id),
        invoice_number    = COALESCE(p_invoice->>'invoice_number', invoice_number),
        status            = COALESCE(NULLIF(p_invoice->>'status', '')::public.invoice_status, status),
        issue_date        = COALESCE((p_invoice->>'issue_date')::date, issue_date),
        due_date          = COALESCE((p_invoice->>'due_date')::date, due_date),
        paid_date         = COALESCE((p_invoice->>'paid_date')::date, paid_date),
        currency          = COALESCE(p_invoice->>'currency', currency),
        notes             = COALESCE(p_invoice->>'notes', notes),
        subtotal          = COALESCE((p_invoice->>'subtotal')::numeric, subtotal),
        tax_rate          = COALESCE((p_invoice->>'tax_rate')::numeric, tax_rate),
        tax_amount        = COALESCE((p_invoice->>'tax_amount')::numeric, tax_amount),
        irpf_rate         = COALESCE((p_invoice->>'irpf_rate')::numeric, irpf_rate),
        irpf_amount       = COALESCE((p_invoice->>'irpf_amount')::numeric, irpf_amount),
        total             = COALESCE((p_invoice->>'total')::numeric, total),
        template_id       = COALESCE((p_invoice->>'template_id')::uuid, template_id),
        config            = COALESCE((p_invoice->'config'), config),
        issuer_profile_id = COALESCE((p_invoice->>'issuer_profile_id')::uuid, issuer_profile_id),
        updated_at        = now()
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
