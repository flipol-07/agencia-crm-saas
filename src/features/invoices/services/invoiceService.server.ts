'use cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { cacheLife } from 'next/cache'
import { InvoiceWithDetails } from '@/types/database'
import { isDemoEmail } from '@/shared/lib/demo'

export const getInvoicesCached = async (userId?: string): Promise<InvoiceWithDetails[]> => {
    cacheLife('minutes')
    const supabase = createAdminClient()

    let query = (supabase.from('invoices') as any)
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

    if (userId) {
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('email')
            .eq('id', userId)
            .maybeSingle()

        if (isDemoEmail(profile?.email)) {
            query = query.or(`created_by.eq.${userId},issuer_profile_id.eq.${userId}`)
        }
    }

    const { data, error } = await query

    if (error) {
        console.error('[Invoice Service] Error fetching invoices:', error)
        return []
    }
    return (data || []) as InvoiceWithDetails[]
}
