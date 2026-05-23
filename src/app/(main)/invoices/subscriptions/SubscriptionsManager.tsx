'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
    updateInvoiceSubscriptionAction,
    deleteInvoiceSubscriptionAction,
} from '@/features/invoices/actions/subscriptionActions'
import type { InvoiceSubscription, InvoiceSubscriptionFrequency } from '@/types/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Row extends InvoiceSubscription {
    contacts?: { id: string; contact_name: string | null; company_name: string | null } | null
}

interface Props {
    initialRows: Row[]
}

const FREQUENCY_LABEL: Record<InvoiceSubscriptionFrequency, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
}

export function SubscriptionsManager({ initialRows }: Props) {
    const [rows, setRows] = useState<Row[]>(initialRows)
    const [, startTransition] = useTransition()

    const toggle = (sub: Row) => {
        startTransition(async () => {
            const res = await updateInvoiceSubscriptionAction({ id: sub.id, active: !sub.active })
            if (res.success) {
                setRows(rs => rs.map(r => r.id === sub.id ? { ...r, active: !r.active } : r))
            }
        })
    }

    const remove = (sub: Row) => {
        if (!confirm('¿Eliminar suscripción? Las facturas ya emitidas no se borran.')) return
        startTransition(async () => {
            const res = await deleteInvoiceSubscriptionAction({ id: sub.id })
            if (res.success) setRows(rs => rs.filter(r => r.id !== sub.id))
        })
    }

    if (rows.length === 0) {
        return (
            <div className="glass-card rounded-3xl p-12 text-center border border-white/5">
                <h3 className="text-xl font-bold text-white mb-2">Sin suscripciones</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Abre el detalle de un contacto y crea una suscripción para emitir facturas
                    automáticamente cada ciclo (mensual, trimestral o anual).
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {rows.map(sub => {
                const contactName = sub.contacts?.contact_name || sub.contacts?.company_name || 'Contacto'
                return (
                    <div
                        key={sub.id}
                        className="flex items-center justify-between gap-3 p-4 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                {sub.contacts?.id ? (
                                    <Link
                                        href={`/contacts/${sub.contacts.id}`}
                                        className="text-sm font-semibold text-white hover:text-[#a78bfa] transition-colors"
                                    >
                                        {contactName}
                                    </Link>
                                ) : (
                                    <span className="text-sm font-semibold text-white">{contactName}</span>
                                )}
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-sm text-gray-300">{FREQUENCY_LABEL[sub.frequency]}</span>
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
                                onClick={() => toggle(sub)}
                                className="text-xs px-2 py-1 rounded-md text-gray-300 hover:bg-white/5 border border-white/10"
                            >
                                {sub.active ? 'Pausar' : 'Reanudar'}
                            </button>
                            <button
                                onClick={() => remove(sub)}
                                className="text-xs px-2 py-1 rounded-md text-red-400 hover:bg-red-500/10 border border-red-500/20"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
