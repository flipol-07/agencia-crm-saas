'use client'

import { Card } from '@/shared/components/ui/Card'
import dynamic from 'next/dynamic'
import type { MonthlyTrendData } from '../services/dashboard.service'

// Dynamic import to avoid SSR issues with Recharts
const LineChart = dynamic(
    () => import('recharts').then(mod => mod.LineChart),
    { ssr: false }
)
const Line = dynamic(
    () => import('recharts').then(mod => mod.Line),
    { ssr: false }
)
const XAxis = dynamic(
    () => import('recharts').then(mod => mod.XAxis),
    { ssr: false }
)
const YAxis = dynamic(
    () => import('recharts').then(mod => mod.YAxis),
    { ssr: false }
)
const CartesianGrid = dynamic(
    () => import('recharts').then(mod => mod.CartesianGrid),
    { ssr: false }
)
const Tooltip = dynamic(
    () => import('recharts').then(mod => mod.Tooltip),
    { ssr: false }
)
const ResponsiveContainer = dynamic(
    () => import('recharts').then(mod => mod.ResponsiveContainer),
    { ssr: false }
)
const Legend = dynamic(
    () => import('recharts').then(mod => mod.Legend),
    { ssr: false }
)

interface TrendChartProps {
    data: MonthlyTrendData[]
    loading?: boolean
}

export function TrendChart({ data, loading }: TrendChartProps) {
    if (loading) {
        return (
            <Card className="p-6 h-[350px]">
                <div className="h-full animate-pulse bg-white/5 rounded-xl" />
            </Card>
        )
    }

    const hasData = data.some(d => d.income > 0 || d.expenses > 0)

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_10px_rgba(163,230,53,0.5)]"></span>
                Tendencia Ingresos vs Gastos
            </h3>

            {!hasData ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                    <p className="text-text-muted text-sm mb-2">Sin datos históricos</p>
                    <p className="text-text-muted/60 text-xs">Registra facturas y gastos para ver la tendencia</p>
                </div>
            ) : (
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="month"
                                stroke="#a0a0a0"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#a0a0a0"
                                fontSize={12}
                                tickLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#181818',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                formatter={(value) => [`${Number(value).toLocaleString('es-ES')} €`, '']}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="income"
                                name="Ingresos"
                                stroke="#a3e635"
                                strokeWidth={2}
                                dot={{ fill: '#a3e635', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, fill: '#a3e635' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expenses"
                                name="Gastos"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6, fill: '#f97316' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    )
}
