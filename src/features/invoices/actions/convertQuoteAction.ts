'use server'

import { createClient } from '@/lib/supabase/server'
import {
    prepareInvoiceCreatePayload,
    prepareInvoiceItemsCreatePayload,
} from '@/features/invoices/lib/invoiceCreatePayload'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { generateInvoiceNumberAction } from './invoiceActions'

const schema = z.object({
    quoteId: z.string().uuid('ID inválido'),
})

interface Result {
    success: boolean
    invoiceId?: string
    invoiceNumber?: string
    error: string | null
}

/**
 * Convierte un quote (presupuesto) en factura:
 * - Duplica el quote como nueva factura con status 'draft'
 * - Copia items
 * - Asigna nuevo invoice_number
 * - Enlaza ambos con converted_from_quote_id
 */
export async function convertQuoteToInvoiceAction(input: unknown): Promise<Result> {
    const parsed = schema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any

    // Cargar el quote + items.
    const { data: quoteRow, error: quoteError } = await supa
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', parsed.data.quoteId)
        .eq('created_by', user.id)
        .maybeSingle()

    if (quoteError || !quoteRow) {
        return { success: false, error: 'Presupuesto no encontrado' }
    }
    if (quoteRow.status !== 'quote') {
        return { success: false, error: 'Este documento no es un presupuesto' }
    }

    // Generar número de factura nuevo.
    const newNumber = await generateInvoiceNumberAction(quoteRow.issuer_profile_id || undefined)

    // Construir payload de la nueva factura (sin id/created_at).
    const newInvoice = {
        contact_id: quoteRow.contact_id,
        project_id: quoteRow.project_id,
        invoice_number: newNumber,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: quoteRow.due_date,
        currency: quoteRow.currency,
        notes: quoteRow.notes,
        subtotal: quoteRow.subtotal,
        tax_rate: quoteRow.tax_rate,
        tax_amount: quoteRow.tax_amount,
        irpf_rate: quoteRow.irpf_rate,
        irpf_amount: quoteRow.irpf_amount,
        template_id: quoteRow.template_id,
        config: quoteRow.config,
        issuer_profile_id: quoteRow.issuer_profile_id,
        created_by: user.id,
        converted_from_quote_id: quoteRow.id,
    }

    const items = (quoteRow.invoice_items || []).map((it: { description: string; quantity: number; unit_price: number; total_price: number }) => ({
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
    }))
    const invoicePayload = prepareInvoiceCreatePayload(newInvoice, user.id)
    const itemsPayload = prepareInvoiceItemsCreatePayload(items)

    // Intentar via RPC (atómico). Cast porque las RPCs nuevas no están en los tipos generados.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('create_invoice_with_items', {
        p_invoice: invoicePayload,
        p_items: itemsPayload,
    })

    if (!rpcError && rpcData) {
        revalidateTag('invoices', 'max')
        return {
            success: true,
            invoiceId: (rpcData as { id: string }).id,
            invoiceNumber: newNumber,
            error: null,
        }
    }

    // Fallback legacy si RPC no aplicada.
    const { data: inserted, error: insertError } = await supa
        .from('invoices')
        .insert(invoicePayload)
        .select('id')
        .single()

    if (insertError || !inserted) {
        return { success: false, error: insertError?.message || 'Error creando factura' }
    }

    if (itemsPayload.length > 0) {
        const itemsWithId = itemsPayload.map((i) => ({ ...i, invoice_id: inserted.id }))
        const { error: itemsError } = await supa.from('invoice_items').insert(itemsWithId)
        if (itemsError) {
            // Rollback manual del invoice.
            await supa.from('invoices').delete().eq('id', inserted.id)
            return { success: false, error: itemsError.message }
        }
    }

    revalidateTag('invoices', 'max')
    return {
        success: true,
        invoiceId: inserted.id,
        invoiceNumber: newNumber,
        error: null,
    }
}
