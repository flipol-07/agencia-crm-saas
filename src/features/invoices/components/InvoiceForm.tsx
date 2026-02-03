
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useContacts } from '@/features/contacts/hooks/useContacts'
// import { useSettings } from '@/features/settings/hooks/useSettings' // Removed, we use profiles now
import {
    createInvoiceWithItemsAction as createInvoiceWithItems,
    updateInvoiceWithItemsAction as updateInvoiceWithItems,
    generateInvoiceNumberAction as generateInvoiceNumber
} from '../actions/invoiceActions'
import { InvoiceItemInsert, InvoiceWithDetails, Profile } from '@/types/database'
import { InfoTooltip } from '@/shared/components/ui/Tooltip'
import { CopyButton } from '@/shared/components/ui/CopyButton'
import { useAuth } from '@/hooks/useAuth'
import { fetchTemplatesClient, getOptimalTemplate } from '@/features/invoices/services/templateService'
import { InvoiceTemplate } from '@/types/database'

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
    const { user } = useAuth()

    // State
    const [loading, setLoading] = useState(false)
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [selectedIssuerId, setSelectedIssuerId] = useState<string>(initialData?.issuer_profile_id || '')

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

    // Templates State
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)

    // Fetch Templates
    useEffect(() => {
        fetchTemplatesClient().then(data => {
            setTemplates(data)
            if (data.length > 0) {
                // Logic: If editing, try to find existing template. Else use optimal.
                if (initialData?.template_id) {
                    const found = data.find(t => t.id === initialData.template_id)
                    if (found) {
                        setSelectedTemplate(found)
                        return
                    }
                }
                // Default logic
                setSelectedTemplate(getOptimalTemplate(data, items.length))
            }
        })
    }, []) // Run once on mount (and check logic below)

    // Update optimal template recommendation when items change (only if user hasn't manually locked it? For now just show warning if overflow)
    const isOverflowing = selectedTemplate && items.length > selectedTemplate.max_items
    const optimalTemplate = templates.length > 0 ? getOptimalTemplate(templates, items.length) : null

    // Derived state from selected issuer
    const selectedIssuer = profiles.find(p => p.id === selectedIssuerId)
    // Fallback defaults if no issuer selected (shouldn't happen ideally)
    const currency = 'EUR' // For now hardcoded or added to profile settings later
    const defaultTaxRate = 0 // Default 0 or 21? User settings was 21. Maybe add `default_tax_rate` to profile too? 
    // For now let's assume 0 (autónomo often IRPF/IVA complex) or 21. 
    // Let's use 21 as safe default or 0. The previous code used global settings.
    // I will hardcode 21 for now or let user edit it (wait, tax rate is global in form calculation).
    // I'll add a state for taxRate initialized to 21.
    const [taxRate, setTaxRate] = useState(initialData?.tax_rate || 21)

    // Fetch Profiles
    useEffect(() => {
        const fetchProfiles = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('profiles').select('*')
            if (data) {
                setProfiles(data)
                // If new invoice and no issuer selected, default to current user
                if (!initialData && !selectedIssuerId && user) {
                    setSelectedIssuerId(user.id)
                }
            }
        }
        fetchProfiles()
    }, [user, initialData, selectedIssuerId])

    // Generate Invoice Number when Issuer Changes
    useEffect(() => {
        if (!initialData && selectedIssuerId) {
            setInvoiceNumber('Generando...')
            generateInvoiceNumber(selectedIssuerId).then(setInvoiceNumber)
        }
    }, [selectedIssuerId, initialData])

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
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedContactId) return toast.error('Selecciona un cliente')
        if (!selectedIssuerId) return toast.error('Selecciona quién emite la factura')

        setLoading(true)
        try {
            const invoicePayload = {
                contact_id: selectedContactId,
                invoice_number: invoiceNumber,
                issue_date: invoiceDate,
                status: initialData?.status || 'draft',
                currency: currency,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                subtotal: subtotal,
                total: total,
                project_id: null,
                created_by: null,
                issuer_profile_id: selectedIssuerId, // IMPORTANT
                notes: null,
                due_date: null,
                paid_date: null,
                template_id: selectedTemplate?.id || null,
                config: selectedTemplate?.config || null
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

    const selectedContact = contacts.find(c => c.id === selectedContactId)

    return (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-xl space-y-8 animate-fade-in text-left">
            <div className="flex justify-between items-start border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        {initialData ? 'Editar Factura' : 'Nueva Factura'}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-400 text-sm">Nº:</span>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            className="bg-transparent border-b border-lime-400/50 text-lime-400 font-mono text-lg outline-none w-40 focus:border-lime-400"
                        />
                        <CopyButton textToCopy={invoiceNumber} label="" iconColor="text-lime-400/50" />
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
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lime-400 text-xs font-bold uppercase tracking-wider">De (Emisor)</h3>
                    </div>

                    {/* Issuer Selector */}
                    <div className="relative">
                        <select
                            value={selectedIssuerId}
                            onChange={e => setSelectedIssuerId(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-lime-400 appearance-none"
                            disabled={!!initialData} // Lock issuer on edit? Maybe safer.
                        >
                            <option value="" disabled>Seleccionar Emisor...</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name || p.email} {p.id === user?.id ? '(Yo)' : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    {selectedIssuer ? (
                        <div className="text-sm text-gray-300 pl-3 border-l-2 border-lime-400/30 space-y-1">
                            <p className="font-bold text-white">{selectedIssuer.billing_name || selectedIssuer.full_name}</p>
                            <p>{selectedIssuer.billing_tax_id || 'Sin NIF config.'}</p>
                            <p className="whitespace-pre-line text-gray-400">{selectedIssuer.billing_address || 'Sin dirección'}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-yellow-500/80 italic">Selecciona quién emite la factura</p>
                    )}
                </div>

                {/* Receptor */}
                <div>
                    <h3 className="text-lime-400 text-xs font-bold uppercase tracking-wider mb-3">Para (Receptor)</h3>
                    <div className="space-y-3">
                        <div className="relative">
                            <select
                                value={selectedContactId}
                                onChange={e => setSelectedContactId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-lime-400 appearance-none [&>option]:bg-zinc-900"
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {contacts.map(contact => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.company_name} {contact.contact_name ? `(${contact.contact_name})` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        {selectedContact && (
                            <div className="text-sm text-gray-300 pl-3 border-l-2 border-white/10 mt-2 space-y-1">
                                <p className="font-bold text-white">{selectedContact.company_name}</p>
                                <p>{selectedContact.tax_id || 'Sin NIF'}</p>
                                <p className="text-gray-400">{selectedContact.tax_address || 'Sin dirección fiscal'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Template Selection */}
            {
                templates.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-lime-400 font-bold uppercase tracking-wider">Diseño de Factura</label>
                            {isOverflowing && (
                                <span className="text-xs text-red-400 font-bold animate-pulse">
                                    ⚠️ Se recomienda usar "{optimalTemplate?.name}" ({optimalTemplate?.max_items} items)
                                </span>
                            )}
                        </div>
                        <select
                            value={selectedTemplate?.id || ''}
                            onChange={e => {
                                const found = templates.find(t => t.id === e.target.value)
                                if (found) setSelectedTemplate(found)
                            }}
                            className={`w-full bg-zinc-900 border rounded px-3 py-2 text-white outline-none appearance-none transition-colors ${isOverflowing ? 'border-red-500/50' : 'border-white/10 focus:border-lime-400'
                                }`}
                        >
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} (Máx {t.max_items} items) {t.is_default ? 'DEFAULT' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )
            }

            {/* Items */}
            <div className="pt-4">
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
                        <span>{subtotal.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 items-center">
                        <span className="flex items-center gap-1">
                            IVA %
                        </span>
                        <input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                            className="w-16 bg-zinc-800 border border-white/10 rounded px-2 py-0.5 text-right text-white text-xs"
                        />
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Importe IVA</span>
                        <span>{taxAmount.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                        <span>Total</span>
                        <span>{total.toFixed(2)} {currency}</span>
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
                    className="px-6 py-2 bg-lime-400 text-black font-bold rounded-lg hover:bg-lime-300 disabled:opacity-50 transition-all shadow-lg hover:shadow-lime-400/20"
                >
                    {loading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Factura')}
                </button>
            </div>
        </form>
    )
}
