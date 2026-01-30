'use cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { cacheLife } from 'next/cache'
import { InvoiceWithDetails } from '@/types/database'

export const getInvoicesCached = async (): Promise<InvoiceWithDetails[]> => {
    cacheLife('minutes')
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from('invoices') as any)
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

    if (error) {
        console.error('[Invoice Service] Error fetching invoices:', error)
        return []
    }
    return (data || []) as InvoiceWithDetails[]
}
