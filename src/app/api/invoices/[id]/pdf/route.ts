import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDFDocument } from '@/features/invoices/pdf/InvoicePDFDocument'
import { buildEffectiveInvoiceSettings, templateFromInvoiceConfig } from '@/features/invoices/lib/invoice-presentation'
import type { InvoiceTemplate, InvoiceWithDetails, Profile, Settings } from '@/types/database'
import { z } from 'zod'
import React from 'react'

const idSchema = z.string().uuid('ID inválido')

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: rawId } = await params
        const parsedId = idSchema.safeParse(rawId)
        if (!parsedId.success) {
            return NextResponse.json({ error: parsedId.error.issues[0].message }, { status: 400 })
        }
        const invoiceId = parsedId.data

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supa = supabase as any

        const { data: invoiceRow, error: invoiceError } = await supa
            .from('invoices')
            .select('*, contacts!inner(*), invoice_items(*)')
            .eq('id', invoiceId)
            .eq('created_by', user.id)
            .maybeSingle()

        if (invoiceError) {
            return NextResponse.json({ error: invoiceError.message }, { status: 500 })
        }
        if (!invoiceRow) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
        }

        const invoice = invoiceRow as InvoiceWithDetails

        let issuer: Profile | null = null
        if (invoice.issuer_profile_id) {
            const { data: profileRow } = await supa
                .from('profiles')
                .select('*')
                .eq('id', invoice.issuer_profile_id)
                .maybeSingle()
            issuer = (profileRow || null) as Profile | null
        }

        const { data: settingsRow } = await supa
            .from('settings')
            .select('*')
            .limit(1)
            .maybeSingle()

        let template: InvoiceTemplate | null = templateFromInvoiceConfig(invoice)
        if (!template && invoice.template_id) {
            const { data: templateRow } = await supa
                .from('invoice_templates')
                .select('*')
                .eq('id', invoice.template_id)
                .maybeSingle()
            template = (templateRow || null) as InvoiceTemplate | null
        }

        if (!template) {
            const { data: defaultTemplate } = await supa
                .from('invoice_templates')
                .select('*')
                .order('is_default', { ascending: false })
                .limit(1)
                .maybeSingle()
            template = (defaultTemplate || null) as InvoiceTemplate | null
        }

        const settings = buildEffectiveInvoiceSettings((settingsRow || null) as Settings | null, issuer)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = React.createElement(InvoicePDFDocument as any, { invoice, settings, template })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buffer = await renderToBuffer(element as any)

        const docPrefix = invoice.status === 'quote' ? 'presupuesto' : 'factura'
        const filename = `${docPrefix}-${invoice.invoice_number || invoiceId}.pdf`

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(buffer.length),
                'Cache-Control': 'private, no-store',
            },
        })
    } catch (error) {
        console.error('[invoices/pdf] error', error)
        const msg = error instanceof Error ? error.message : 'Error generando PDF'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
