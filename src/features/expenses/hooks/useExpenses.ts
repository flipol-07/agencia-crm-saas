'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Expense,
    ExpenseInsert,
    ExpenseUpdate,
    ExpenseWithRelations,
    ExpenseFilters,
    Sector,
    ExpenseCategory
} from '../types'
import { createClient } from '@/lib/supabase/client'
import {
    createExpenseAction,
    updateExpenseAction,
    deleteExpenseAction
} from '../actions/expenseActions'

interface UseExpensesReturn {
    expenses: ExpenseWithRelations[]
    sectors: Sector[]
    categories: ExpenseCategory[]
    isLoading: boolean
    error: string | null
    filters: Partial<ExpenseFilters>
    setFilters: (filters: Partial<ExpenseFilters>) => void
    refresh: () => Promise<void>
    addExpense: (expense: ExpenseInsert) => Promise<Expense>
    editExpense: (id: string, expense: ExpenseUpdate) => Promise<Expense>
    removeExpense: (id: string) => Promise<void>
}

interface UseExpensesOptions {
    is_personal?: boolean
    initialData?: {
        sectors?: Sector[]
        categories?: ExpenseCategory[]
    }
}

export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
    const { is_personal = false, initialData } = options
    const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
    const [sectors, setSectors] = useState<Sector[]>(initialData?.sectors || [])
    const [categories, setCategories] = useState<ExpenseCategory[]>(initialData?.categories || [])
    const [isLoading, setIsLoading] = useState(!initialData?.sectors)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<Partial<ExpenseFilters>>({ is_personal })

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const supabase = createClient()

            // Re-fetch using client SDK for updates
            let query = (supabase.from('expenses') as any)
                .select(`
                    *,
                    sectors (id, name, color, icon),
                    expense_categories (id, name, type, icon)
                `)
                .order('date', { ascending: false })

            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type)
            }
            if (filters.is_personal !== undefined) {
                query = query.eq('is_personal', filters.is_personal)
            }

            const { data: expensesData, error: expError } = await query
            if (expError) throw expError

            setExpenses(expensesData || [])

            // Sectors and Categories typically don't change often, but we refresh anyway if not provided
            if (sectors.length === 0) {
                const { data: sData } = await supabase.from('sectors').select('*').order('name')
                if (sData) setSectors(sData)
            }
            if (categories.length === 0) {
                const { data: cData } = await supabase.from('expense_categories').select('*').order('name')
                if (cData) setCategories(cData)
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos')
        } finally {
            setIsLoading(false)
        }
    }, [filters, sectors.length, categories.length])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const addExpense = async (expense: ExpenseInsert): Promise<Expense> => {
        const newExpense = await createExpenseAction(expense)
        await fetchData()
        return newExpense
    }

    const editExpense = async (id: string, expense: ExpenseUpdate): Promise<Expense> => {
        const updated = await updateExpenseAction(id, expense)
        await fetchData()
        return updated
    }

    const removeExpense = async (id: string): Promise<void> => {
        await deleteExpenseAction(id)
        await fetchData()
    }

    return {
        expenses,
        sectors,
        categories,
        isLoading,
        error,
        filters,
        setFilters,
        refresh: fetchData,
        addExpense,
        editExpense,
        removeExpense
    }
}
