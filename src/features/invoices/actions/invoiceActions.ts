'use server'

import { createClient } from '@/lib/supabase/server'
import {
    Invoice,
    InvoiceInsert,
    InvoiceItemInsert
} from '@/types/database'
import {
    prepareInvoiceCreatePayload,
    prepareInvoiceItemsCreatePayload,
} from '@/features/invoices/lib/invoiceCreatePayload'
import { revalidateTag } from 'next/cache'

interface GeneratedInvoiceItem {
    description: string
    quantity: number
    unit_price: number
}

export const generateInvoiceItemsAction = async (prompt: string): Promise<GeneratedInvoiceItem[]> => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    const cleanPrompt = prompt.trim()
    if (!cleanPrompt) {
        throw new Error('Describe al menos un producto o servicio')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Convierte una descripción informal en líneas de factura.
Devuelve SOLO JSON válido:
{
  "items": [
    { "description": "string", "quantity": number, "unit_price": number }
  ]
}
Reglas:
- quantity mínimo 1.
- unit_price es precio unitario sin IVA.
- Si el usuario da un total para varias unidades, calcula el precio unitario.
- Usa descripciones profesionales, breves y en español.
- No inventes líneas que no estén implícitas en el texto.`
                },
                {
                    role: 'user',
                    content: cleanPrompt
                }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
        }),
    })

    if (!response.ok) {
        throw new Error(`AI API error: ${await response.text()}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) throw new Error('No content from AI')

    const parsed = JSON.parse(content)
    const items = Array.isArray(parsed.items) ? parsed.items : []

    return items
        .map((item: Partial<GeneratedInvoiceItem>) => ({
            description: String(item.description || '').trim(),
            quantity: normalizePositiveNumber(item.quantity, 1),
            unit_price: normalizePositiveNumber(item.unit_price, 0),
        }))
        .filter((item: GeneratedInvoiceItem) => item.description && item.quantity > 0)
        .slice(0, 20)
}

function normalizePositiveNumber(value: unknown, fallback: number) {
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed < 0) return fallback
    return Number(parsed.toFixed(2))
}

/**
 * Crea factura + items atomicamente via RPC create_invoice_with_items.
 * Si la RPC no esta disponible (migration no aplicada) cae al flujo legacy.
 */
export const createInvoiceWithItemsAction = async (
    invoice: InvoiceInsert,
    items: InvoiceItemInsert[]
): Promise<Invoice> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Auto-completar created_by si no viene.
    if (!invoice.created_by && user) {
        invoice = { ...invoice, created_by: user.id }
    }

    const invoicePayload = prepareInvoiceCreatePayload(invoice, user?.id)
    const itemsPayload = prepareInvoiceItemsCreatePayload(items)

    // Llamada a la RPC transaccional. Cast porque las RPCs nuevas no están en los tipos generados.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('create_invoice_with_items', {
        p_invoice: invoicePayload,
        p_items: itemsPayload,
    })

    if (!rpcError && rpcData) {
        revalidateTag('invoices', 'max')
        return rpcData as Invoice
    }

    // Fallback legacy: la RPC no existe o falló por razón ajena al data.
    // Solo entramos aquí si el error es "function does not exist" (PostgREST 42883).
    const isMissingRpc = rpcError && (
        rpcError.code === '42883' ||
        rpcError.message?.includes('does not exist') ||
        rpcError.message?.includes('Could not find the function')
    )

    if (!isMissingRpc) {
        throw new Error(rpcError?.message || 'Error al crear la factura')
    }

    // Legacy path — mantiene compatibilidad mientras se aplica la migration.
    const supabaseAny = supabase as unknown as {
        from: (table: string) => {
            insert: (payload: unknown) => { select: () => { single: () => Promise<{ data: Invoice | null; error: { message: string } | null }> } } & Promise<{ error: { message: string } | null }>
            update: (payload: unknown) => { eq: (col: string, val: unknown) => Promise<{ error: { message: string } | null }> }
            select: (cols: string) => { eq: (col: string, val: unknown) => { single: () => Promise<{ data: { next_invoice_number: number } | null }> } }
        }
    }

    const { data: newInvoice, error: invoiceError } = await supabaseAny
        .from('invoices')
        .insert(invoicePayload)
        .select()
        .single()

    if (invoiceError || !newInvoice) throw new Error(invoiceError?.message || 'Insert invoice failed')

    if (itemsPayload.length > 0) {
        const itemsWithId = itemsPayload.map(item => ({ ...item, invoice_id: newInvoice.id }))
        const { error: itemsError } = await supabaseAny.from('invoice_items').insert(itemsWithId)
        if (itemsError) throw new Error(itemsError.message)
    }

    if (invoicePayload.issuer_profile_id) {
        const { data: profile } = await supabaseAny
            .from('profiles')
            .select('next_invoice_number')
            .eq('id', invoicePayload.issuer_profile_id)
            .single()
        if (profile && profile.next_invoice_number) {
            await supabaseAny
                .from('profiles')
                .update({ next_invoice_number: profile.next_invoice_number + 1 })
                .eq('id', invoicePayload.issuer_profile_id)
        }
    }

    revalidateTag('invoices', 'max')
    return newInvoice
}

