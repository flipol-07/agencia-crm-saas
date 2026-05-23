-- =====================================================================
-- INVOICE STATUS: 'quote' (presupuesto)
-- =====================================================================
-- Si invoices.status es text, no requiere ALTER TYPE.
-- Si fuera un ENUM nativo, descomenta la linea de ADD VALUE.
-- Comprobamos primero el tipo de la columna.
-- =====================================================================

DO $$
DECLARE
    v_type text;
BEGIN
    SELECT data_type INTO v_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'status';

    -- Si es un enum tipado, anyadir el valor.
    IF v_type = 'USER-DEFINED' THEN
        -- Detectamos el nombre del enum y a$nyadimos quote si no existe.
        PERFORM 1 FROM pg_type t
            JOIN pg_enum e ON e.enumtypid = t.oid
            WHERE t.typname = 'invoice_status' AND e.enumlabel = 'quote';
        IF NOT FOUND THEN
            EXECUTE 'ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS ''quote''';
        END IF;
    END IF;
    -- Si es text/varchar, no hay que hacer nada (string libre).
END $$;

-- Columna opcional para enlazar un quote convertido a factura.
ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS converted_from_quote_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invoices_converted_from_quote_idx
    ON public.invoices (converted_from_quote_id)
    WHERE converted_from_quote_id IS NOT NULL;
