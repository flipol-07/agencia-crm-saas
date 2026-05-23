'use server'

import { createClient } from '@/lib/supabase/server'
import type { Contact } from '@/types/database'
import { revalidateTag } from 'next/cache'
import {
    contactCreateSchema,
    contactUpdateSchema,
    formatZodError,
    type ContactCreateInput,
    type ContactUpdateInput,
} from '@/features/contacts/schemas'

type ActionResult<T> = { data: T | null; error: string | null }

function mapDbError(error: { code?: string; message?: string }): string {
    if (error.code === '23505') {
        const field = error.message?.includes('phone') ? 'teléfono' : 'email'
        return `Ya existe un contacto con este ${field}`
    }
    return error.message || 'Error desconocido'
}

export async function createContactAction(input: unknown): Promise<ActionResult<Contact>> {
    const parsed = contactCreateSchema.safeParse(input)
    if (!parsed.success) {
        return { data: null, error: formatZodError(parsed.error) }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { data: null, error: 'No autorizado' }
    }

    const payload: ContactCreateInput = {
        ...parsed.data,
        created_by: parsed.data.created_by ?? user.id,
        assigned_to: parsed.data.assigned_to ?? user.id,
    }

    // Cast minimo para evitar el `as any` masivo: solo el cliente Supabase necesita tipo libre.
    const supa = supabase as unknown as {
        from: (t: string) => {
            insert: (p: unknown) => { select: () => { single: () => Promise<{ data: Contact | null; error: { code?: string; message?: string } | null }> } }
        }
    }

    const { data, error } = await supa.from('contacts').insert(payload).select().single()

    if (error) return { data: null, error: mapDbError(error) }

    revalidateTag('contacts', 'max')
    return { data, error: null }
}

export async function updateContactAction(id: string, input: unknown): Promise<ActionResult<Contact>> {
    if (!id) return { data: null, error: 'ID requerido' }

    const parsed = contactUpdateSchema.safeParse(input)
    if (!parsed.success) {
        return { data: null, error: formatZodError(parsed.error) }
    }

    const supabase = await createClient()
    const payload: ContactUpdateInput = parsed.data

    const supa = supabase as unknown as {
        from: (t: string) => {
            update: (p: unknown) => { eq: (col: string, val: unknown) => { select: () => { single: () => Promise<{ data: Contact | null; error: { code?: string; message?: string } | null }> } } }
        }
    }

    const { data, error } = await supa.from('contacts').update(payload).eq('id', id).select().single()

    if (error) return { data: null, error: mapDbError(error) }

    revalidateTag('contacts', 'max')
    return { data, error: null }
}

export async function deleteContactAction(id: string): Promise<{ success: boolean; error: string | null }> {
    if (!id) return { success: false, error: 'ID requerido' }

    const supabase = await createClient()
    const supa = supabase as unknown as {
        from: (t: string) => { delete: () => { eq: (col: string, val: unknown) => Promise<{ error: { message: string } | null }> } }
    }
    const { error } = await supa.from('contacts').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidateTag('contacts', 'max')
    return { success: true, error: null }
}
