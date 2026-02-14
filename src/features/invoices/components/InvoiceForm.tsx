
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
import { getSectorsCached } from '@/features/expenses/services/expenseService.server'
import { Sector } from '@/features/expenses/types'
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
    const [sectors, setSectors] = useState<Sector[]>([])
    const [selectedIssuerId, setSelectedIssuerId] = useState<string>(initialData?.issuer_profile_id || '')
    const [selectedSectorId, setSelectedSectorId] = useState<string>((initialData as any)?.sector_id || '')

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
    // IRPF State
    const [taxRate, setTaxRate] = useState(initialData?.tax_rate || 21)
    const [irpfRate, setIrpfRate] = useState(initialData?.irpf_rate || 0)

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
                    const myProfile = data.find((p: Profile) => p.id === user.id)
                    if (myProfile) {
                        setIrpfRate(myProfile.default_irpf_rate ?? 7)
                    }
                } else if (!initialData && selectedIssuerId) {
                    const issuer = data.find((p: Profile) => p.id === selectedIssuerId)
                    if (issuer) {
                        setIrpfRate(issuer.default_irpf_rate ?? 7)
                    }
                }
            }
        }
        fetchProfiles()

        // Fetch Sectors
        const fetchSectors = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('sectors').select('*').order('name')
            if (data) setSectors(data)
        }
        fetchSectors()
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
    const irpfAmount = (subtotal * irpfRate) / 100
    const total = subtotal + taxAmount - irpfAmount

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
                irpf_rate: irpfRate,
                irpf_amount: irpfAmount,
                project_id: null,
                created_by: null,
                issuer_profile_id: selectedIssuerId, // IMPORTANT
                notes: null,
                due_date: null,
                paid_date: null,
                template_id: selectedTemplate?.id || null,
                config: selectedTemplate?.config || null,
                sector_id: selectedSectorId || null
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
        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl space-y-8 animate-fade-in text-left border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8b5cf6]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <div className="flex justify-between items-start border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tight">
                        {initialData ? 'Editar Factura' : 'Nueva Factura'}
                    </h2>
                    <div className="flex items-center gap-3 mt-3 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">REF:</span>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            className="bg-transparent border-none text-[#8b5cf6] font-mono text-lg font-bold outline-none w-32 tracking-wider placeholder-gray-600"
                        />
                        <CopyButton textToCopy={invoiceNumber} label="" iconColor="text-[#8b5cf6]" />
                    </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Fecha Emisión</label>
                    <input
                        type="date"
                        value={invoiceDate}
                        onChange={e => setInvoiceDate(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-[#8b5cf6] hover:border-white/20 transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Emisor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[#8b5cf6] text-xs font-bold uppercase tracking-wider">De (Emisor)</h3>
                    </div>

                    {/* Issuer Selector - Locked to logged in user or existing issuer */}
                    <div className="relative group/issuer">
                        <select
                            value={selectedIssuerId}
                            onChange={e => setSelectedIssuerId(e.target.value)}
                            className="w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white outline-none appearance-none disabled:opacity-60 transition-all cursor-not-allowed"
                            disabled={true}
                        >
                            <option value="" disabled>Seleccionar Emisor...</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name || p.email} {p.id === user?.id ? '(Tú)' : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                    </div>

                    {selectedIssuer ? (
                        <div className="text-sm text-gray-300 pl-4 border-l-2 border-[#8b5cf6]/50 space-y-1 py-1">
                            <p className="font-bold text-white tracking-wide">{selectedIssuer.billing_name || selectedIssuer.full_name}</p>
                            <p className="text-gray-400">{selectedIssuer.billing_tax_id || 'Sin NIF config.'}</p>
                            <p className="whitespace-pre-line text-gray-500">{selectedIssuer.billing_address || 'Sin dirección'}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-amber-400/80 italic pl-2 border-l-2 border-amber-400/50">Selecciona quién emite la factura</p>
                    )}
                </div>

                {/* Receptor */}
                <div>
                    <h3 className="text-[#8b5cf6] text-xs font-bold uppercase tracking-wider mb-3">Para (Receptor)</h3>
                    <div className="space-y-3">
                        <div className="relative">
                            <select
                                value={selectedContactId}
                                onChange={e => setSelectedContactId(e.target.value)}
                                className="w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/20 appearance-none [&>option]:bg-zinc-900 transition-all"
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {contacts.map(contact => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.company_name} {contact.contact_name ? `(${contact.contact_name})` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        {selectedContact && (
                            <div className="text-sm text-gray-300 pl-4 border-l-2 border-white/10 mt-2 space-y-1 py-1">
                                <p className="font-bold text-white tracking-wide">{selectedContact.company_name}</p>
                                <p className="text-gray-400">{selectedContact.tax_id || 'Sin NIF'}</p>
                                <p className="text-gray-500">{selectedContact.tax_address || 'Sin dirección fiscal'}</p>
                            </div>
                        )}
                    </div>

                    {/* Sector Selector */}
                    <div className="mt-6">
                        <h3 className="text-[#8b5cf6] text-xs font-bold uppercase tracking-wider mb-2">Servicio / Sector</h3>
                        <div className="relative">
                            <select
                                value={selectedSectorId}
                                onChange={e => setSelectedSectorId(e.target.value)}
                                className="w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/20 appearance-none [&>option]:bg-zinc-900 transition-all"
                            >
                                <option value="">Sin Clasificar...</option>
                                {sectors.map(sector => (
                                    <option key={sector.id} value={sector.id}>
                                        {sector.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Selection */}
            {
                templates.length > 0 && (
                    <div className="pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-xs text-[#8b5cf6] font-bold uppercase tracking-wider">Diseño de Factura</label>
                            {isOverflowing && (
                                <span className="text-[10px] text-red-400 font-bold animate-pulse bg-red-400/10 px-2 py-1 rounded border border-red-400/20">
                                    ⚠️ Recomendado: "{optimalTemplate?.name}" ({optimalTemplate?.max_items} items)
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={selectedTemplate?.id || ''}
                                onChange={e => {
                                    const found = templates.find(t => t.id === e.target.value)
                                    if (found) setSelectedTemplate(found)
                                }}
                                className={`w-full bg-black/40 backdrop-blur-sm border rounded-xl px-4 py-3 text-white outline-none appearance-none transition-all focus:ring-1 focus:ring-[#8b5cf6]/20 ${isOverflowing ? 'border-red-500/50' : 'border-white/10 focus:border-[#8b5cf6]'
                                    }`}
                            >
                                {templates.map(t => (
                                    <option key={t.id} value={t.id} className="bg-zinc-900">
                                        {t.name} (Máx {t.max_items} items) {t.is_default ? 'DEFAULT' : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Items */}
            <div className="pt-8">
                <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            <th className="py-2 pl-4 w-1/2">Descripción</th>
                            <th className="py-2 text-center w-24">Cant.</th>
                            <th className="py-2 text-right w-32">Precio</th>
                            <th className="py-2 text-right w-32">Total</th>
                            <th className="py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.map((item, idx) => (
                            <tr key={idx} className="group transition-all hover:scale-[1.01]">
                                <td className="py-0">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={e => updateItem(idx, 'description', e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-l-xl py-3 px-4 text-white placeholder-gray-600 outline-none focus:bg-white/10 focus:border-white/10 focus:z-10 transition-colors"
                                        placeholder="Descripción del servicio..."
                                    />
                                </td>
                                <td className="py-0">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                                        className="w-full bg-white/5 border-y border-white/5 py-3 px-2 text-white text-center outline-none focus:bg-white/10 focus:z-10 transition-colors"
                                        min="1"
                                    />
                                </td>
                                <td className="py-0">
                                    <input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value))}
                                        className="w-full bg-white/5 border-y border-white/5 py-3 px-2 text-white text-right outline-none focus:bg-white/10 focus:z-10 transition-colors"
                                        step="0.01"
                                    />
                                </td>
                                <td className="py-0 bg-white/5 border-y border-white/5 text-right px-4 text-gray-300 font-medium">
                                    {(item.quantity * item.unit_price).toFixed(2)}€
                                </td>
                                <td className="py-0 pr-2 bg-white/5 border-y border-r border-white/5 rounded-r-xl text-center">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 mx-auto"
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
                    className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-[#8b5cf6] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                    <span>+</span> Añadir línea
                </button>
            </div>

            {/* Totales */}
            <div className="flex justify-end pt-8 border-t border-white/5">
                <div className="w-72 space-y-3">
                    <div className="flex justify-between text-gray-400 text-sm">
                        <span>Subtotal</span>
                        <span className="font-mono">{subtotal.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-sm items-center">
                        <span className="flex items-center gap-1">
                            IVA %
                        </span>
                        <input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                            className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-xs outline-none focus:border-[#8b5cf6]"
                        />
                    </div>
                    <div className="flex justify-between text-gray-400 text-sm pb-2 border-b border-white/5">
                        <span>Importe IVA</span>
                        <span className="font-mono">{taxAmount.toFixed(2)} {currency}</span>
                    </div>

                    <div className="flex justify-between text-gray-400 text-sm items-center">
                        <span className="flex items-center gap-1">
                            IRPF %
                        </span>
                        <input
                            type="number"
                            value={irpfRate}
                            onChange={(e) => setIrpfRate(parseFloat(e.target.value) || 0)}
                            className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-xs outline-none focus:border-[#8b5cf6]"
                        />
                    </div>
                    <div className="flex justify-between text-gray-400 text-sm">
                        <span>Retención IRPF</span>
                        <span className="font-mono text-red-300">- {irpfAmount.toFixed(2)} {currency}</span>
                    </div>

                    <div className="flex justify-between items-end pt-4 border-t border-white/10 mt-2">
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Total</span>
                        <div className="text-right">
                            <span className="text-3xl font-display font-black text-[#8b5cf6] tracking-tighter block leading-none">
                                {total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-gray-500 font-bold">{currency}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-4 pt-6">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-gray-400 hover:text-white text-sm font-bold transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-[#8b5cf6] text-white font-black uppercase tracking-wider rounded-xl hover:bg-[#7c3aed] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                >
                    {loading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Factura')}
                </button>
            </div>
        </form>
    )
}
