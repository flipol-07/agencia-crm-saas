'use client'

import { useEffect, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { useInvoices } from '../hooks/useInvoices'
import { createInvoiceSubscriptionAction } from '../actions/subscriptionActions'
import type { InvoiceSubscriptionFrequency } from '@/types/database'

interface Props {
    open: boolean
    contactId: string
    onClose: () => void
    onCreated?: () => void
}

const FREQUENCY_OPTIONS: { value: InvoiceSubscriptionFrequency; label: string; help: string }[] = [
    { value: 'monthly', label: 'Mensual', help: 'Cada mes' },
    { value: 'quarterly', label: 'Trimestral', help: 'Cada 3 meses' },
    { value: 'yearly', label: 'Anual', help: 'Cada 12 meses' },
]

function todayString() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export function CreateSubscriptionModal({ open, contactId, onClose, onCreated }: Props) {
    const { invoices, loading } = useInvoices(contactId)
    const [templateId, setTemplateId] = useState<string>('')
    const [frequency, setFrequency] = useState<InvoiceSubscriptionFrequency>('monthly')
    const [startDate, setStartDate] = useState<string>(todayString())
    const [endDate, setEndDate] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    useEffect(() => {
        if (open && invoices.length > 0 && !templateId) {
            // Sugerir borrador o presupuesto primero.
            const preferred = invoices.find(i => i.status === 'draft' || i.status === 'quote') || invoices[0]
            setTemplateId(preferred.id)
        }
    }, [open, invoices, templateId])

    if (!open) return null

    const handleSubmit = () => {
        setError(null)
        if (!templateId) {
            setError('Selecciona una factura plantilla')
            return
        }
        if (!startDate) {
            setError('Selecciona una fecha de inicio')
            return
        }
        if (endDate && endDate < startDate) {
            setError('La fecha de fin no puede ser anterior al inicio')
            return
        }

        startTransition(async () => {
            const res = await createInvoiceSubscriptionAction({
                contact_id: contactId,
                template_invoice_id: templateId,
                frequency,
                start_date: startDate,
                end_date: endDate || null,
            })
            if (!res.success) {
                setError(res.error || 'Error al crear suscripción')
                return
            }
            onCreated?.()
            onClose()
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg glass-card rounded-2xl border border-white/10 p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-1">Crear suscripción</h2>
                <p className="text-sm text-gray-400 mb-6">Se emitirá una factura nueva cada ciclo copiando la plantilla.</p>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">Factura plantilla</label>
                        {loading ? (
                            <div className="h-10 bg-white/5 animate-pulse rounded-lg" />
                        ) : invoices.length === 0 ? (
                            <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                Este contacto no tiene facturas. Crea una primero (borrador o presupuesto).
                            </p>
                        ) : (
                            <select
                                value={templateId}
                                onChange={e => setTemplateId(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]/50"
                            >
                                {invoices.map(inv => (
                                    <option key={inv.id} value={inv.id} className="bg-zinc-900">
                                        {inv.invoice_number || 'Borrador'} — {(inv.subtotal + inv.tax_amount).toLocaleString('es-ES', { style: 'currency', currency: inv.currency })}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">Frecuencia</label>
                        <div className="grid grid-cols-3 gap-2">
                            {FREQUENCY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFrequency(opt.value)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                        frequency === opt.value
                                            ? 'bg-[#8b5cf6]/15 border-[#8b5cf6]/50 text-white'
                                            : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                                >
                                    <div>{opt.label}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{opt.help}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">Primera emisión</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">Fin (opcional)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]/50"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={pending || invoices.length === 0}
                            isLoading={pending}
                        >
                            Crear suscripción
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
