'use server'

import { createClient } from '@/lib/supabase/server'
import {
    Expense,
    ExpenseInsert,
    ExpenseUpdate,
    ExpenseWithRelations,
    Sector,
    ExpenseCategory
} from '../types'
import { classifyExpenseAI } from '../services/expense-ai.service'

export async function classifyExpenseAction(params: {
    description: string
    sectors: Sector[]
    categories: ExpenseCategory[]
    type: 'expense' | 'income'
}) {
    return await classifyExpenseAI(params)
}

export async function getExpenseByIdAction(id: string): Promise<ExpenseWithRelations | null> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('expenses') as any)
        .select(`
            *,
            sectors (id, name, color, icon),
            expense_categories (id, name, type, icon)
        `)
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
    }
    return data as ExpenseWithRelations
}

export async function createExpenseAction(expense: ExpenseInsert): Promise<Expense> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('expenses') as any)
        .insert(expense as any)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data as Expense
}

export async function updateExpenseAction(id: string, expense: ExpenseUpdate): Promise<Expense> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('expenses') as any)
        .update({ ...expense, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data as Expense
}

export async function deleteExpenseAction(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await (supabase.from('expenses') as any)
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
}
