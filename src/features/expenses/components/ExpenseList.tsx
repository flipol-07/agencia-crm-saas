'use client'

import { ExpenseWithRelations } from '../types'

interface ExpenseListProps {
    expenses: ExpenseWithRelations[]
    isLoading: boolean
    onEdit: (expense: ExpenseWithRelations) => void
    onDelete: (id: string) => void
}

export function ExpenseList({ expenses, isLoading, onEdit, onDelete }: ExpenseListProps) {
    if (isLoading) {
        return (
            <div className="glass rounded-xl p-8">
                <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">Cargando transacciones...</span>
                </div>
            </div>
        )
    }

    if (expenses.length === 0) {
        return (
            <div className="glass rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Sin transacciones</h3>
                <p className="text-gray-400">Añade tu primer gasto o ingreso para empezar</p>
            </div>
        )
    }

    // Agrupar por fecha
    const groupedByDate = expenses.reduce((acc, expense) => {
        const date = expense.date
        if (!acc[date]) acc[date] = []
        acc[date].push(expense)
        return acc
    }, {} as Record<string, ExpenseWithRelations[]>)

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) return 'Hoy'
        if (date.toDateString() === yesterday.toDateString()) return 'Ayer'

        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const formatAmount = (amount: number, type: string) => {
        const formatted = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount)
        return type === 'income' ? `+${formatted}` : `-${formatted}`
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, dayExpenses]) => (
                <div key={date}>
                    <h3 className="text-sm font-medium text-gray-400 mb-3 capitalize">
                        {formatDate(date)}
                    </h3>
                    <div className="space-y-2">
                        {dayExpenses.map((expense) => (
                            <div
                                key={expense.id}
                                className="glass rounded-lg p-4 flex items-center gap-4 group hover:bg-white/10 transition-colors cursor-pointer"
                                onClick={() => onEdit(expense)}
                            >
                                {/* Icon */}
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                    style={{
                                        backgroundColor: expense.type === 'income' ? 'rgba(163, 230, 53, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                                    }}
                                >
                                    {expense.type === 'income' ? '📈' : '📉'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">
                                        {expense.description || expense.expense_categories?.name || 'Sin descripción'}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        {expense.sectors && (
                                            <>
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: expense.sectors.color }}
                                                />
                                                <span>{expense.sectors.name}</span>
                                                <span>•</span>
                                            </>
                                        )}
                                        {expense.is_personal && (
                                            <span className="text-purple-400">Personal</span>
                                        )}
                                        {expense.tax_deductible && (
                                            <span className="text-lime-400">Deducible</span>
                                        )}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <p className={`font-semibold ${expense.type === 'income' ? 'text-lime-400' : 'text-red-400'}`}>
                                        {formatAmount(expense.amount, expense.type)}
                                    </p>
                                    {expense.tax_deductible && expense.tax_amount > 0 && (
                                        <p className="text-xs text-gray-500">
                                            IVA: {expense.tax_amount.toFixed(2)}€
                                        </p>
                                    )}
                                </div>

                                {/* Delete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(expense.id)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
