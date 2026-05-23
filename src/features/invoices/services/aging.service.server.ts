import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface AgingBucket {
    label: '0-30' | '31-60' | '61-90' | '90+'
    days_min: number
    days_max: number | null
}

export const AGING_BUCKETS: AgingBucket[] = [
    { label: '0-30', days_min: 0, days_max: 30 },
    { label: '31-60', days_min: 31, days_max: 60 },
    { label: '61-90', days_min: 61, days_max: 90 },
    { label: '90+', days_min: 91, days_max: null },
]

export interface AgingInvoiceRow {
    id: string
    invoice_number: string | null
    contact_id: string
    contact_name: string
    due_date: string
    days_overdue: number
    bucket: AgingBucket['label']
    total: number
    currency: string
    status: string
}

export interface AgingContactSummary {
    contact_id: string
    contact_name: string
    buckets: Record<AgingBucket['label'], number>
    total: number
    currency: string
}

export interface AgingReportData {
    rows: AgingInvoiceRow[]
    byContact: AgingContactSummary[]
    totals: Record<AgingBucket['label'], number>
    grandTotal: number
    generatedAt: string
}

function bucketFor(daysOverdue: number): AgingBucket['label'] {
    if (daysOverdue <= 30) return '0-30'
    if (daysOverdue <= 60) return '31-60'
    if (daysOverdue <= 90) return '61-90'
    return '90+'
}

/**
 * Aged receivables: facturas en status sent/overdue agrupadas por contacto y bucket
 * segun dias desde due_date hasta hoy.
 *
 * Solo cuenta facturas con due_date <= hoy (es decir, ya vencidas o vencen hoy).
 */
export async function getAgingReport(): Promise<AgingReportData> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { rows: [], byContact: [], totals: emptyBuckets(), grandTotal: 0, generatedAt: new Date().toISOString() }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString().split('T')[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data, error } = await supa
        .from('invoices')
        .select('id, invoice_number, contact_id, due_date, status, subtotal, tax_amount, currency, contacts(id, contact_name, company_name)')
        .in('status', ['sent', 'overdue'])
        .not('due_date', 'is', null)
        .lte('due_date', todayIso)
        .eq('created_by', user.id)

    if (error || !data) {
        return { rows: [], byContact: [], totals: emptyBuckets(), grandTotal: 0, generatedAt: new Date().toISOString() }
    }

    const rows: AgingInvoiceRow[] = []
    const byContactMap = new Map<string, AgingContactSummary>()
    const totals = emptyBuckets()
    let grandTotal = 0

    for (const inv of data as Array<{
        id: string
        invoice_number: string | null
        contact_id: string
        due_date: string
        status: string
        subtotal: number
        tax_amount: number
        currency: string
        contacts: { id: string; contact_name: string | null; company_name: string | null } | null
    }>) {
        const due = new Date(inv.due_date)
        due.setHours(0, 0, 0, 0)
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
        const bucket = bucketFor(daysOverdue)
        const total = (inv.subtotal || 0) + (inv.tax_amount || 0)
        const contactName = inv.contacts?.contact_name || inv.contacts?.company_name || 'Sin contacto'
        const currency = inv.currency || 'EUR'

        rows.push({
            id: inv.id,
            invoice_number: inv.invoice_number,
            contact_id: inv.contact_id,
            contact_name: contactName,
            due_date: inv.due_date,
            days_overdue: daysOverdue,
            bucket,
            total,
            currency,
            status: inv.status,
        })

        totals[bucket] += total
        grandTotal += total

        let summary = byContactMap.get(inv.contact_id)
        if (!summary) {
            summary = {
                contact_id: inv.contact_id,
                contact_name: contactName,
                buckets: emptyBuckets(),
                total: 0,
                currency,
            }
            byContactMap.set(inv.contact_id, summary)
        }
        summary.buckets[bucket] += total
        summary.total += total
    }

    const byContact = Array.from(byContactMap.values()).sort((a, b) => b.total - a.total)

    return {
        rows: rows.sort((a, b) => b.days_overdue - a.days_overdue),
        byContact,
        totals,
        grandTotal,
        generatedAt: new Date().toISOString(),
    }
}

function emptyBuckets(): Record<AgingBucket['label'], number> {
    return { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
}
