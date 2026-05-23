'use client'

import { useState } from 'react'
import { emailService } from '@/shared/services/email.service'
import { computeInvoiceTotals, formatCurrency } from '@/features/invoices/lib/money'
import type { InvoiceWithDetails, Settings } from '@/types/database'

interface Props {
    invoice: InvoiceWithDetails
    settings: Settings | null
}

export function SendInvoiceButton({ invoice, settings }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [sending, setSending] = useState(false)

    const clientEmail = invoice.contacts?.email
    const clientPhone = invoice.contacts?.phone
    const clientName = invoice.contacts?.contact_name || invoice.contacts?.company_name || 'Cliente'

    const totals = computeInvoiceTotals({
        items: invoice.invoice_items.map(i => ({ quantity: i.quantity, unit_price: i.unit_price })),
        taxRate: invoice.tax_rate,
        irpfRate: invoice.irpf_rate || 0,
    })

    const fetchPdfBase64 = async (): Promise<{ filename: string; base64: string } | null> => {
        try {
            const res = await fetch(`/api/invoices/${invoice.id}/pdf`)
            if (!res.ok) return null
            const cd = res.headers.get('Content-Disposition') || ''
            const match = cd.match(/filename="([^"]+)"/)
            const filename = match?.[1] || `factura-${invoice.invoice_number || invoice.id}.pdf`
            const blob = await res.blob()
            const buffer = await blob.arrayBuffer()
            // btoa over binary string (limpio, sin tamaños enormes para facturas estándar).
            const bytes = new Uint8Array(buffer)
            let binary = ''
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
            return { filename, base64: btoa(binary) }
        } catch {
            return null
        }
    }

    const handleSendEmail = async () => {
        if (!clientEmail) {
            alert('El cliente no tiene email registrado.')
            return
        }

        if (!confirm(`¿Enviar factura a ${clientEmail}?`)) return

        setSending(true)
        try {
            const pdf = await fetchPdfBase64()
            const htmlContent = generateInvoiceHTML(invoice, settings, totals)

            await emailService.send({
                to: clientEmail,
                subject: `Factura ${invoice.invoice_number || ''} de ${settings?.company_name || 'Nosotros'}`.trim(),
                html: htmlContent,
                attachments: pdf ? [{
                    filename: pdf.filename,
                    content: pdf.base64,
                    encoding: 'base64',
                    contentType: 'application/pdf',
                }] : undefined,
            })

            alert('¡Email enviado correctamente!')
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            alert('Error al enviar el email: ' + (error instanceof Error ? error.message : 'Error desconocido'))
        } finally {
            setSending(false)
        }
    }

    const handleSendWhatsApp = () => {
        if (!clientPhone) {
            alert('El cliente no tiene teléfono registrado.')
            return
        }

        const cleanPhone = clientPhone.replace(/\D/g, '')
        const message = `Hola ${clientName}, adjunto la factura ${invoice.invoice_number || ''} por valor de ${formatCurrency(totals.total, invoice.currency || 'EUR')}. Un saludo.`

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={sending}
                className="px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            >
                {sending ? 'Enviando...' : 'Enviar'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-20 border border-gray-100 overflow-hidden">
                        <button
                            onClick={handleSendEmail}
                            disabled={sending}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 flex items-center gap-2 border-b border-gray-50 disabled:opacity-50"
                        >
                            <span>📧</span>
                            <div className="flex-1">
                                <div>Por Email</div>
                                <div className="text-[10px] text-gray-400">con PDF adjunto</div>
                            </div>
                        </button>
                        <button
                            onClick={handleSendWhatsApp}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                        >
                            <span>💬</span> Por WhatsApp
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

function generateInvoiceHTML(invoice: InvoiceWithDetails, settings: Settings | null, totals: ReturnType<typeof computeInvoiceTotals>) {
    const currency = invoice.currency || 'EUR'
    const itemsRows = invoice.invoice_items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.description)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unit_price, currency)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.quantity * item.unit_price, currency)}</td>
        </tr>
    `).join('')

    return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #000; margin: 0;">${invoice.status === 'quote' ? 'PRESUPUESTO' : 'FACTURA'} ${escapeHtml(invoice.invoice_number || '')}</h1>
            </div>

            <p>Adjunto encontrarás el PDF de la factura. Puedes descargarlo desde este correo.</p>

            <div style="display: flex; justify-content: space-between; margin: 30px 0;">
                <div>
                    <strong>Emisor:</strong><br>
                    ${escapeHtml(settings?.company_name || 'Mi Empresa')}<br>
                    ${escapeHtml(settings?.address || '')}<br>
                    ${escapeHtml(settings?.tax_id || '')}
                </div>
                <div style="text-align: right;">
                    <strong>Cliente:</strong><br>
                    ${escapeHtml(invoice.contacts?.company_name || '')}<br>
                    ${escapeHtml(invoice.contacts?.tax_address || '')}<br>
                    NIF: ${escapeHtml(invoice.contacts?.tax_id || '')}
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 10px; text-align: left;">Descripción</th>
                        <th style="padding: 10px; text-align: center;">Cant.</th>
                        <th style="padding: 10px; text-align: right;">Precio</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>${itemsRows}</tbody>
            </table>

            <div style="text-align: right; margin-top: 20px;">
                <p>Subtotal: <strong>${formatCurrency(totals.subtotal, currency)}</strong></p>
                ${invoice.tax_rate > 0 ? `<p>IVA (${invoice.tax_rate}%): <strong>${formatCurrency(totals.taxAmount, currency)}</strong></p>` : ''}
                ${(invoice.irpf_rate || 0) > 0 ? `<p>Retención IRPF (−${invoice.irpf_rate}%): <strong>−${formatCurrency(totals.irpfAmount, currency)}</strong></p>` : ''}
                <h2 style="color: #8b5cf6;">TOTAL: ${formatCurrency(totals.total, currency)}</h2>
            </div>

            <div style="margin-top: 50px; text-align: center; color: #888; font-size: 12px;">
                <p>Gracias por su confianza.</p>
            </div>
        </div>
    `
}

function escapeHtml(str: string): string {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
