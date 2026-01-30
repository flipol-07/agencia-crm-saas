'use client'

import { useState } from 'react'
import { emailService } from '@/shared/services/email.service'
import type { InvoiceItem } from '@/types/database'

interface Props {
    invoice: any
    settings: any
}

export function SendInvoiceButton({ invoice, settings }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [sending, setSending] = useState(false)

    const clientEmail = invoice.contacts?.email
    const clientPhone = invoice.contacts?.phone
    const clientName = invoice.contacts?.contact_name || invoice.contacts?.company_name || 'Cliente'

    const handleSendEmail = async () => {
        if (!clientEmail) {
            alert('El cliente no tiene email registrado.')
            return
        }

        if (!confirm(`¿Enviar factura a ${clientEmail}?`)) return

        setSending(true)
        try {
            // Generar HTML simple de la factura
            const htmlContent = generateInvoiceHTML(invoice, settings)

            await emailService.send({
                to: clientEmail,
                subject: `Factura ${invoice.invoice_number || 'Nueva'} de ${settings?.company_name || 'Nosotros'}`,
                html: htmlContent
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

        // Limpiar teléfono (quitar espacios, guiones, etc)
        const cleanPhone = clientPhone.replace(/\D/g, '')
        const message = `Hola ${clientName}, adjunto la factura ${invoice.invoice_number} por valor de ${invoice.total.toFixed(2)}€. Un saludo.`

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
                {sending ? 'Enviando...' : 'Enviar'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-100 overflow-hidden">
                        <button
                            onClick={handleSendEmail}
                            disabled={sending}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 flex items-center gap-2 border-b border-gray-50"
                        >
                            <span>📧</span> Por Email
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

function generateInvoiceHTML(invoice: any, settings: any) {
    // Helper simple para generar tabla HTML
    const itemsRows = invoice.invoice_items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.unit_price.toFixed(2)} €</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(item.quantity * item.unit_price).toFixed(2)} €</td>
        </tr>
    `).join('')

    return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #000; margin: 0;">FACTURA ${invoice.invoice_number || ''}</h1>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                <div>
                    <strong>Emisor:</strong><br>
                    ${settings?.company_name || 'Mi Empresa'}<br>
                    ${settings?.address || ''}<br>
                    ${settings?.tax_id || ''}
                </div>
                <div style="text-align: right;">
                    <strong>Cliente:</strong><br>
                    ${invoice.contacts?.company_name || ''}<br>
                    ${invoice.contacts?.tax_address || ''}<br>
                    NIF: ${invoice.contacts?.tax_id || ''}
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
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 20px;">
                <p>Subtotal: <strong>${invoice.subtotal.toFixed(2)} €</strong></p>
                <p>IVA (${invoice.tax_rate}%): <strong>${invoice.tax_amount.toFixed(2)} €</strong></p>
                <h2 style="color: #84cc16;">TOTAL: ${invoice.total.toFixed(2)} €</h2>
            </div>

            <div style="margin-top: 50px; text-align: center; color: #888; font-size: 12px;">
                <p>Gracias por su confianza.</p>
            </div>
        </div>
    `
}
