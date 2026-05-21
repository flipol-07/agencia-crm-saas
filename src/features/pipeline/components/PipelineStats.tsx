'use client'

import { useMemo } from 'react'
import { useContacts } from '@/features/contacts/hooks'

const fmt = (value: number) =>
    value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const daysSince = (dateValue: string | null) => {
    if (!dateValue) return 999
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return 999
    return Math.floor((Date.now() - date.getTime()) / 86400000)
}

export function PipelineStats() {
    const { contacts, loading } = useContacts()

    const stats = useMemo(() => {
        const active = contacts.filter(c => !['won', 'lost'].includes(c.status))
        const won = contacts.filter(c => c.status === 'won')
        const lost = contacts.filter(c => c.status === 'lost')
        const totalValue = active.reduce((sum, c) => sum + (c.estimated_value || 0), 0)
        const avgValue = active.length > 0 ? Math.round(totalValue / active.length) : 0
        const weighted = active.reduce((sum, c) =>
            sum + ((c.estimated_value || 0) * ((c.probability_close || 0) / 100)), 0)
        const stalled = active.filter(c => daysSince(c.last_interaction) >= 14).length
        const closed = won.length + lost.length
        const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0

        return {
            activeCount: active.length,
            totalValue,
            avgValue,
            weighted: Math.round(weighted),
            stalled,
            winRate,
            won: won.length,
            lost: lost.length,
        }
    }, [contacts])

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                ))}
            </div>
        )
    }

    const cells = [
        { label: 'Leads activos', value: stats.activeCount.toString(), accent: 'text-white' },
        { label: 'Valor total', value: fmt(stats.totalValue), accent: 'text-emerald-300' },
        { label: 'Valor medio', value: fmt(stats.avgValue), accent: 'text-blue-300' },
        { label: 'Pipeline ponderado', value: fmt(stats.weighted), accent: 'text-purple-300' },
        { label: 'Estancados +14d', value: stats.stalled.toString(), accent: stats.stalled > 0 ? 'text-amber-300' : 'text-white' },
        { label: 'Win rate', value: `${stats.winRate}%`, accent: 'text-emerald-300' },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {cells.map(c => (
                <div key={c.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{c.label}</div>
                    <div className={`text-xl font-bold mt-1 font-display ${c.accent}`}>{c.value}</div>
                </div>
            ))}
        </div>
    )
}
