'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InvoiceCanvas } from '@/features/invoices/components/InvoiceCanvas'
import type { InvoiceWithDetails, Settings, InvoiceTemplate } from '@/types/database'

export default function PrintInvoicePage() {
    const { id } = useParams()
    const [data, setData] = useState<{ invoice: InvoiceWithDetails, settings: Settings, template: InvoiceTemplate } | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch Invoice
                const { data: invoice, error: invError } = await supabase
                    .from('invoices')
                    .select(`
                        *,
                        invoice_items (*),
                        contacts (*)
                    `)
                    .eq('id', id)
                    .single()

                if (invError) throw invError

                // 2. Fetch Settings
                const { data: settings } = await supabase
                    .from('settings')
                    .select('*')
                    .single()

                // 3. Resolve Template
                let template: InvoiceTemplate | null = null
                if (invoice.template_id) {
                    const { data: t } = await supabase
                        .from('invoice_templates')
                        .select('*')
                        .eq('id', invoice.template_id)
                        .single()
                    template = t
                }

                if (!template) {
                    const { data: all } = await supabase.from('invoice_templates').select('*')
                    template = all?.[0] || null
                }

                setData({
                    invoice: invoice as any,
                    settings: settings as any,
                    template: template as any
                })
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    useEffect(() => {
        if (data) {
            // Wait for images/fonts to load ideally, but let's try direct
            setTimeout(() => {
                window.print()
                // window.close() // Optional: close after print dialog
            }, 1000)
        }
    }, [data])

    if (loading) return null
    if (!data) return <div className="p-8">Factura no encontrada</div>

    return (
        <div className="invoice-print-wrapper bg-white min-h-screen">
            <InvoiceCanvas
                template={data.template}
                invoice={data.invoice}
                settings={data.settings}
                items={data.invoice.invoice_items}
                editable={false}
            />

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        height: 297mm !important;
                        width: 210mm !important;
                        overflow: hidden !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .invoice-print-wrapper {
                        display: block !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: 297mm !important;
                        overflow: hidden !important;
                    }
                    .invoice-print-container {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        z-index: 99999 !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        transform: none !important; /* Force no scaling */
                    }
                    /* Ocultar cualquier otro elemento que rastro de Next.js u otros componentes */
                    header, footer, nav, aside, .print\\:hidden, #__next-build-watcher, #__next-prerender-indicator {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
