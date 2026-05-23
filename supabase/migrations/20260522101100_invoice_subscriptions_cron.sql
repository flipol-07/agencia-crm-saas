-- =====================================================================
-- INVOICE SUBSCRIPTIONS — cron nativo en Supabase (pg_cron)
-- =====================================================================
-- Funcion que procesa todas las suscripciones activas vencidas y genera
-- las facturas correspondientes. Reusa el RPC create_invoice_with_items
-- (que incrementa next_invoice_number atomicamente).
-- Programado con pg_cron en lugar de Vercel Cron para evitar coste extra.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.process_invoice_subscriptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today date := CURRENT_DATE;
    v_sub record;
    v_template record;
    v_items jsonb;
    v_profile record;
    v_invoice_number text;
    v_due_offset_days int;
    v_invoice_payload jsonb;
    v_next_run date;
    v_processed int := 0;
    v_created int := 0;
    v_deactivated int := 0;
    v_failures text[] := ARRAY[]::text[];
BEGIN
    FOR v_sub IN
        SELECT * FROM public.invoice_subscriptions
        WHERE active = true AND next_run_at <= v_today
        ORDER BY next_run_at ASC
    LOOP
        v_processed := v_processed + 1;
        BEGIN
            -- end_date ya pasado: marcar inactiva y saltar.
            IF v_sub.end_date IS NOT NULL AND v_sub.end_date < v_today THEN
                UPDATE public.invoice_subscriptions SET active = false WHERE id = v_sub.id;
                v_deactivated := v_deactivated + 1;
                CONTINUE;
            END IF;

            -- 1. Factura plantilla
            SELECT * INTO v_template
                FROM public.invoices
                WHERE id = v_sub.template_invoice_id;
            IF NOT FOUND THEN
                v_failures := array_append(v_failures, format('Template not found for sub %s', v_sub.id));
                CONTINUE;
            END IF;

            -- 2. Items de la plantilla
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'description', description,
                'quantity', quantity,
                'unit_price', unit_price,
                'total_price', total_price
            )), '[]'::jsonb)
            INTO v_items
            FROM public.invoice_items
            WHERE invoice_id = v_template.id;

            -- 3. Perfil emisor (para numeracion)
            SELECT * INTO v_profile
                FROM public.profiles
                WHERE id = v_sub.issuer_profile_id;
            IF NOT FOUND THEN
                v_failures := array_append(v_failures, format('Profile not found for sub %s', v_sub.id));
                CONTINUE;
            END IF;

            v_invoice_number := COALESCE(v_profile.invoice_prefix, 'INV-')
                || COALESCE(v_profile.next_invoice_number, 1);

            -- 4. due_date: respeta el delta de la plantilla, default 30 dias
            IF v_template.due_date IS NOT NULL AND v_template.issue_date IS NOT NULL THEN
                v_due_offset_days := GREATEST(0, v_template.due_date - v_template.issue_date);
            ELSE
                v_due_offset_days := 30;
            END IF;

            -- 5. Payload nueva factura
            v_invoice_payload := jsonb_build_object(
                'contact_id', v_template.contact_id,
                'project_id', v_template.project_id,
                'invoice_number', v_invoice_number,
                'status', 'draft',
                'issue_date', v_today,
                'due_date', v_today + v_due_offset_days,
                'currency', v_template.currency,
                'notes', v_template.notes,
                'subtotal', v_template.subtotal,
                'tax_rate', v_template.tax_rate,
                'tax_amount', v_template.tax_amount,
                'irpf_rate', v_template.irpf_rate,
                'irpf_amount', v_template.irpf_amount,
                'template_id', v_template.template_id,
                'config', v_template.config,
                'issuer_profile_id', v_sub.issuer_profile_id,
                'created_by', v_sub.created_by
            );

            -- 6. Crear factura via RPC (incrementa next_invoice_number en la misma tx)
            PERFORM public.create_invoice_with_items(v_invoice_payload, v_items);
            v_created := v_created + 1;

            -- 7. Calcular siguiente next_run_at
            v_next_run := (v_today + CASE v_sub.frequency
                WHEN 'monthly'   THEN interval '1 month'
                WHEN 'quarterly' THEN interval '3 months'
                WHEN 'yearly'    THEN interval '1 year'
            END)::date;

            -- 8. Avanzar la suscripcion
            UPDATE public.invoice_subscriptions
            SET
                last_run_at = v_today,
                next_run_at = v_next_run,
                occurrences_count = COALESCE(occurrences_count, 0) + 1,
                active = CASE
                    WHEN end_date IS NOT NULL AND v_next_run > end_date THEN false
                    ELSE active
                END
            WHERE id = v_sub.id;

            IF v_sub.end_date IS NOT NULL AND v_next_run > v_sub.end_date THEN
                v_deactivated := v_deactivated + 1;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_failures := array_append(v_failures, format('Sub %s: %s', v_sub.id, SQLERRM));
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'processed', v_processed,
        'invoices_created', v_created,
        'deactivated', v_deactivated,
        'failures', to_jsonb(v_failures),
        'run_at', now()
    );
END;
$$;

-- Permisos: la funcion la invocan pg_cron (postgres) y nadie mas.
REVOKE ALL ON FUNCTION public.process_invoice_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_invoice_subscriptions() TO postgres;

-- Schedule pg_cron: diario a las 07:00 UTC.
-- Idempotente: borra el job previo si existe.
DO $$
DECLARE
    v_job_id int;
BEGIN
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'invoice-subscriptions-daily';
    IF v_job_id IS NOT NULL THEN
        PERFORM cron.unschedule(v_job_id);
    END IF;

    PERFORM cron.schedule(
        'invoice-subscriptions-daily',
        '0 7 * * *',
        $cron$SELECT public.process_invoice_subscriptions();$cron$
    );
END $$;
