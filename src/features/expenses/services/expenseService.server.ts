'use cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { cacheLife } from 'next/cache'
import {
    ExpenseWithRelations,
    Sector,
    ExpenseCategory,
    ExpenseFilters
} from '../types'

export async function getSectorsCached(): Promise<Sector[]> {
    cacheLife('hours')
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from('sectors') as any)
        .select('*')
        .order('name')

    if (error) {
        console.error('[Expense Service] Error fetching sectors:', error)
        return []
    }
    return data as Sector[]
}

export async function getExpenseCategoriesCached(): Promise<ExpenseCategory[]> {
    cacheLife('hours')
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from('expense_categories') as any)
        .select('*')
        .order('name')

    if (error) {
        console.error('[Expense Service] Error fetching categories:', error)
        return []
    }
    return data as ExpenseCategory[]
}

export async function getExpensesCached(
    filters?: Partial<ExpenseFilters>
): Promise<ExpenseWithRelations[]> {
    cacheLife('minutes')
    const supabase = createAdminClient()
    let query = (supabase.from('expenses') as any)
        .select(`
            *,
            sectors (id, name, color, icon),
            expense_categories (id, name, type, icon)
        `)
        .order('date', { ascending: false })

    if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
    }
    if (filters?.sector_id) {
        query = query.eq('sector_id', filters.sector_id)
    }
    if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id)
    }
    if (filters?.is_personal !== null && filters?.is_personal !== undefined) {
        query = query.eq('is_personal', filters.is_personal)
    }
    if (filters?.date_from) {
        query = query.gte('date', filters.date_from)
    }
    if (filters?.date_to) {
        query = query.lte('date', filters.date_to)
    }

    const { data, error } = await query

    if (error) {
        console.error('[Expense Service] Error fetching expenses:', error)
        return []
    }
    return data as ExpenseWithRelations[]
}

export async function getExpenseStatsCached(
    is_personal: boolean | null = null
): Promise<{
    total_expenses: number
    total_income: number
    balance: number
    tax_deductible_total: number
}> {
    cacheLife('minutes')
    const supabase = createAdminClient()
    let query = (supabase.from('expenses') as any).select('type, amount, tax_amount, tax_deductible')

    if (is_personal !== null) {
        query = query.eq('is_personal', is_personal)
    }

    const { data, error } = await query

    if (error) {
        console.error('[Expense Service] Error fetching stats:', error)
        return { total_expenses: 0, total_income: 0, balance: 0, tax_deductible_total: 0 }
    }

    const expenses = (data || []) as any[]
    const stats = expenses.reduce(
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

    return {
        ...stats,
        balance: stats.total_income - stats.total_expenses
    }
}

export async function getExpensesBySectorCached(): Promise<
    { sector_id: string; sector_name: string; sector_color: string; expenses: number; income: number }[]
> {
    cacheLife('hours')
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from('expenses') as any)
        .select(`
            type,
            amount,
            sector_id,
            sectors (name, color)
        `)
        .eq('is_personal', false)
        .not('sector_id', 'is', null)

    if (error) {
        console.error('[Expense Service] Error fetching expenses by sector:', error)
        return []
    }

    const expenses = (data || []) as any[]
    const bySector: Record<string, any> = {}

    for (const exp of expenses) {
        const sectorId = exp.sector_id
        const sector = exp.sectors

        if (!bySector[sectorId]) {
            bySector[sectorId] = {
                sector_name: sector?.name || 'Sin sector',
                sector_color: sector?.color || '#888',
                expenses: 0,
                income: 0
            }
        }

        if (exp.type === 'expense') {
            bySector[sectorId].expenses += Number(exp.amount)
        } else {
            bySector[sectorId].income += Number(exp.amount)
        }
    }

    return Object.entries(bySector).map(([sector_id, sectorData]: [string, any]) => ({
        sector_id,
        ...sectorData
    }))
}
