import type { InvoiceTemplate, InvoiceWithDetails, Profile, Settings } from '@/types/database'

export function templateFromInvoiceConfig(invoice: InvoiceWithDetails): InvoiceTemplate | null {
    if (!invoice.config) return null

    return {
        id: 'snapshotted',
        name: 'Diseño guardado',
        description: 'Copia local guardada en la factura',
        config: invoice.config,
        max_items: 50,
        background_url: invoice.config.background_url || null,
        is_default: false,
        profile_id: invoice.created_by,
        created_at: '',
        updated_at: '',
    }
}

export function buildEffectiveInvoiceSettings(settings: Settings | null, profile: Profile | null): Settings | null {
    if (!settings && !profile) return null

    return {
        id: settings?.id || profile?.id || 'issuer-profile',
        company_name: profile?.billing_name || profile?.full_name || settings?.company_name || null,
        tax_id: profile?.billing_tax_id || settings?.tax_id || null,
        address: profile?.billing_address || settings?.address || null,
        email: profile?.billing_email || settings?.email || null,
        phone: profile?.billing_phone || settings?.phone || null,
        website: settings?.website || null,
        logo_url: settings?.logo_url || null,
        default_tax_rate: settings?.default_tax_rate ?? 21,
        currency: settings?.currency || 'EUR',
        created_at: settings?.created_at || '',
        updated_at: settings?.updated_at || '',
    }
}
