import Link from 'next/link'
import type { InvoiceAging } from '../services/dashboard.service'

interface Props {
    aging: InvoiceAging
}

const fmt = (value: number) =>
    value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function InvoiceAgingWidget({ aging }: Props) {
    const buckets = [
        { key: 'current', label: 'Al día', tone: 'emerald', data: aging.current },
        { key: 'overdue30', label: '1-30 días', tone: 'yellow', data: aging.overdue30 },
        { key: 'overdue60', label: '31-60 días', tone: 'orange', data: aging.overdue60 },
        { key: 'overdue90', label: '61-90 días', tone: 'red', data: aging.overdue90 },
        { key: 'overdue90plus', label: '+90 días', tone: 'red', data: aging.overdue90plus },
    ]

    const total = buckets.reduce((sum, b) => sum + b.data.total, 0)
    const hasData = total > 0

    const toneClasses = (tone: string) => {
        switch (tone) {
            case 'emerald': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
            case 'yellow': return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20'
            case 'orange': return 'bg-orange-500/15 text-orange-300 border-orange-500/20'
            case 'red': return 'bg-red-500/15 text-red-300 border-red-500/20'
            default: return 'bg-white/5 text-gray-300 border-white/10'
        }
    }
    const barTone = (tone: string) => {
        switch (tone) {
            case 'emerald': return 'bg-emerald-400'
            case 'yellow': return 'bg-yellow-400'
            case 'orange': return 'bg-orange-400'
            case 'red': return 'bg-red-400'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Antigüedad facturas</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cobros pendientes por plazo</p>
                </div>
                <Link href="/invoices" className="text-xs text-brand-neon-purple hover:text-white transition-colors">
                    Ver todas →
                </Link>
            </div>

            {!hasData ? (
                <div className="py-10 text-center text-sm text-gray-500">
                    Sin facturas pendientes
                </div>
            ) : (
                <>
                    <div className="mb-5">
                        <div className="text-2xl font-bold text-white mb-1">{fmt(total)}</div>
                        <div className="text-xs text-gray-500">Total pendiente</div>
                    </div>

                    {/* Stacked bar */}
                    <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-white/5">
                        {buckets.map(b => b.data.total > 0 && (
                            <div
                                key={b.key}
                                className={barTone(b.tone)}
                                style={{ width: `${(b.data.total / total) * 100}%` }}
                                title={`${b.label}: ${fmt(b.data.total)}`}
                            />
                        ))}
                    </div>

                    <div className="space-y-2">
                        {buckets.map(b => (
                            <div key={b.key} className="flex items-center justify-between text-sm py-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toneClasses(b.tone)}`}>
                                        {b.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">{b.data.count}</span>
                                    <span className="text-sm text-white font-medium">{fmt(b.data.total)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
