'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { PrintButton, SendInvoiceButton } from '@/features/invoices/components'
import { updateInvoiceWithItemsAction as updateInvoiceWithItems } from '@/features/invoices/actions/invoiceActions'
import type { InvoiceItem, Settings, InvoiceWithDetails } from '@/types/database'

interface Props {
    initialInvoice: InvoiceWithDetails
    settings: Settings | null
}

export function InvoiceDetailView({ initialInvoice, settings: initialSettings }: Props) {
    // Estado del Editor
    const [invoice, setInvoice] = useState(initialInvoice)
    const [items, setItems] = useState(initialInvoice.invoice_items)
    const [hasChanges, setHasChanges] = useState(false)
    const [loading, setLoading] = useState(false)
    const [logoAlign, setLogoAlign] = useState<'left' | 'center' | 'right'>('left')
    const [isSaving, setIsSaving] = useState(false)

    // Cálculo automático de totales
    useEffect(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
        const taxAmount = (subtotal * invoice.tax_rate) / 100
        const total = subtotal + taxAmount

        setInvoice(prev => ({
            ...prev,
            subtotal,
            tax_amount: taxAmount,
            total
        }))
        setHasChanges(true)
    }, [items, invoice.tax_rate])

    const handleUpdateInvoiceField = (field: string, value: any) => {
        setInvoice(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)
    }

    const handleUpdateItem = (id: string, field: string, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item

            const updatedItem = { ...item, [field]: value }

            // Recalcular total_price solo si ambos son números válidos, sino 0
            const q = field === 'quantity' ? value : item.quantity
            const p = field === 'unit_price' ? value : item.unit_price
            updatedItem.total_price = (isNaN(q) || isNaN(p)) ? 0 : q * p

            return updatedItem
        }))
    }

    const handleAddItem = () => {
        const newItem: any = {
            id: `new-${Date.now()}`,
            description: 'Nuevo servicio',
            quantity: 1,
            unit_price: 0,
            total_price: 0,
            invoice_id: invoice.id
        }
        setItems(prev => [...prev, newItem])
    }

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }

    const handleSave = async () => {
        setLoading(true)
        setIsSaving(true)
        try {
            await updateInvoiceWithItems(
                invoice.id,
                {
                    issue_date: invoice.issue_date,
                    due_date: invoice.due_date,
                    subtotal: invoice.subtotal,
                    tax_rate: invoice.tax_rate,
                    tax_amount: invoice.tax_amount,
                    total: invoice.total,
                    status: invoice.status
                },
                items.map(i => ({
                    invoice_id: invoice.id,
                    description: i.description,
                    quantity: isNaN(i.quantity) ? 0 : i.quantity,
                    unit_price: isNaN(i.unit_price) ? 0 : i.unit_price,
                    total_price: i.total_price
                }))
            )
            setHasChanges(false)
            alert('¡Factura guardada con éxito!')
        } catch (error) {
            console.error(error)
            alert('Error al guardar los cambios')
        } finally {
            setLoading(false)
            setIsSaving(false)
        }
    }

    const client = invoice.contacts

    return (
        <div id="invoice-root" className="min-h-screen bg-[#0b141a] text-white p-4 md:p-8 pb-32">
            {/* Toolbar Superior */}
            <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden border-b border-white/10 pb-4">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                    <Link
                        href={`/contacts/${client?.id}`}
                        className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors self-start md:self-auto"
                    >
                        ← Volver
                    </Link>
                    <div className="hidden md:block h-6 w-px bg-white/10" />
                    <div className="flex gap-2 self-start md:self-auto">
                        <button
                            onClick={() => setLogoAlign('left')}
                            className={`p-2 rounded ${logoAlign === 'left' ? 'bg-lime-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                            title="Logo a la izquierda"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" /></svg>
                        </button>
                        <button
                            onClick={() => setLogoAlign('center')}
                            className={`p-2 rounded ${logoAlign === 'center' ? 'bg-lime-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                            title="Logo al centro"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10m-10 6h16" /></svg>
                        </button>
                        <button
                            onClick={() => setLogoAlign('right')}
                            className={`p-2 rounded ${logoAlign === 'right' ? 'bg-lime-400 text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                            title="Logo a la derecha"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M4 18h16" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || loading}
                        className={`px-4 md:px-6 py-2 rounded-lg font-bold transition-all flex-1 md:flex-none justify-center flex items-center gap-2 text-sm md:text-base ${hasChanges ? 'bg-lime-400 text-black hover:scale-105' : 'bg-white/5 text-gray-500 cursor-default'}`}
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin text-lg">◌</span> Guardando...
                            </span>
                        ) : 'Guardar Cambios'}
                    </button>
                    <div className="flex gap-2">
                        <SendInvoiceButton invoice={{ ...invoice, invoice_items: items }} settings={initialSettings} />
                        <PrintButton />
                    </div>
                </div>
            </div>

            {/* Hoja de Factura (Editor) */}
            <div className="invoice-print-container max-w-4xl mx-auto bg-white text-black shadow-2xl rounded-lg p-6 md:p-16 print:p-0 print:shadow-none min-h-0 md:min-h-[1100px] print:min-h-0 border border-white/5 relative overflow-hidden">

                {/* Logo y Encabezado */}
                <div className={`flex flex-col mb-8 md:mb-16 ${logoAlign === 'center' ? 'items-center text-center' : logoAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                    {initialSettings?.logo_url ? (
                        <img src={initialSettings.logo_url} alt="Logo" className="h-16 md:h-20 mb-4 md:mb-6 object-contain cursor-move" />
                    ) : (
                        <div className="h-16 w-16 md:h-20 md:w-20 bg-gray-100 rounded flex items-center justify-center mb-4 md:mb-6 text-gray-400 border-2 border-dashed border-gray-200 text-xs md:text-base">
                            LOGO
                        </div>
                    )}
                    <input
                        className="text-gray-900 text-3xl md:text-4xl font-black italic tracking-tighter mb-1 border-b-2 border-lime-400 inline-block bg-transparent border-none outline-none focus:ring-0 w-auto p-0"
                        defaultValue="FACTURA"
                    />
                    <p className="text-gray-400 font-mono text-xs md:text-sm mt-2">#{invoice.invoice_number}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 mb-12 md:mb-20">
                    {/* Emisor (Read-Only from Profile/Settings) */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 md:mb-4">
                            <h3 className="text-xs font-bold uppercase text-gray-300 tracking-widest">Emisor</h3>
                            <Link href="/settings" className="text-[10px] text-lime-500 hover:text-lime-600 print:hidden opacity-50 hover:opacity-100 transition-opacity">
                                (Editar en Ajustes)
                            </Link>
                        </div>
                        <div className="space-y-1">
                            <div className="font-bold text-lg md:text-xl p-1 border border-transparent">
                                {initialSettings?.company_name || 'Mi Empresa'}
                            </div>
                            <div className="text-gray-500 text-sm whitespace-pre-line p-1 border border-transparent">
                                {initialSettings?.address || 'Dirección'}
                                {initialSettings?.tax_id && `\nNIF: ${initialSettings.tax_id}`}
                            </div>
                        </div>
                    </div>

                    {/* Receptor y Fechas */}
                    <div className="text-left md:text-right">
                        <h3 className="text-xs font-bold uppercase text-gray-300 tracking-widest mb-2 md:mb-4">Cliente</h3>
                        <div className="font-bold text-lg md:text-xl">{client?.company_name}</div>
                        <div className="text-gray-500 text-sm">{client?.tax_address}</div>

                        <div className="mt-8 space-y-2">
                            <div className="flex flex-row md:justify-end items-center gap-3">
                                <span className="text-xs uppercase text-gray-400 font-bold min-w-[60px] md:min-w-0">Fecha:</span>
                                <input
                                    type="date"
                                    value={invoice.issue_date}
                                    onChange={(e) => handleUpdateInvoiceField('issue_date', e.target.value)}
                                    className="text-left md:text-right border-none outline-none p-1 rounded hover:bg-gray-50 focus:ring-1 focus:ring-lime-400 bg-transparent flex-1 md:flex-none w-full md:w-auto"
                                />
                            </div>
                            <div className="flex flex-row md:justify-end items-center gap-3">
                                <span className="text-xs uppercase text-gray-400 font-bold min-w-[60px] md:min-w-0">Vence:</span>
                                <input
                                    type="date"
                                    value={invoice.due_date || ''}
                                    onChange={(e) => handleUpdateInvoiceField('due_date', e.target.value)}
                                    className="text-left md:text-right border-none outline-none p-1 rounded hover:bg-gray-50 focus:ring-1 focus:ring-lime-400 bg-transparent flex-1 md:flex-none w-full md:w-auto"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla de Conceptos (Edición Directa) */}
                <div className="mb-12 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="text-left py-4 w-1/2">
                                    <input className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest w-full" defaultValue="Descripción" />
                                </th>
                                <th className="text-center py-4 w-24">
                                    <input className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-center w-full" defaultValue="Cant." />
                                </th>
                                <th className="text-right py-4 w-32">
                                    <input className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-right w-full" defaultValue="Precio" />
                                </th>
                                <th className="text-right py-4 w-32">
                                    <input className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-right w-full" defaultValue="Total" />
                                </th>
                                <th className="w-10 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <tr key={item.id} className="group transition-colors hover:bg-gray-50">
                                    <td className="py-4">
                                        <input
                                            className="w-full bg-transparent border-none outline-none font-medium hover:text-lime-600 focus:text-lime-600"
                                            value={item.description}
                                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="py-4">
                                        <input
                                            type="number"
                                            className="w-full text-center bg-transparent border-none outline-none text-gray-500"
                                            value={isNaN(item.quantity) ? '' : item.quantity}
                                            onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center justify-end text-right">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-24 text-right bg-transparent border-none outline-none text-gray-500"
                                                value={isNaN(item.unit_price) ? '' : item.unit_price}
                                                onChange={(e) => handleUpdateItem(item.id, 'unit_price', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                                            />
                                            <span className="text-gray-400 ml-1">€</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                                        {item.total_price.toFixed(2)} €
                                    </td>
                                    <td className="py-4 text-right print:hidden">
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button
                        onClick={handleAddItem}
                        className="mt-6 flex items-center gap-2 text-xs font-bold text-lime-600 hover:text-lime-700 uppercase tracking-widest print:hidden transition-all hover:translate-x-1"
                    >
                        <span className="bg-lime-100 text-lime-600 w-6 h-6 flex items-center justify-center rounded-full">+</span>
                        Añadir concepto
                    </button>
                </div>

                {/* Totales con Diseño Premium */}
                <div className="flex justify-end mt-12 md:mt-20">
                    <div className="w-full md:w-72 space-y-4">
                        <div className="flex justify-between items-center text-gray-400 font-medium">
                            <span className="uppercase text-xs tracking-widest leading-none">Subtotal</span>
                            <span className="text-lg">{invoice.subtotal.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 font-medium pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="uppercase text-xs tracking-widest leading-none">IVA</span>
                                <input
                                    className="w-12 bg-gray-50 border-none outline-none text-center rounded text-sm font-bold text-gray-900 py-1"
                                    value={isNaN(invoice.tax_rate) ? '' : invoice.tax_rate}
                                    onChange={(e) => handleUpdateInvoiceField('tax_rate', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                                />
                                <span className="text-xs">%</span>
                            </div>
                            <span className="text-lg">{invoice.tax_amount.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-xl md:text-2xl font-black italic tracking-tighter text-gray-900">TOTAL</span>
                            <span className="text-3xl md:text-4xl font-black text-lime-500 tracking-tighter">{invoice.total.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>

                {/* Footer del Editor - Dinámico */}
                <div className="invoice-footer mt-20 md:mt-32 pt-10 border-t-4 border-black text-center">
                    <textarea
                        className="w-full h-24 text-center border-none outline-none text-gray-400 text-sm hover:bg-gray-50 focus:ring-1 focus:ring-lime-400 rounded p-2 transition-all resize-none"
                        defaultValue={`Términos de pago: Transferencia bancaria\nIBAN: ES00 0000 0000 0000 0000 0000\n¡Gracias por tu negocio!`}
                        onChange={(e) => handleUpdateInvoiceField('notes', e.target.value)}
                    />
                </div>

                {/* Marca de agua de edición in-place */}
                <div className="marca-agua absolute top-4 right-4 text-[6px] md:text-[8px] uppercase tracking-[0.2em] text-gray-200 font-bold pointer-events-none select-none print:hidden">
                    Editor Dinámico v1.0
                </div>
            </div>

            {/* Estilos Pro */}
            <style jsx>{`
                ::selection {
                    background: #bef264;
                    color: black;
                }
            `}</style>

            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    /* ... (rest of print styles logic kept same by context of this replacement, but ensure correctness) */
                    /* Reset Total e Inmediato */
                    *, *::before, *::after {
                        background: transparent !important;
                        box-shadow: none !important;
                    }

                    html, body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                    }

                    /* Ocultar UI del CRM */
                    #invoice-root {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        min-height: 0 !important;
                    }
                    
                    #invoice-root > div:not(.invoice-print-container) {
                        display: none !important;
                    }

                    .invoice-print-container {
                        display: block !important;
                        position: relative !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 10mm !important;
                        background: white !important;
                        color: black !important;
                        border: none !important;
                        border-radius: 0 !important;
                        visibility: visible !important;
                        left: 0 !important;
                    }

                    .invoice-footer {
                        position: absolute !important;
                        bottom: 15mm !important;
                        left: 10mm !important;
                        right: 10mm !important;
                        width: calc(210mm - 20mm) !important;
                        margin: 0 !important;
                        border-top: 2px solid black !important;
                        padding-top: 5mm !important;
                    }

                    /* Forzar que el texto sea negro y visible */
                    .invoice-print-container * {
                        visibility: visible !important;
                        color: black !important;
                    }

                    /* Mantener Flexbox para el layout */
                    .flex { display: flex !important; }
                    .flex-col { flex-direction: column !important; }
                    .justify-between { justify-content: space-between !important; }
                    .items-center { align-items: center !important; }
                    
                    /* Ocultar elementos marcados para no imprimir */
                    .print\\:hidden, button, .toolbar-editor, .marca-agua { 
                        display: none !important; 
                    }

                    input, textarea {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                        color: black !important;
                    }
                }
                
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
        </div>
    )
}
