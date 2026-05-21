'use client'

import { useMemo } from 'react'
import type { InvoiceWithDetails } from '@/types/database'

const fmt = (value: number) =>
    value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

interface Props {
    invoices: InvoiceWithDetails[]
}

export function InvoiceStats({ invoices }: Props) {
    const stats = useMemo(() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const monthStart = new Date(year, month, 1)
        const yearStart = new Date(year, 0, 1)
        const today = new Date(year, month, now.getDate())
        today.setHours(0, 0, 0, 0)

        let invoicedYear = 0
        let invoicedMonth = 0
        let paid = 0
        let pending = 0
        let overdue = 0
        let overdueCount = 0

        for (const inv of invoices) {
            if (inv.status === 'cancelled') continue
            const issueDate = inv.issue_date ? new Date(inv.issue_date) : null
            const dueDate = inv.due_date ? new Date(inv.due_date) : null
            const total = Number((inv as { total?: number }).total ?? (inv.subtotal + inv.tax_amount - (inv.irpf_amount || 0)))

            if (inv.status !== 'draft') {
                if (issueDate && issueDate >= yearStart) invoicedYear += total
                if (issueDate && issueDate >= monthStart) invoicedMonth += total
            }
            if (inv.status === 'paid') paid += total
            if (inv.status === 'sent' || inv.status === 'overdue') {
                pending += total
                if (inv.status === 'overdue' || (dueDate && dueDate < today)) {
                    overdue += total
                    overdueCount++
                }
            }
        }

        return { invoicedYear, invoicedMonth, paid, pending, overdue, overdueCount }
    }, [invoices])

    const cards = [
        { label: 'Facturado este mes', value: fmt(stats.invoicedMonth), tone: 'text-white' },
        { label: 'Facturado este año', value: fmt(stats.invoicedYear), tone: 'text-purple-300' },
        { label: 'Cobrado total', value: fmt(stats.paid), tone: 'text-emerald-300' },
        { label: 'Pendiente cobro', value: fmt(stats.pending), tone: 'text-blue-300' },
        {
            label: 'Vencido',
            value: stats.overdue > 0 ? `${fmt(stats.overdue)} · ${stats.overdueCount}` : '0 €',
            tone: stats.overdue > 0 ? 'text-red-300' : 'text-gray-400'
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map(c => (
                <div key={c.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{c.label}</div>
                    <div className={`text-xl font-bold mt-1 font-display ${c.tone}`}>{c.value}</div>
                </div>
            ))}
        </div>
    )
}
