'use client'

import Link from 'next/link'
import type { AgingBucket, AgingReportData } from '@/features/invoices/services/aging.service.server'

interface Props {
    data: AgingReportData
    buckets: AgingBucket[]
}

const BUCKET_COLORS: Record<AgingBucket['label'], { bar: string; pill: string }> = {
    '0-30':  { bar: 'bg-emerald-500/70', pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    '31-60': { bar: 'bg-yellow-500/70',  pill: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
    '61-90': { bar: 'bg-orange-500/70',  pill: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
    '90+':   { bar: 'bg-red-500/70',     pill: 'bg-red-500/10 text-red-300 border-red-500/20' },
}

function fmt(amount: number, currency = 'EUR') {
    return amount.toLocaleString('es-ES', { style: 'currency', currency })
}

export function AgingReportClient({ data, buckets }: Props) {
    const handleExport = () => {
        const header = ['Contacto', ...buckets.map(b => b.label), 'Total']
        const lines: string[] = [header.join(',')]
        for (const c of data.byContact) {
            lines.push([
                csv(c.contact_name),
                ...buckets.map(b => c.buckets[b.label].toFixed(2)),
                c.total.toFixed(2),
            ].join(','))
        }
        lines.push([
            'TOTAL',
            ...buckets.map(b => data.totals[b.label].toFixed(2)),
            data.grandTotal.toFixed(2),
        ].join(','))

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `aging-report-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const maxBucket = Math.max(...buckets.map(b => data.totals[b.label]), 1)

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                    Generado: {new Date(data.generatedAt).toLocaleString('es-ES')}
                </p>
                <button
                    onClick={handleExport}
                    disabled={data.byContact.length === 0}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Exportar CSV
                </button>
            </div>

            {/* Totales por bucket */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {buckets.map(b => (
                    <div key={b.label} className="glass rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{b.label} días</div>
                        <div className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${BUCKET_COLORS[b.label].pill}`}>
                            {b.label === '0-30' ? 'Recientes' : b.label === '90+' ? 'Crítico' : 'En riesgo'}
                        </div>
                        <div className="text-xl font-bold text-white mt-2">{fmt(data.totals[b.label])}</div>
                    </div>
                ))}
            </div>

            {/* Stacked bar global */}
            <div className="glass rounded-xl p-6 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-4">Distribución global</h3>
                <div className="space-y-2">
                    {buckets.map(b => {
                        const value = data.totals[b.label]
                        const pct = (value / maxBucket) * 100
                        return (
                            <div key={b.label} className="flex items-center gap-3">
                                <div className="w-16 text-[10px] text-gray-400 font-mono">{b.label}d</div>
                                <div className="flex-1 h-4 bg-white/5 rounded-md overflow-hidden">
                                    <div className={`h-full ${BUCKET_COLORS[b.label].bar} transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="w-28 text-right text-xs text-gray-300 font-mono">{fmt(value)}</div>
                            </div>
                        )
                    })}
                    <div className="border-t border-white/10 pt-3 mt-3 flex justify-between">
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Total pendiente</span>
                        <span className="text-base font-bold text-white">{fmt(data.grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Tabla por contacto */}
            <div className="glass rounded-xl border border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white">Por contacto</h3>
                </div>
                {data.byContact.length === 0 ? (
                    <div className="p-12 text-center text-sm text-gray-400">
                        Sin facturas pendientes vencidas. Buen trabajo 👌
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-black/30 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <tr>
                                    <th className="px-4 py-3 text-left">Contacto</th>
                                    {buckets.map(b => (
                                        <th key={b.label} className="px-4 py-3 text-right">{b.label}d</th>
                                    ))}
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.byContact.map(c => (
                                    <tr key={c.contact_id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/contacts/${c.contact_id}`} className="text-white hover:text-[#a78bfa] font-medium">
                                                {c.contact_name}
                                            </Link>
                                        </td>
                                        {buckets.map(b => (
                                            <td key={b.label} className="px-4 py-3 text-right text-gray-300 font-mono text-xs">
                                                {c.buckets[b.label] > 0 ? fmt(c.buckets[b.label], c.currency) : '—'}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-right text-white font-bold font-mono text-xs">
                                            {fmt(c.total, c.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function csv(s: string): string {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
}