export const generateInvoiceNumberAction = async (profileId?: string): Promise<string> => {
    const supabase = await createClient()

    if (profileId) {
        const supabaseAny = supabase as unknown as {
            from: (table: string) => { select: (cols: string) => { eq: (col: string, val: unknown) => { single: () => Promise<{ data: { invoice_prefix: string | null; next_invoice_number: number | null } | null }> } } }
        }
        const { data: profile } = await supabaseAny
            .from('profiles')
            .select('invoice_prefix, next_invoice_number')
            .eq('id', profileId)
            .single()

        if (profile) {
            const prefix = profile.invoice_prefix || 'INV-'
            const number = profile.next_invoice_number || 1
            return `${prefix}${number}`
        }
    }

    // Fallback Legacy: deriva del último número del año.
    const year = new Date().getFullYear()
    const supabaseAny = supabase as unknown as {
        from: (table: string) => { select: (cols: string) => { ilike: (col: string, val: string) => { order: (col: string, opts: object) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: { invoice_number: string | null } | null }> } } } } }
    }
    const { data } = await supabaseAny
        .from('invoices')
        .select('invoice_number')
        .ilike('invoice_number', `INV-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    let sequence = 1
    if (data?.invoice_number) {
        const parts = data.invoice_number.split('-')
        const lastSeq = parseInt(parts[2])
        if (!isNaN(lastSeq)) sequence = lastSeq + 1
    }

    return `INV-${year}-${sequence.toString().padStart(4, '0')}`
}

/**
 * Actualiza factura + items atomicamente via RPC.
 * Si la RPC no esta disponible, cae al flujo legacy.
 */
export const updateInvoiceWithItemsAction = async (
    id: string,
    invoice: Partial<Invoice>,
    items: InvoiceItemInsert[]
): Promise<void> => {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rpcError } = await (supabase as any).rpc('update_invoice_with_items', {
        p_invoice_id: id,
        p_invoice: invoice,
        p_items: items,
    })

    if (!rpcError) {
        revalidateTag('invoices', 'max')
        return
    }

    const isMissingRpc = rpcError.code === '42883' ||
        rpcError.message?.includes('does not exist') ||
        rpcError.message?.includes('Could not find the function')

    const isBrokenStatusEnumRpc = rpcError.code === '42804' ||
        rpcError.message?.includes('COALESCE types text and invoice_status cannot be matched')

    if (!isMissingRpc && !isBrokenStatusEnumRpc) {
        throw new Error(rpcError.message)
    }

    // Legacy fallback.
    const supabaseAny = supabase as unknown as {
        from: (table: string) => {
            update: (payload: unknown) => { eq: (col: string, val: unknown) => Promise<{ error: { message: string } | null }> }
            delete: () => { eq: (col: string, val: unknown) => Promise<{ error: { message: string } | null }> }
            insert: (payload: unknown) => Promise<{ error: { message: string } | null }>
        }
    }

    const { error: invoiceError } = await supabaseAny.from('invoices').update(invoice).eq('id', id)
    if (invoiceError) throw new Error(invoiceError.message)

    const { error: deleteError } = await supabaseAny.from('invoice_items').delete().eq('invoice_id', id)
    if (deleteError) throw new Error(deleteError.message)

    if (items.length > 0) {
        const itemsWithId = items.map(item => ({ ...item, invoice_id: id }))
        const { error: itemsError } = await supabaseAny.from('invoice_items').insert(itemsWithId)
        if (itemsError) throw new Error(itemsError.message)
    }

    revalidateTag('invoices', 'max')
}
