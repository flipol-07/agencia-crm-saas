'use server'

import { createClient } from '@/lib/supabase/server'
import {
    Invoice,
    InvoiceInsert,
    InvoiceItemInsert
} from '@/types/database'
import { revalidateTag } from 'next/cache'

export const createInvoiceWithItemsAction = async (
    invoice: InvoiceInsert,
    items: InvoiceItemInsert[]
): Promise<Invoice> => {
    const supabase = await createClient()

    // 1. Crear Factura
    const { data: newInvoice, error: invoiceError } = await (supabase.from('invoices') as any)
        .insert(invoice as any)
        .select()
        .single()

    if (invoiceError) throw new Error(invoiceError.message)

    // 2. Crear Items
    if (items.length > 0) {
        const itemsWithId = items.map(item => ({
            ...item,
            invoice_id: (newInvoice as any).id
        }))

        const { error: itemsError } = await (supabase.from('invoice_items') as any)
            .insert(itemsWithId)

        if (itemsError) throw new Error(itemsError.message)
    }

    return newInvoice
}

export const generateInvoiceNumberAction = async (): Promise<string> => {
    const year = new Date().getFullYear()
    const supabase = await createClient()

    const { data } = await (supabase.from('invoices') as any)
        .select('invoice_number')
        .ilike('invoice_number', `INV-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    let sequence = 1
    if (data && (data as any).invoice_number) {
        const parts = (data as any).invoice_number.split('-')
        const lastSeq = parseInt(parts[2])
        if (!isNaN(lastSeq)) sequence = lastSeq + 1
    }

    return `INV-${year}-${sequence.toString().padStart(4, '0')}`
}

export const updateInvoiceWithItemsAction = async (
    id: string,
    invoice: Partial<Invoice>,
    items: InvoiceItemInsert[]
): Promise<void> => {
    const supabase = await createClient()

    const { error: invoiceError } = await (supabase.from('invoices') as any)
        .update(invoice as any)
        .eq('id', id)

    if (invoiceError) throw new Error(invoiceError.message)

    const { error: deleteError } = await (supabase.from('invoice_items') as any)
        .delete()
        .eq('invoice_id', id)

    if (deleteError) throw new Error(deleteError.message)

    if (items.length > 0) {
        const itemsWithId = items.map(item => ({
            ...item,
            invoice_id: id
        }))

        const { error: itemsError } = await (supabase.from('invoice_items') as any)
            .insert(itemsWithId)

        if (itemsError) throw new Error(itemsError.message)
    }
}
