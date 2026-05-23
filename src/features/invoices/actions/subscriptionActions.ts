'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import {
    invoiceSubscriptionCreateSchema,
    invoiceSubscriptionUpdateSchema,
    invoiceSubscriptionIdSchema,
} from '../schemas'
import type { InvoiceSubscription } from '@/types/database'

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error: string | null
}

/**
 * Crea una suscripcion de facturacion recurrente.
 * Verifica que la factura plantilla pertenece al usuario y deriva issuer_profile_id de ella.
 */
export async function createInvoiceSubscriptionAction(
    input: unknown
): Promise<ActionResult<{ id: string }>> {
    const parsed = invoiceSubscriptionCreateSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    // Validar ownership y obtener issuer_profile_id de la factura plantilla.
    const { data: template, error: templateError } = await supa
        .from('invoices')
        .select('id, contact_id, issuer_profile_id, created_by')
        .eq('id', parsed.data.template_invoice_id)
        .maybeSingle()

    if (templateError || !template) {
        return { success: false, error: 'Factura plantilla no encontrada' }
    }
    if (template.created_by !== user.id) {
        return { success: false, error: 'No autorizado sobre la factura plantilla' }
    }
    if (!template.issuer_profile_id) {
        return { success: false, error: 'La factura plantilla no tiene perfil emisor' }
    }
    if (template.contact_id !== parsed.data.contact_id) {
        return { success: false, error: 'La factura plantilla pertenece a otro contacto' }
    }

    const payload = {
        contact_id: parsed.data.contact_id,
        template_invoice_id: parsed.data.template_invoice_id,
        issuer_profile_id: template.issuer_profile_id,
        frequency: parsed.data.frequency,
        next_run_at: parsed.data.start_date,
        end_date: parsed.data.end_date ?? null,
        active: true,
        notes: parsed.data.notes ?? null,
        created_by: user.id,
    }

    const { data: inserted, error: insertError } = await supa
        .from('invoice_subscriptions')
        .insert(payload)
        .select('id')
        .single()

    if (insertError || !inserted) {
        return { success: false, error: insertError?.message || 'Error creando suscripción' }
    }

    revalidatePath(`/contacts/${parsed.data.contact_id}`)
    revalidatePath('/invoices/subscriptions')
    revalidateTag('invoices', 'max')

    return { success: true, data: { id: inserted.id }, error: null }
}

export async function updateInvoiceSubscriptionAction(input: unknown): Promise<ActionResult> {
    const parsed = invoiceSubscriptionUpdateSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { id, ...patch } = parsed.data

    // RLS ya restringe, pero verificamos para devolver error mas claro.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data: existing, error: fetchError } = await supa
        .from('invoice_subscriptions')
        .select('id, contact_id, created_by')
        .eq('id', id)
        .maybeSingle()

    if (fetchError || !existing) return { success: false, error: 'Suscripción no encontrada' }
    if (existing.created_by !== user.id) return { success: false, error: 'No autorizado' }

    const { error: updateError } = await supa
        .from('invoice_subscriptions')
        .update(patch)
        .eq('id', id)

    if (updateError) return { success: false, error: updateError.message }

    revalidatePath(`/contacts/${existing.contact_id}`)
    revalidatePath('/invoices/subscriptions')

    return { success: true, error: null }
}

export async function deleteInvoiceSubscriptionAction(input: unknown): Promise<ActionResult> {
    const parsed = invoiceSubscriptionIdSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data: existing, error: fetchError } = await supa
        .from('invoice_subscriptions')
        .select('contact_id, created_by')
        .eq('id', parsed.data.id)
        .maybeSingle()

    if (fetchError || !existing) return { success: false, error: 'Suscripción no encontrada' }
    if (existing.created_by !== user.id) return { success: false, error: 'No autorizado' }

    const { error: deleteError } = await supa
        .from('invoice_subscriptions')
        .delete()
        .eq('id', parsed.data.id)

    if (deleteError) return { success: false, error: deleteError.message }

    revalidatePath(`/contacts/${existing.contact_id}`)
    revalidatePath('/invoices/subscriptions')

    return { success: true, error: null }
}

/**
 * Lista suscripciones de un contacto (UI de detalle).
 */
export async function listSubscriptionsByContactAction(
    contactId: string
): Promise<ActionResult<InvoiceSubscription[]>> {
    if (!contactId || typeof contactId !== 'string') {
        return { success: false, error: 'contactId inválido' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data, error } = await supa
        .from('invoice_subscriptions')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data || []) as InvoiceSubscription[], error: null }
}

