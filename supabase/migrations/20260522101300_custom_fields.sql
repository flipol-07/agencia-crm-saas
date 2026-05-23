-- =====================================================================
-- CUSTOM FIELDS — definiciones dinamicas por usuario
-- =====================================================================
-- Cada usuario puede definir N campos extra para sus contactos. Los
-- valores se guardan en contacts.custom_fields (jsonb) sin migrations
-- adicionales.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity text NOT NULL DEFAULT 'contact' CHECK (entity IN ('contact')),
    name text NOT NULL,                  -- clave interna (slug)
    label text NOT NULL,                 -- etiqueta visible
    type text NOT NULL CHECK (type IN ('text', 'textarea', 'number', 'date', 'select', 'checkbox')),
    options jsonb,                       -- para type='select': string[]; null para el resto
    position int NOT NULL DEFAULT 0,
    required boolean NOT NULL DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (created_by, entity, name)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_defs_owner
    ON public.custom_field_definitions (created_by, entity, position);

ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cfd_select_owner" ON public.custom_field_definitions;
CREATE POLICY "cfd_select_owner" ON public.custom_field_definitions
    FOR SELECT TO authenticated
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "cfd_insert_owner" ON public.custom_field_definitions;
CREATE POLICY "cfd_insert_owner" ON public.custom_field_definitions
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "cfd_update_owner" ON public.custom_field_definitions;
CREATE POLICY "cfd_update_owner" ON public.custom_field_definitions
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "cfd_delete_owner" ON public.custom_field_definitions;
CREATE POLICY "cfd_delete_owner" ON public.custom_field_definitions
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- updated_at trigger reusando funcion existente.
CREATE OR REPLACE FUNCTION public.set_cfd_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cfd_updated_at ON public.custom_field_definitions;
CREATE TRIGGER trg_cfd_updated_at
    BEFORE UPDATE ON public.custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION public.set_cfd_updated_at();
