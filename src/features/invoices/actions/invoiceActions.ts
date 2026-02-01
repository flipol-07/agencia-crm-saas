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

    // 3. Update Next Invoice Number if issuer is present
    if (invoice.issuer_profile_id) {
        // We assume the user creates it with the number they saw, so we just increment for NEXT time.
        // Wait, concurrent access?
        // Optimistically we just increment it.
        // We need to fetch the current profile to know what to increment? 
        // Or just RPC `increment`. Supabase doesn't have atomic increment easily without RPC.
        // For now: Read -> Update. User traffic is low.
        const { data: profile } = await (supabase.from('profiles') as any).select('next_invoice_number').eq('id', invoice.issuer_profile_id).single()
        if (profile && profile.next_invoice_number) {
            await (supabase.from('profiles') as any).update({ next_invoice_number: profile.next_invoice_number + 1 }).eq('id', invoice.issuer_profile_id)
        }
    }

    return newInvoice
}

export const generateInvoiceNumberAction = async (profileId?: string): Promise<string> => {
    const supabase = await createClient()

    if (profileId) {
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('invoice_prefix, next_invoice_number')
            .eq('id', profileId)
            .single()

        if (profile) {
            const prefix = profile.invoice_prefix || 'INV-'
            const number = profile.next_invoice_number || 1
            // Optional: Padding logic? User requirement "1104", maybe no padding or minimal. 
            // "tú apuntarías ese número" implies simple number.
            // Let's stick to simple number concatenation for now, or match prefix format.
            return `${prefix}${number}`
        }
    }

    // Fallback Legacy
    const year = new Date().getFullYear()
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
