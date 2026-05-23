-- =====================================================================
-- CONTACTS: full-text search e indices, duplicate detection
-- =====================================================================

-- 1. Extension para fuzzy match en nombres de empresa.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Indices para busqueda y paginacion eficiente.
CREATE INDEX IF NOT EXISTS contacts_company_name_trgm_idx
    ON public.contacts USING gin (company_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS contacts_contact_name_trgm_idx
    ON public.contacts USING gin (contact_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS contacts_email_lower_idx
    ON public.contacts (lower(email));

CREATE INDEX IF NOT EXISTS contacts_phone_idx
    ON public.contacts (phone);

CREATE INDEX IF NOT EXISTS contacts_pipeline_stage_idx
    ON public.contacts (pipeline_stage);

CREATE INDEX IF NOT EXISTS contacts_created_by_idx
    ON public.contacts (created_by);

CREATE INDEX IF NOT EXISTS contacts_assigned_to_idx
    ON public.contacts (assigned_to);

CREATE INDEX IF NOT EXISTS contacts_source_idx
    ON public.contacts (source);

-- 3. RPC para deteccion de duplicados.
--    Devuelve pares (a, b) con similaridad > umbral.
CREATE OR REPLACE FUNCTION public.find_contact_duplicates(
    p_user_id uuid,
    p_threshold numeric DEFAULT 0.8
)
RETURNS TABLE (
    contact_a_id uuid,
    contact_b_id uuid,
    company_a text,
    company_b text,
    email_match boolean,
    phone_match boolean,
    name_similarity numeric,
    score numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    WITH owned AS (
        SELECT id, company_name, contact_name, email, phone
        FROM public.contacts
        WHERE created_by = p_user_id OR assigned_to = p_user_id
    )
    SELECT
        a.id AS contact_a_id,
        b.id AS contact_b_id,
        a.company_name AS company_a,
        b.company_name AS company_b,
        (lower(a.email) = lower(b.email) AND a.email IS NOT NULL) AS email_match,
        (a.phone = b.phone AND a.phone IS NOT NULL) AS phone_match,
        similarity(coalesce(a.company_name, ''), coalesce(b.company_name, ''))::numeric AS name_similarity,
        (
            CASE WHEN lower(a.email) = lower(b.email) AND a.email IS NOT NULL THEN 1.0 ELSE 0 END +
            CASE WHEN a.phone = b.phone AND a.phone IS NOT NULL THEN 0.6 ELSE 0 END +
            similarity(coalesce(a.company_name, ''), coalesce(b.company_name, ''))::numeric * 0.5
        )::numeric AS score
    FROM owned a
    JOIN owned b ON b.id > a.id
    WHERE
        (lower(a.email) = lower(b.email) AND a.email IS NOT NULL)
        OR (a.phone = b.phone AND a.phone IS NOT NULL)
        OR similarity(coalesce(a.company_name, ''), coalesce(b.company_name, '')) > p_threshold
    ORDER BY score DESC
    LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.find_contact_duplicates(uuid, numeric) TO authenticated;
