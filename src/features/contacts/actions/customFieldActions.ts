'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { CustomFieldDefinition, CustomFieldType } from '@/types/database'

const TYPES: CustomFieldType[] = ['text', 'textarea', 'number', 'date', 'select', 'checkbox']

const createSchema = z.object({
    label: z.string().trim().min(1, 'Label requerido').max(80),
    name: z.string().trim().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guion bajo').optional(),
    type: z.enum(TYPES as [CustomFieldType, ...CustomFieldType[]]),
    options: z.array(z.string().trim().min(1)).max(50).optional(),
    required: z.boolean().optional(),
    position: z.number().int().min(0).max(9999).optional(),
})

const updateSchema = z.object({
    id: z.string().uuid(),
    label: z.string().trim().min(1).max(80).optional(),
    type: z.enum(TYPES as [CustomFieldType, ...CustomFieldType[]]).optional(),
    options: z.array(z.string().trim().min(1)).max(50).optional().nullable(),
    required: z.boolean().optional(),
    position: z.number().int().min(0).max(9999).optional(),
})

const idSchema = z.object({ id: z.string().uuid() })

function slugify(label: string): string {
    return label
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 40) || 'field'
}

interface Result<T = void> {
    success: boolean
    data?: T
    error: string | null
}

export async function listCustomFieldDefinitionsAction(): Promise<Result<CustomFieldDefinition[]>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data, error } = await supa
        .from('custom_field_definitions')
        .select('*')
        .eq('entity', 'contact')
        .eq('created_by', user.id)
        .order('position', { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data || []) as CustomFieldDefinition[], error: null }
}

export async function createCustomFieldDefinitionAction(input: unknown): Promise<Result<{ id: string }>> {
    const parsed = createSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const name = parsed.data.name || slugify(parsed.data.label)
    if (parsed.data.type === 'select' && (!parsed.data.options || parsed.data.options.length === 0)) {
        return { success: false, error: 'Los campos tipo select requieren al menos una opción' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const payload = {
        entity: 'contact',
        name,
        label: parsed.data.label,
        type: parsed.data.type,
        options: parsed.data.type === 'select' ? (parsed.data.options || []) : null,
        required: parsed.data.required ?? false,
        position: parsed.data.position ?? 0,
        created_by: user.id,
    }

    const { data, error } = await supa
        .from('custom_field_definitions')
        .insert(payload)
        .select('id')
        .single()

    if (error || !data) return { success: false, error: error?.message || 'Error creando campo' }

    revalidatePath('/settings/custom-fields')
    revalidatePath('/contacts')
    return { success: true, data: { id: data.id }, error: null }
}

export async function updateCustomFieldDefinitionAction(input: unknown): Promise<Result> {
    const parsed = updateSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { id, ...patch } = parsed.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { error } = await supa
        .from('custom_field_definitions')
        .update(patch)
        .eq('id', id)
        .eq('created_by', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/settings/custom-fields')
    revalidatePath('/contacts')
    return { success: true, error: null }
}

export async function deleteCustomFieldDefinitionAction(input: unknown): Promise<Result> {
    const parsed = idSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { error } = await supa
        .from('custom_field_definitions')
        .delete()
        .eq('id', parsed.data.id)
        .eq('created_by', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/settings/custom-fields')
    revalidatePath('/contacts')
    return { success: true, error: null }
}
