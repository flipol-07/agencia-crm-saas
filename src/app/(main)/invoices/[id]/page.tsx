import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDetailView } from '@/features/invoices/components'
import type { InvoiceItem, Settings, InvoiceWithDetails } from '@/types/database'

// Habilitar PPR (Partial Prerendering) si estamos en canary, sino omitir
// export const experimental_ppr = true

async function getInvoiceData(id: string): Promise<{ invoice: InvoiceWithDetails, settings: Settings | null } | null> {
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

    const invoice = data as unknown as InvoiceWithDetails

    // 1. Fetch Global Settings (Always needed for defaults like Logo, Currency)
    const { data: globalSettings } = await (supabase.from('settings') as any)
        .select('*')
        .limit(1)
        .single()

    let effectiveSettings = globalSettings as Settings | null

    // 2. If Invoice has an Issuer, fetch Profile and Override
    if (invoice.issuer_profile_id) {
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('*')
            .eq('id', invoice.issuer_profile_id)
            .single()

        if (profile && effectiveSettings) {
            effectiveSettings = {
                ...effectiveSettings,
                company_name: profile.billing_name || profile.full_name || effectiveSettings.company_name,
                tax_id: profile.billing_tax_id || effectiveSettings.tax_id,
                address: profile.billing_address || effectiveSettings.address,
                email: profile.billing_email || effectiveSettings.email,
                phone: profile.billing_phone || effectiveSettings.phone,
                // If profile has IBAN, we might want to append it to defaults or notes? 
                // InvoiceDetailView uses `notes` field from invoice usually for IBAN.
                // But let's stick to the basic company info overrides for now.
            }
        } else if (profile && !effectiveSettings) {
            // Edge case: No global settings but we have a profile. Construct minimal settings.
            effectiveSettings = {
                id: 'generated-from-profile',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                company_name: profile.billing_name || profile.full_name || 'Sin Nombre',
                tax_id: profile.billing_tax_id || '',
                address: profile.billing_address || '',
                email: profile.billing_email || '',
                phone: profile.billing_phone || '',
                logo_url: profile.avatar_url || null, // Use avatar as fallback if no global settings
                currency: 'EUR',
                default_tax_rate: 21,
                website: null
            }
        }
    }

    return { invoice, settings: effectiveSettings }
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getInvoiceData(id)

    if (!data) {
        notFound()
    }

    return <InvoiceDetailView initialInvoice={data.invoice} settings={data.settings} />
}
