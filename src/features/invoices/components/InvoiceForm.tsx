
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useContacts } from '@/features/contacts/hooks/useContacts'
import { useSettings } from '@/features/settings/hooks/useSettings'
import {
    createInvoiceWithItemsAction as createInvoiceWithItems,
    updateInvoiceWithItemsAction as updateInvoiceWithItems,
    generateInvoiceNumberAction as generateInvoiceNumber
} from '../actions/invoiceActions'
import { InvoiceItemInsert, InvoiceWithDetails } from '@/types/database'
import { InfoTooltip } from '@/shared/components/ui/Tooltip'
import { CopyButton } from '@/shared/components/ui/CopyButton'

export function InvoiceForm({
    initialContactId,
    initialData,
    onSuccess,
    onCancel
}: {
    initialContactId?: string
    initialData?: InvoiceWithDetails
    onSuccess?: () => void,
    onCancel?: () => void
}) {
    const { contacts } = useContacts()
    const { settings } = useSettings()

    const [loading, setLoading] = useState(false)
    const [invoiceDate, setInvoiceDate] = useState(
        initialData?.issue_date || new Date().toISOString().split('T')[0]
    )
    const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number || 'Generando...')
    const [selectedContactId, setSelectedContactId] = useState(
        initialData?.contact_id || initialContactId || ''
    )
    const [items, setItems] = useState<{ description: string; quantity: number; unit_price: number }[]>(
        initialData ? initialData.invoice_items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price
        })) : [
            { description: 'Servicios Profesionales', quantity: 1, unit_price: 100 }
        ]
    )

    useEffect(() => {
        if (!initialData) {
            generateInvoiceNumber().then(setInvoiceNumber)
        }
    }, [initialData])

    const handleAddItem = () => {
        setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
    }

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: any) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ))
    }

    // Cálculos
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    const taxRate = settings?.default_tax_rate || 21
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedContactId) return toast.error('Selecciona un cliente')

        setLoading(true)
        try {
            const invoicePayload = {
                contact_id: selectedContactId,
                invoice_number: invoiceNumber,
                issue_date: invoiceDate,
                status: initialData?.status || 'draft',
                currency: settings?.currency || 'EUR',
                tax_rate: taxRate,
                tax_amount: taxAmount,
                subtotal: subtotal,
                total: total,
                project_id: null,
                created_by: null,
                notes: null,
                due_date: null,
                paid_date: null,
            }

            const itemsPayload = items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.quantity * item.unit_price
            } as InvoiceItemInsert))

            if (initialData) {
                await updateInvoiceWithItems(initialData.id, invoicePayload, itemsPayload)
                toast.success('Factura actualizada correctamente')
            } else {
                await createInvoiceWithItems(invoicePayload, itemsPayload)
                toast.success('Factura creada correctamente')
            }

            if (onSuccess) onSuccess()
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar factura')
        } finally {
            setLoading(false)
        }
    }

    // Datos del emisor (Settings)
    const renderEmitter = () => {
        if (!settings) return <p className="text-gray-500 text-sm">Cargando datos empresa...</p>
        return (
            <div className="text-sm text-gray-300">
                <p className="font-bold text-white">{settings.company_name}</p>
                <p>{settings.tax_id}</p>
                <p className="whitespace-pre-line">{settings.address}</p>
                <p>{settings.email}</p>
            </div>
        )
    }

    const selectedContact = contacts.find(c => c.id === selectedContactId)

    return (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-xl space-y-8 animate-fade-in">
            <div className="flex justify-between items-start border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        {initialData ? 'Editar Factura' : 'Nueva Factura'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <p className="text-lime-400 font-mono text-lg">{invoiceNumber}</p>
                        <CopyButton textToCopy={invoiceNumber} label="Copiar Nº Factura" iconColor="text-lime-400/50" />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Fecha Emisión</label>
                    <input
                        type="date"
                        value={invoiceDate}
                        onChange={e => setInvoiceDate(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-3 py-1 text-white text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Emisor */}
                <div>
                    <h3 className="text-lime-400 text-xs font-bold uppercase tracking-wider mb-3">De</h3>
                    {renderEmitter()}
                </div>

                {/* Receptor */}
                <div>
                    <h3 className="text-lime-400 text-xs font-bold uppercase tracking-wider mb-3">Para</h3>
                    <div className="space-y-3">
                        <select
                            value={selectedContactId}
                            onChange={e => setSelectedContactId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-lime-400 [&>option]:bg-zinc-900 [&>option]:text-white"
                        >
                            <option value="">Seleccionar Cliente...</option>
                            {contacts.map(contact => (
                                <option key={contact.id} value={contact.id}>
                                    {contact.company_name} {contact.contact_name ? `(${contact.contact_name})` : ''}
                                </option>
                            ))}
                        </select>


                        {selectedContact && (
                            <div className="text-sm text-gray-300 pl-1 border-l-2 border-white/10 mt-2">
                                <p>{selectedContact.tax_id || 'Sin NIF'}</p>
                                <p>{selectedContact.tax_address || 'Sin dirección fiscal'}</p>
                                <p>{selectedContact.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-gray-500 border-b border-white/10">
                            <th className="py-2 w-1/2">Descripción</th>
                            <th className="py-2 w-20 text-center">Cant.</th>
                            <th className="py-2 w-24 text-right">Precio</th>
                            <th className="py-2 w-24 text-right">Total</th>
                            <th className="py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-white/5">
                                <td className="py-2 pr-2">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={e => updateItem(idx, 'description', e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-white placeholder-gray-600"
                                        placeholder="Descripción del servicio..."
                                    />
                                </td>
                                <td className="py-2 px-1">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                                        className="w-full bg-transparent border-none outline-none text-white text-center"
                                        min="1"
                                    />
                                </td>
                                <td className="py-2 pl-2 text-right">
                                    <input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value))}
                                        className="w-full bg-transparent border-none outline-none text-white text-right"
                                        step="0.01"
                                    />
                                </td>
                                <td className="py-2 text-right text-gray-300">
                                    {(item.quantity * item.unit_price).toFixed(2)}€
                                </td>
                                <td className="py-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-2 text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1"
                >
                    + Añadir línea
                </button>
            </div>

            {/* Totales */}
            <div className="flex justify-end pt-4 border-t border-white/10">
                <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                        <span>Subtotal</span>
                        <span>{subtotal.toFixed(2)} {settings?.currency}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span className="flex items-center gap-1">
                            IVA ({taxRate}%)
                            <InfoTooltip content="Este porcentaje se configura en Ajustes > Valores por Defecto" position="left" />
                        </span>
                        <span>{taxAmount.toFixed(2)} {settings?.currency}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                        <span>Total</span>
                        <span>{total.toFixed(2)} {settings?.currency}</span>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-lime-400 text-black font-bold rounded-lg hover:bg-lime-300 disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Factura')}
                </button>
            </div>
        </form>
    )
}
