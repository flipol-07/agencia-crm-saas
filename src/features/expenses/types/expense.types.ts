// Tipos para el sistema de gestión económica

export interface Sector {
    id: string
    name: string
    color: string
    icon: string | null
    created_at: string
}

export interface ExpenseCategory {
    id: string
    name: string
    type: 'expense' | 'income' | 'both'
    icon: string | null
    created_at: string
}

export interface Expense {
    id: string
    user_id: string
    sector_id: string | null
    category_id: string | null
    type: 'expense' | 'income'
    amount: number
    currency: string
    date: string
    description: string | null
    is_personal: boolean
    tax_deductible: boolean
    tax_rate: number
    tax_amount: number // Calculado automáticamente en BD
    receipt_url: string | null
    created_at: string
    updated_at: string
}

export interface ExpenseWithRelations extends Expense {
    sectors?: Sector | null
    expense_categories?: ExpenseCategory | null
}

export type ExpenseInsert = Omit<Expense, 'id' | 'tax_amount' | 'created_at' | 'updated_at'>

export type ExpenseUpdate = Partial<Omit<ExpenseInsert, 'user_id'>>

// Filtros para la UI
export interface ExpenseFilters {
    type: 'all' | 'expense' | 'income'
    sector_id: string | null
    category_id: string | null
    is_personal: boolean | null
    date_from: string | null
    date_to: string | null
}

// Estadísticas agregadas
export interface ExpenseStats {
    total_expenses: number
    total_income: number
    balance: number
    tax_deductible_total: number
    by_sector: {
        sector_id: string
        sector_name: string
        sector_color: string
        expenses: number
        income: number
        balance: number
    }[]
    by_category: {
        category_id: string
        category_name: string
        total: number
        type: 'expense' | 'income'
    }[]
    monthly: {
        month: string
        expenses: number
        income: number
    }[]
}
