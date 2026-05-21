import type { CashForecast } from '../services/dashboard.service'

interface Props {
    forecast: CashForecast
}

const fmt = (value: number) =>
    value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function CashForecastWidget({ forecast }: Props) {
    const total = forecast.next30 + forecast.next60 + forecast.next90
    const cells = [
        { label: '30 días', value: forecast.next30, color: 'from-emerald-500/30 to-emerald-500/5', text: 'text-emerald-300' },
        { label: '60 días', value: forecast.next60, color: 'from-yellow-500/30 to-yellow-500/5', text: 'text-yellow-300' },
        { label: '90 días', value: forecast.next90, color: 'from-orange-500/30 to-orange-500/5', text: 'text-orange-300' },
    ]

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Previsión de cobros</h3>
                <p className="text-xs text-gray-500 mt-0.5">Facturas pendientes por vencer</p>
            </div>

            <div className="mb-6">
                <div className="text-3xl font-bold text-white font-display">{fmt(total)}</div>
                <div className="text-xs text-gray-500 mt-1">Total previsto próximos 90 días</div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
                {cells.map(c => (
                    <div key={c.label} className={`rounded-xl p-3 bg-gradient-to-br ${c.color} border border-white/5`}>
                        <div className={`text-[10px] uppercase tracking-wider font-bold ${c.text}`}>{c.label}</div>
                        <div className="text-base font-bold text-white mt-1 whitespace-nowrap">{fmt(c.value)}</div>
                    </div>
                ))}
            </div>

            <div className="border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500">Pipeline ponderado</div>
                        <div className="text-xs text-gray-500 mt-0.5">Valor × probabilidad</div>
                    </div>
                    <div className="text-lg font-bold text-purple-300 font-display">{fmt(forecast.weightedPipeline)}</div>
                </div>
            </div>
        </div>
    )
}
