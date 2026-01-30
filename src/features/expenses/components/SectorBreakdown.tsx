'use client'

interface SectorData {
    sector_id: string
    sector_name: string
    sector_color: string
    expenses: number
    income: number
}

interface SectorBreakdownProps {
    data: SectorData[]
    isLoading: boolean
}

export function SectorBreakdown({ data, isLoading }: SectorBreakdownProps) {
    if (isLoading) {
        return (
            <div className="glass rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-white/10 rounded w-40 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-white/10" />
                            <div className="flex-1 h-4 bg-white/10 rounded" />
                            <div className="w-20 h-4 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Por Sector</h3>
                <p className="text-gray-400 text-sm">
                    No hay transacciones de empresa para mostrar
                </p>
            </div>
        )
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value)

    // Calcular total para porcentajes
    const totalAmount = data.reduce((acc, s) => acc + s.expenses + s.income, 0)

    return (
        <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Por Sector</h3>

            <div className="space-y-5">
                {data.map((sector) => {
                    const sectorTotal = sector.expenses + sector.income
                    const percentage = totalAmount > 0 ? (sectorTotal / totalAmount) * 100 : 0
                    const balance = sector.income - sector.expenses

                    return (
                        <div key={sector.sector_id}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: sector.sector_color }}
                                    />
                                    <span className="text-white font-medium">{sector.sector_name}</span>
                                </div>
                                <span className={`text-sm font-medium ${balance >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: sector.sector_color
                                    }}
                                />
                            </div>

                            {/* Details */}
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Ingresos: {formatCurrency(sector.income)}</span>
                                <span>Gastos: {formatCurrency(sector.expenses)}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-4">
                    {data.map((sector) => (
                        <div key={sector.sector_id} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: sector.sector_color }}
                            />
                            <span className="text-gray-400">{sector.sector_name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
