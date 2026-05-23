'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import type { Contact } from '@/types/database'

const mergeSchema = z.object({
    keepId: z.string().uuid(),
    discardId: z.string().uuid(),
})

interface Result { success: boolean; error: string | null }

/**
 * Fusiona dos contactos: keepId conserva la identidad, discardId se elimina.
 * Antes de borrar, reasigna todos los registros relacionados (invoices, projects,
 * contact_files, contact_emails) a keepId, y rellena campos vacíos de keepId
 * con valores de discardId (merge no destructivo).
 */
export async function mergeContactsAction(input: unknown): Promise<Result> {
    const parsed = mergeSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: 'Datos inválidos' }
    const { keepId, discardId } = parsed.data
    if (keepId === discardId) return { success: false, error: 'No se puede fusionar consigo mismo' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    // Verifica ownership de ambos.
    const { data: contactsData } = await supa.from('contacts')
        .select('*')
        .in('id', [keepId, discardId])
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)

    const contacts = (contactsData || []) as Contact[]
    if (contacts.length !== 2) {
        return { success: false, error: 'No tienes acceso a alguno de los contactos' }
    }

    const keep = contacts.find(c => c.id === keepId)!
    const discard = contacts.find(c => c.id === discardId)!

    // Rellena campos vacíos de keep con valores de discard (merge no destructivo).
    const patch: Record<string, unknown> = {}
    const fields = ['contact_name', 'email', 'phone', 'tax_id', 'tax_address', 'website', 'notes', 'ai_description'] as const
    for (const f of fields) {
        if (!keep[f] && discard[f]) patch[f] = discard[f]
    }
    if (Object.keys(patch).length > 0) {
        const { error } = await supa.from('contacts').update(patch).eq('id', keepId)
        if (error) return { success: false, error: `Actualizar keep: ${error.message}` }
    }

    // Reasigna relaciones. Si las tablas no existen, ignoramos el error.
    const relatedTables = [
        { table: 'invoices', col: 'contact_id' },
        { table: 'projects', col: 'contact_id' },
        { table: 'contact_files', col: 'contact_id' },
        { table: 'contact_emails', col: 'contact_id' },
        { table: 'tasks', col: 'contact_id' },
    ]
    for (const { table, col } of relatedTables) {
        const { error } = await supa.from(table).update({ [col]: keepId }).eq(col, discardId)
        if (error && error.code !== '42P01') {
            // 42P01 = undefined_table. Cualquier otro error lo devolvemos.
            return { success: false, error: `Reasignar ${table}: ${error.message}` }
        }
    }

    // Borra el discard.
    const { error: delError } = await supa.from('contacts').delete().eq('id', discardId)
    if (delError) return { success: false, error: `Borrar duplicado: ${delError.message}` }

    revalidateTag('contacts', 'max')
    return { success: true, error: null }
}
