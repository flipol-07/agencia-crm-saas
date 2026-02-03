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
    const supabase = createAdminClient()

    // Fetch individual expenses/income from expenses table
    const { data: expensesData, error: expensesError } = await (supabase.from('expenses') as any)
        .select(`
            type,
            amount,
            sector_id,
            sectors (name, color)
        `)
        .eq('is_personal', false)
        .not('sector_id', 'is', null)

    if (expensesError) {
        console.error('[Expense Service] Error fetching expenses by sector:', expensesError)
        return []
    }

    // Fetch invoices with sector_id
    const { data: invoicesData, error: invoicesError } = await (supabase.from('invoices') as any)
        .select(`
            total,
            sector_id,
            sectors (name, color)
        `)
        .not('sector_id', 'is', null)

    if (invoicesError) {
        console.error('[Expense Service] Error fetching invoices by sector:', invoicesError)
    }

    const bySector: Record<string, any> = {}

    // Process expenses table entries
    for (const exp of (expensesData || [])) {
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

    // Process invoices table entries (all are income)
    for (const inv of (invoicesData || [])) {
        const sectorId = inv.sector_id
        const sector = inv.sectors

        if (!bySector[sectorId]) {
            bySector[sectorId] = {
                sector_name: sector?.name || 'Sin sector',
                sector_color: sector?.color || '#888',
                expenses: 0,
                income: 0
            }
        }

        bySector[sectorId].income += Number(inv.total)
    }

    return Object.entries(bySector).map(([sector_id, sectorData]: [string, any]) => ({
        sector_id,
        ...sectorData
    }))
}

export async function getTaxForecastCached(): Promise<{
    iva_repercutido: number
    iva_soportado: number
    iva_resultado: number
    quarter: number
    year: number
}> {
    const supabase = createAdminClient()
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const quarter = Math.floor(month / 3) + 1

    // Quarter dates
    const qStartMonth = (quarter - 1) * 3
    const startDate = new Date(year, qStartMonth, 1).toISOString().split('T')[0]
    const endDate = new Date(year, qStartMonth + 3, 0).toISOString().split('T')[0]

    // Fetch Invoices Tax (IVA Repercutido)
    const { data: invoices, error: invError } = await (supabase.from('invoices') as any)
        .select('tax_amount')
        .gte('issue_date', startDate)
        .lte('issue_date', endDate)
        .eq('status', 'paid') // Only paid? Or all issued? Usually all issued for IVA. Let's include all except draft/cancelled.
        .not('status', 'in', '("draft","cancelled")')

    // Fetch Expenses Tax (IVA Soportado)
    const { data: expenses, error: expError } = await (supabase.from('expenses') as any)
        .select('tax_amount')
        .eq('tax_deductible', true)
        .eq('is_personal', false)
        .gte('date', startDate)
        .lte('date', endDate)

    if (invError || expError) {
        console.error('[Tax Forecast] Error:', invError || expError)
        return { iva_repercutido: 0, iva_soportado: 0, iva_resultado: 0, quarter, year }
    }

    const iva_repercutido = (invoices || []).reduce((acc: number, inv: any) => acc + Number(inv.tax_amount || 0), 0)
    const iva_soportado = (expenses || []).reduce((acc: number, exp: any) => acc + Number(exp.tax_amount || 0), 0)

    return {
        iva_repercutido,
        iva_soportado,
        iva_resultado: iva_repercutido - iva_soportado,
        quarter,
        year
    }
}
