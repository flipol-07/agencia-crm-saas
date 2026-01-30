import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDetailView } from '@/features/invoices/components'
import type { Invoice, InvoiceItem, Settings } from '@/types/database'

// Habilitar PPR (Partial Prerendering) si estamos en canary, sino omitir
// export const experimental_ppr = true

interface InvoiceWithClientAndItems extends Invoice {
    contacts: {
        id: string
        company_name: string
        contact_name: string | null
        email: string | null
        phone: string | null
        tax_id: string | null
        tax_address: string | null
    } | null
    invoice_items: InvoiceItem[]
}

async function getInvoiceData(id: string): Promise<{ invoice: InvoiceWithClientAndItems, settings: Settings | null } | null> {
    const supabase = await createClient()

    const { data, error: invoiceError } = await (supabase.from('invoices') as any)
        .select(`
            *,
            invoice_items (*),
            contacts (
                id, company_name, contact_name, 
                email, phone, tax_id, tax_address
            )
        `)
        .eq('id', id)
        .single()

    if (invoiceError || !data) return null

    const invoice = data as unknown as InvoiceWithClientAndItems

    const { data: settings } = await (supabase.from('settings') as any)
        .select('*')
        .limit(1)
        .single()

    return { invoice, settings: settings as Settings | null }
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getInvoiceData(id)

    if (!data) {
        notFound()
    }

    return <InvoiceDetailView initialInvoice={data.invoice} settings={data.settings} />
}
