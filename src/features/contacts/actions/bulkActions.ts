'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

const idsSchema = z.array(z.string().uuid()).min(1, 'Selecciona al menos un contacto').max(500, 'Demasiados contactos seleccionados')

type Result = { success: boolean; affected: number; error: string | null }

async function ownedByUser(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[], userId: string): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('contacts') as any)
        .select('id')
        .in('id', ids)
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    if (error) return []
    return ((data || []) as { id: string }[]).map(r => r.id)
}

export async function bulkDeleteContactsAction(ids: string[]): Promise<Result> {
    const parsed = idsSchema.safeParse(ids)
    if (!parsed.success) return { success: false, affected: 0, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, affected: 0, error: 'No autorizado' }

    const owned = await ownedByUser(supabase, parsed.data, user.id)
    if (owned.length === 0) return { success: false, affected: 0, error: 'Sin contactos eliminables' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('contacts') as any).delete().in('id', owned)
    if (error) return { success: false, affected: 0, error: error.message }

    revalidateTag('contacts', 'max')
    return { success: true, affected: owned.length, error: null }
}

const stageSchema = z.enum(['nuevo', 'cualificacion', 'propuesta', 'enviada', 'ganado', 'perdido'])

export async function bulkUpdateStageAction(ids: string[], stage: string): Promise<Result> {
    const parsedIds = idsSchema.safeParse(ids)
    if (!parsedIds.success) return { success: false, affected: 0, error: parsedIds.error.issues[0].message }
    const parsedStage = stageSchema.safeParse(stage)
    if (!parsedStage.success) return { success: false, affected: 0, error: 'Fase no válida' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, affected: 0, error: 'No autorizado' }

    const owned = await ownedByUser(supabase, parsedIds.data, user.id)
    if (owned.length === 0) return { success: false, affected: 0, error: 'Sin contactos editables' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('contacts') as any)
        .update({ pipeline_stage: parsedStage.data })
        .in('id', owned)

    if (error) return { success: false, affected: 0, error: error.message }

    revalidateTag('contacts', 'max')
    return { success: true, affected: owned.length, error: null }
}

export async function bulkAssignContactsAction(ids: string[], assignedTo: string): Promise<Result> {
    const parsedIds = idsSchema.safeParse(ids)
    if (!parsedIds.success) return { success: false, affected: 0, error: parsedIds.error.issues[0].message }
    const parsedAssignee = z.string().uuid().safeParse(assignedTo)
    if (!parsedAssignee.success) return { success: false, affected: 0, error: 'Usuario no válido' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, affected: 0, error: 'No autorizado' }

    const owned = await ownedByUser(supabase, parsedIds.data, user.id)
    if (owned.length === 0) return { success: false, affected: 0, error: 'Sin contactos editables' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('contacts') as any)
        .update({ assigned_to: parsedAssignee.data })
        .in('id', owned)

    if (error) return { success: false, affected: 0, error: error.message }

    revalidateTag('contacts', 'max')
    return { success: true, affected: owned.length, error: null }
}
