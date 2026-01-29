
import { createClient } from '@/lib/supabase/client'
import {
    Invoice,
    InvoiceInsert,
    InvoiceItemInsert,
    InvoiceWithDetails
} from '@/types/database'

export const getInvoices = async (): Promise<InvoiceWithDetails[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('invoices')
        .select(`
            *,
            contacts (
                id,
                company_name,
                contact_name,
                tax_id,
                tax_address,
                email,
                phone
            ),
            invoice_items (*)
        `)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as InvoiceWithDetails[]
}

export const createInvoiceWithItems = async (
    invoice: InvoiceInsert,
    items: InvoiceItemInsert[]
): Promise<Invoice> => {
    const supabase = createClient()

    // 1. Crear Factura
    const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoice as any)
        .select()
        .single()

    if (invoiceError) throw new Error(invoiceError.message)

    // 2. Crear Items (si hay)
    if (items.length > 0) {
        const itemsWithId = items.map(item => ({
            ...item,
            invoice_id: (newInvoice as any).id
        }))

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsWithId)

        if (itemsError) {
            // Rollback manual (opcional, o manejar error visualmente)
            // supabase.from('invoices').delete().eq('id', newInvoice.id)
            throw new Error(itemsError.message)
        }
    }

    return newInvoice
}

export const generateInvoiceNumber = async (): Promise<string> => {
    // Generador simple: INV-YYYY-SEQ
    // En producción serio, esto debería ser un contador atómico en BD.
    const year = new Date().getFullYear()
    const supabase = createClient()

    // Obtener última factura del año para incrementar
    const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .ilike('invoice_number', `INV-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1)
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

export const updateInvoiceWithItems = async (
    id: string,
    invoice: Partial<Invoice>,
    items: InvoiceItemInsert[]
): Promise<void> => {
    const supabase = createClient()

    // 1. Actualizar Factura
    const { error: invoiceError } = await supabase
        .from('invoices')
        .update(invoice as any)
        .eq('id', id)

    if (invoiceError) throw new Error(invoiceError.message)

    // 2. Gestionar Items: Borrar antiguos e insertar nuevos
    // (En un entorno con transacciones reales usaríamos RPC o una sola transacción)
    const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id)

    if (deleteError) throw new Error(deleteError.message)

    if (items.length > 0) {
        const itemsWithId = items.map(item => ({
            ...item,
            invoice_id: id
        }))

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsWithId)

        if (itemsError) throw new Error(itemsError.message)
    }
}
