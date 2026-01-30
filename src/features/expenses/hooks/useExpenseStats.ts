'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ExpenseStats {
    total_expenses: number
    total_income: number
    balance: number
    tax_deductible_total: number
}

interface SectorStats {
    sector_id: string
    sector_name: string
    sector_color: string
    expenses: number
    income: number
}

interface UseExpenseStatsReturn {
    stats: ExpenseStats | null
    sectorStats: SectorStats[]
    isLoading: boolean
    error: string | null
    refresh: () => Promise<void>
}

interface UseExpenseStatsOptions {
    isPersonal?: boolean | null
    initialData?: {
        stats?: ExpenseStats | null
        sectorStats?: SectorStats[]
    }
}

export function useExpenseStats(options: UseExpenseStatsOptions | boolean | null = null): UseExpenseStatsReturn {
    // Soporte para firma antigua (boolean) y nueva (object)
    const isPersonal = typeof options === 'object' && options !== null ? options.isPersonal : options
    const initialData = typeof options === 'object' && options !== null ? options.initialData : undefined

    const [stats, setStats] = useState<ExpenseStats | null>(initialData?.stats || null)
    const [sectorStats, setSectorStats] = useState<SectorStats[]>(initialData?.sectorStats || [])
    const [isLoading, setIsLoading] = useState(!initialData?.stats)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const supabase = createClient()

            // Re-fetch using client SDK
            const [{ data: statsData, error: sError }, { data: sectorData, error: scError }] = await Promise.all([
                (supabase.from('expenses') as any).select('type, amount, tax_amount, tax_deductible').eq('is_personal', isPersonal ?? false),
                (isPersonal === false || isPersonal === null)
                    ? (supabase.from('expenses') as any).select('type, amount, sector_id, sectors(name, color)').eq('is_personal', false).not('sector_id', 'is', null)
                    : Promise.resolve({ data: [], error: null })
            ])

            if (sError) throw sError
            if (scError) throw scError

            // Process stats
            const expenses = (statsData || []) as any[]
            const processedStats = expenses.reduce(
                (acc, exp) => {
                    if (exp.type === 'expense') {
                        acc.total_expenses += Number(exp.amount)
                    } else {
                        acc.total_income += Number(exp.amount)
                    }
                    if (exp.tax_deductible) {
                        acc.tax_deductible_total += Number(exp.tax_amount || 0)
                    }
                    return acc
                },
                { total_expenses: 0, total_income: 0, tax_deductible_total: 0 }
            )

            setStats({
                ...processedStats,
                balance: processedStats.total_income - processedStats.total_expenses
            })

            // Process sector stats
            if (!isPersonal) {
                const bySector: Record<string, any> = {}
                for (const exp of (sectorData || [])) {
                    const sectorId = exp.sector_id
                    const sector = exp.sectors
                    if (!bySector[sectorId]) {
                        bySector[sectorId] = { sector_name: sector?.name || 'Sin sector', sector_color: sector?.color || '#888', expenses: 0, income: 0 }
                    }
                    if (exp.type === 'expense') bySector[sectorId].expenses += Number(exp.amount)
                    else bySector[sectorId].income += Number(exp.amount)
                }
                setSectorStats(Object.entries(bySector).map(([id, data]) => ({ sector_id: id, ...(data as any) })))
            } else {
                setSectorStats([])
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [isPersonal])

    return {
        stats,
        sectorStats,
        isLoading,
        error,
        refresh: fetchStats
    }
}
