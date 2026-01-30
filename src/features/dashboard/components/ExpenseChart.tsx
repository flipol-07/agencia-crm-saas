'use client'

import { Card } from '@/shared/components/ui/Card'
import dynamic from 'next/dynamic'
import type { ExpenseDistributionData } from '../services/dashboard.service'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts'
import { useEffect, useState } from 'react'


interface ExpenseChartProps {
    data: ExpenseDistributionData[]
    loading?: boolean
}

export function ExpenseChart({ data, loading }: ExpenseChartProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (loading || !mounted) {
        return (
            <Card className="p-6 h-[350px]">
                <div className="h-full animate-pulse bg-white/5 rounded-xl" />
            </Card>
        )
    }

    const hasData = data.length > 0 && data.some(d => d.value > 0)
    const total = data.reduce((sum, d) => sum + d.value, 0)

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-purple shadow-[0_0_10px_rgba(147,51,234,0.5)]"></span>
                Distribución de Gastos
            </h3>

            {!hasData ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </div>
                    <p className="text-text-muted text-sm mb-2">Sin gastos registrados</p>
                    <p className="text-text-muted/60 text-xs">Añade gastos de empresa para ver la distribución</p>
                </div>
            ) : (
                <div className="flex items-center gap-6">
                    {/* Chart */}
                    <div className="w-[180px] h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color || '#3b82f6'}
                                            stroke="rgba(0,0,0,0.2)"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#181818',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                    formatter={(value) => [`${Number(value).toLocaleString('es-ES')} €`, '']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3">
                        {data.slice(0, 5).map((item, index) => {
                            const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                            return (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-sm text-text-secondary truncate max-w-[120px]">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-text-primary">
                                            {item.value.toLocaleString('es-ES')} €
                                        </span>
                                        <span className="text-xs text-text-muted ml-2">
                                            ({percent}%)
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        {data.length > 5 && (
                            <p className="text-xs text-text-muted pt-2 border-t border-white/5">
                                + {data.length - 5} categorías más
                            </p>
                        )}
                    </div>
                </div>
            )}
        </Card>
    )
}
