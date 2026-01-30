import { Card } from '@/shared/components/ui/Card'

interface FunnelStep {
    stage: string
    count: number
}

interface FunnelChartProps {
    data: FunnelStep[]
    loading?: boolean
}

export function FunnelChart({ data, loading }: FunnelChartProps) {
    if (loading) {
        return <div className="h-64 animate-pulse bg-white/5 rounded-xl" />
    }

    const maxCount = Math.max(...data.map(d => d.count), 1)

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Embudo de Conversión
            </h3>

            <div className="space-y-4">
                {data.map((step, index) => {
                    const percentage = Math.round((step.count / maxCount) * 100)
                    const isLast = index === data.length - 1

                    return (
                        <div key={step.stage} className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-text-muted">{step.stage}</span>
                                <span className="text-sm font-bold text-text-primary">{step.count}</span>
                            </div>

                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand/40 to-brand transition-all duration-1000 ease-out"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            {!isLast && (
                                <div className="flex justify-center my-1 select-none pointer-events-none">
                                    <div className="text-[10px] text-brand/30">▼</div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-text-muted text-center uppercase tracking-widest">
                Optimización del Motor de Ventas
            </div>
        </Card>
    )
}
