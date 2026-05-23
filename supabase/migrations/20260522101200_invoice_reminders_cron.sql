-- =====================================================================
-- INVOICE REMINDERS — cron nativo en Supabase (pg_cron + pg_net)
-- =====================================================================
-- Mueve el schedule de Vercel Cron a Supabase para evitar coste extra.
-- Como el endpoint envia emails con nodemailer (no portable a PL/pgSQL),
-- usamos pg_net para hacer HTTP GET al endpoint con el header de auth.
--
-- Setup necesario despues de aplicar la migration:
--   INSERT INTO public.cron_config (app_url, cron_secret)
--   VALUES ('https://tu-app.vercel.app', 'tu-CRON_SECRET');
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------------------------------------------------------------------
-- Config singleton: guarda la URL del app y el CRON_SECRET.
-- Acceso restringido: sin policies = solo postgres/service_role pueden leer.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cron_config (
    id boolean PRIMARY KEY DEFAULT true,
    app_url text NOT NULL,
    cron_secret text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cron_config_singleton CHECK (id)
);

ALTER TABLE public.cron_config ENABLE ROW LEVEL SECURITY;
-- Sin policies = nadie de roles authenticated/anon puede leer. Solo postgres
-- (via SECURITY DEFINER) y service_role (bypassea RLS).
REVOKE ALL ON TABLE public.cron_config FROM PUBLIC, authenticated, anon;

-- ---------------------------------------------------------------------
-- Funcion: dispara el endpoint de reminders via HTTP.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_invoice_reminders()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_url text;
    v_secret text;
    v_request_id bigint;
BEGIN
    SELECT app_url, cron_secret INTO v_url, v_secret
        FROM public.cron_config LIMIT 1;

    IF v_url IS NULL OR v_secret IS NULL THEN
        RAISE EXCEPTION 'cron_config no inicializado. INSERT app_url y cron_secret antes de usar el cron.';
    END IF;

    SELECT net.http_get(
        url := v_url || '/api/cron/invoice-reminders',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || v_secret,
            'Content-Type', 'application/json'
        ),
        timeout_milliseconds := 60000
    ) INTO v_request_id;

    RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_invoice_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_invoice_reminders() TO postgres;

-- ---------------------------------------------------------------------
-- (Opcional) Wrapper del cron de suscripciones tambien via tabla config,
-- por si en el futuro quieres consolidar credenciales en un solo sitio.
-- El cron actual no necesita HTTP (todo es SQL), asi que esto es solo
-- documentacion: invoice-subscriptions-daily ya esta programado en la
-- migration 20260522101100_invoice_subscriptions_cron.sql.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Schedule pg_cron: diario a las 08:00 UTC (mismo horario que Vercel Cron).
-- Idempotente: borra el job previo si existe.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    v_job_id int;
BEGIN
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'invoice-reminders-daily';
    IF v_job_id IS NOT NULL THEN
        PERFORM cron.unschedule(v_job_id);
    END IF;

    PERFORM cron.schedule(
        'invoice-reminders-daily',
        '0 8 * * *',
        $cron$SELECT public.trigger_invoice_reminders();$cron$
    );
END $$;
