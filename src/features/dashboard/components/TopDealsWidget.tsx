import Link from 'next/link'
import type { TopDeal } from '../services/dashboard.service'

interface Props {
    deals: TopDeal[]
}

const fmt = (value: number) =>
    value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const stageLabel = (stage: string) => {
    const map: Record<string, string> = {
        nuevo: 'Nuevo',
        cualificacion: 'Cualificación',
        propuesta: 'Propuesta',
        negociacion: 'Negociación',
        enviada: 'Enviada',
        ganado: 'Ganado',
        perdido: 'Perdido',
    }
    return map[stage] || stage
}

export function TopDealsWidget({ deals }: Props) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top deals</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Mayor valor estimado</p>
                </div>
                <Link href="/pipeline" className="text-xs text-brand-neon-purple hover:text-white transition-colors">
                    Pipeline →
                </Link>
            </div>

            {deals.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                    Sin deals con valor estimado
                </div>
            ) : (
                <div className="space-y-2">
                    {deals.map((deal, idx) => (
                        <Link
                            key={deal.id}
                            href={`/contacts/${deal.id}`}
                            className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-purple-400/30 hover:bg-white/5 transition-all"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-sm font-bold text-purple-300">
                                {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-white group-hover:text-brand-neon-purple transition-colors">
                                    {deal.company_name}
                                </div>
                                <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span>{stageLabel(deal.pipeline_stage)}</span>
                                    {deal.probability_close > 0 && (
                                        <>
                                            <span className="opacity-50">•</span>
                                            <span>{deal.probability_close}% cierre</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white whitespace-nowrap">{fmt(deal.estimated_value)}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
