'use client'

interface TaxForecastCardProps {
    data: {
        iva_repercutido: number
        iva_soportado: number
        iva_resultado: number
        quarter: number
        year: number
    } | null
    isLoading: boolean
}

export function TaxForecastCard({ data, isLoading }: TaxForecastCardProps) {
    if (isLoading) {
        return (
            <div className="glass rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
                <div className="h-8 bg-white/10 rounded w-3/4" />
            </div>
        )
    }

    if (!data) return null

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)

    const isPositive = data.iva_resultado > 0

    return (
        <div className="glass rounded-xl p-6 border-l-4 border-lime-400">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                        Previsión IVA Q{data.quarter} {data.year}
                    </h3>
                    <p className="text-2xl font-bold text-white mt-1">
                        {formatCurrency(data.iva_resultado)}
                    </p>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isPositive ? 'bg-orange-500/20 text-orange-400' : 'bg-lime-500/20 text-lime-400'}`}>
                    {isPositive ? 'A Pagar' : 'A Devolver'}
                </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">IVA Repercutido (Ventas)</span>
                    <span className="text-white font-medium">{formatCurrency(data.iva_repercutido)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">IVA Soportado (Gastos)</span>
                    <span className="text-white font-medium">{formatCurrency(data.iva_soportado)}</span>
                </div>
            </div>

            <p className="mt-4 text-[10px] text-gray-500 leading-tight">
                * Estimación basada en facturas emitidas y gastos deducibles del trimestre actual.
            </p>
        </div>
    )
}
