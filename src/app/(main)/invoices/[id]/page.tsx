import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceDetailView } from '@/features/invoices/components'
import type { Settings, InvoiceWithDetails } from '@/types/database'
import { Suspense } from 'react'

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

    const { data: globalSettings } = await (supabase.from('settings') as any)
        .select('*')
        .limit(1)
        .single()

    let effectiveSettings = globalSettings as Settings | null

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
            }
        }
    }

    return { invoice, settings: effectiveSettings }
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {


    return (
        <Suspense fallback={<InvoiceDetailSkeleton />}>
            <InvoiceDetailContent params={params} />
        </Suspense>
    )
}

async function InvoiceDetailContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getInvoiceData(id)

    if (!data) {
        notFound()
    }

    return <InvoiceDetailView initialInvoice={data.invoice} settings={data.settings} />
}

function InvoiceDetailSkeleton() {
    return (
        <div className="max-w-[1200px] mx-auto p-4 lg:p-8 space-y-8 animate-pulse">
            <div className="h-10 bg-white/5 rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[600px] bg-white/5 rounded-2xl" />
                </div>
                <div className="space-y-6">
                    <div className="h-64 bg-white/5 rounded-2xl" />
                    <div className="h-32 bg-white/5 rounded-2xl" />
                </div>
            </div>
        </div>
    )
}

