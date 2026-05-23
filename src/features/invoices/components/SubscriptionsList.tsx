'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { CreateSubscriptionModal } from './CreateSubscriptionModal'
import {
    listSubscriptionsByContactAction,
    updateInvoiceSubscriptionAction,
    deleteInvoiceSubscriptionAction,
} from '../actions/subscriptionActions'
import type { InvoiceSubscription, InvoiceSubscriptionFrequency } from '@/types/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const FREQUENCY_LABEL: Record<InvoiceSubscriptionFrequency, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
}

interface Props {
    contactId: string
}

export function SubscriptionsList({ contactId }: Props) {
    const [subs, setSubs] = useState<InvoiceSubscription[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [, startTransition] = useTransition()

    const refresh = useCallback(async () => {
        setLoading(true)
        const res = await listSubscriptionsByContactAction(contactId)
        if (res.success && res.data) setSubs(res.data)
        setLoading(false)
    }, [contactId])

    useEffect(() => { refresh() }, [refresh])

    const handleToggleActive = (sub: InvoiceSubscription) => {
        startTransition(async () => {
            const res = await updateInvoiceSubscriptionAction({ id: sub.id, active: !sub.active })
            if (res.success) refresh()
        })
    }

    const handleDelete = (sub: InvoiceSubscription) => {
        if (!confirm('¿Eliminar esta suscripción? Las facturas ya emitidas no se borran.')) return
        startTransition(async () => {
            const res = await deleteInvoiceSubscriptionAction({ id: sub.id })
            if (res.success) refresh()
        })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>🔁</span> Suscripciones
                </h2>
                <button
                    onClick={() => setModalOpen(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#8b5cf6]/15 text-[#a78bfa] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/25 transition-all"
                >
                    + Nueva suscripción
                </button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    <div className="h-16 bg-white/5 animate-pulse rounded-lg" />
                </div>
            ) : subs.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white/[0.02] border border-dashed border-white/10 rounded-lg px-4 py-6 text-center">
                    Sin suscripciones activas. Crea una para emitir facturas automáticamente cada ciclo.
                </p>
            ) : (
                <div className="space-y-2">
                    {subs.map(sub => (
                        <div
                            key={sub.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-white">
                                        {FREQUENCY_LABEL[sub.frequency]}
                                    </span>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                                        sub.active
                                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                        {sub.active ? 'Activa' : 'Pausada'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span>Próxima: {format(new Date(sub.next_run_at), "d MMM yyyy", { locale: es })}</span>
                                    {sub.last_run_at && (
                                        <span>Última: {format(new Date(sub.last_run_at), "d MMM yyyy", { locale: es })}</span>
                                    )}
                                    <span>Emitidas: {sub.occurrences_count}</span>
                                    {sub.end_date && (
                                        <span>Fin: {format(new Date(sub.end_date), "d MMM yyyy", { locale: es })}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleToggleActive(sub)}
                                    className="text-xs px-2 py-1 rounded-md text-gray-300 hover:bg-white/5 border border-white/10"
                                    title={sub.active ? 'Pausar' : 'Reanudar'}
                                >
                                    {sub.active ? 'Pausar' : 'Reanudar'}
                                </button>
                                <button
                                    onClick={() => handleDelete(sub)}
                                    className="text-xs px-2 py-1 rounded-md text-red-400 hover:bg-red-500/10 border border-red-500/20"
                                    title="Eliminar"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateSubscriptionModal
                open={modalOpen}
                contactId={contactId}
                onClose={() => setModalOpen(false)}
                onCreated={refresh}
            />
        </div>
    )
}
