-- =====================================================================
-- INVOICE RPC GENERATED DEFAULTS
-- =====================================================================
-- Evita que create_invoice_with_items inserte NULL en columnas generadas
-- cuando el payload JSON no trae id/created_at/updated_at o las trae en null.
-- =====================================================================

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
    v_invoice_payload jsonb;
    v_now timestamptz := now();
BEGIN
    v_invoice_payload := COALESCE(p_invoice, '{}'::jsonb) - 'id' - 'created_at' - 'updated_at';

    IF NULLIF(v_invoice_payload->>'created_by', '') IS NULL AND auth.uid() IS NOT NULL THEN
        v_invoice_payload := v_invoice_payload || jsonb_build_object('created_by', auth.uid());
    END IF;

    -- Lock el perfil del emisor para evitar race condition en numeracion.
    v_issuer := NULLIF(v_invoice_payload->>'issuer_profile_id', '')::uuid;
    IF v_issuer IS NOT NULL THEN
        PERFORM 1 FROM public.profiles WHERE id = v_issuer FOR UPDATE;
    END IF;

    -- Insert de la factura. Forzamos columnas generadas para que el rowtype
    -- completo de jsonb_populate_record no anule defaults con NULL.
    INSERT INTO public.invoices
    SELECT * FROM jsonb_populate_record(
        NULL::public.invoices,
        v_invoice_payload || jsonb_build_object(
            'id', gen_random_uuid(),
            'created_at', v_now,
            'updated_at', v_now
        )
    )
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
        FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) AS item;
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
