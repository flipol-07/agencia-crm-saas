'use client'

import { useState, useEffect } from 'react'
import {
    ExpenseList,
    ExpenseForm,
    ExpenseSummary,
    SectorBreakdown,
    TaxForecastCard
} from '@/features/expenses/components'
import { useExpenses, useExpenseStats } from '@/features/expenses/hooks'
import { useTaxForecast } from '@/features/expenses/hooks/useTaxForecast'
import { ExpenseWithRelations, ExpenseInsert, Sector, ExpenseCategory } from '@/features/expenses/types'

interface ExpensesPageClientProps {
    userId: string
    initialSectors: Sector[]
    initialCategories: ExpenseCategory[]
}

type TabMode = 'personal' | 'empresa'

export function ExpensesPageClient({ userId, initialSectors, initialCategories }: ExpensesPageClientProps) {
    const [activeTab, setActiveTab] = useState<TabMode>('empresa')
    const [showForm, setShowForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null)

    const isPersonal = activeTab === 'personal'

    const {
        expenses,
        sectors,
        categories,
        isLoading,
        error,
        filters,
        setFilters,
        addExpense,
        editExpense,
        removeExpense
    } = useExpenses({
        is_personal: isPersonal,
        initialData: {
            sectors: initialSectors,
            categories: initialCategories
        }
    })

    const { stats, sectorStats, isLoading: statsLoading, refresh: refreshStats } = useExpenseStats(isPersonal)
    const { data: taxData, isLoading: taxLoading } = useTaxForecast()

    // Cambiar tab actualiza filtro
    useEffect(() => {
        setFilters({ ...filters, is_personal: isPersonal })
    }, [activeTab])

    const handleSubmit = async (expenseData: ExpenseInsert) => {
        if (editingExpense) {
            await editExpense(editingExpense.id, expenseData)
        } else {
            await addExpense(expenseData)
        }
        await refreshStats()
        setShowForm(false)
        setEditingExpense(null)
    }

    const handleEdit = (expense: ExpenseWithRelations) => {
        setEditingExpense(expense)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta transacción?')) {
            await removeExpense(id)
            await refreshStats()
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Economía</h1>
                    <p className="text-gray-400 mt-1">Gestiona tus ingresos y gastos</p>
                </div>
                <button
                    onClick={() => {
                        setEditingExpense(null)
                        setShowForm(true)
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-lime-400 text-black font-semibold rounded-lg hover:bg-lime-300 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir Transacción
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('empresa')}
                    className={`px-6 py-2.5 rounded-md font-medium transition-all ${activeTab === 'empresa'
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    🏢 Empresa
                </button>
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-6 py-2.5 rounded-md font-medium transition-all ${activeTab === 'personal'
                        ? 'bg-purple-500/30 text-purple-400 shadow-lg'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    👤 Personal
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <ExpenseSummary
                totalExpenses={stats?.total_expenses || 0}
                totalIncome={stats?.total_income || 0}
                balance={stats?.balance || 0}
                taxDeductible={stats?.tax_deductible_total || 0}
                isLoading={statsLoading}
            />

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Transactions List */}
                <div className="lg:col-span-2">
                    {/* Filters */}
                    <div className="glass rounded-xl p-4 mb-4">
                        <div className="flex flex-wrap gap-3">
                            {/* Type Filter */}
                            <select
                                value={filters.type || 'all'}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value as 'all' | 'expense' | 'income' })}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-lime-400 [&>option]:bg-zinc-900 [&>option]:text-white"
                            >
                                <option value="all">Todos</option>
                                <option value="income">Ingresos</option>
                                <option value="expense">Gastos</option>
                            </select>

                            {/* Sector Filter (solo empresa) */}
                            {!isPersonal && (
                                <select
                                    value={filters.sector_id || ''}
                                    onChange={(e) => setFilters({ ...filters, sector_id: e.target.value || null })}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-lime-400 [&>option]:bg-zinc-900 [&>option]:text-white"
                                >
                                    <option value="">Todos los sectores</option>
                                    {sectors.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}

                            {/* Category Filter */}
                            <select
                                value={filters.category_id || ''}
                                onChange={(e) => setFilters({ ...filters, category_id: e.target.value || null })}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-lime-400 [&>option]:bg-zinc-900 [&>option]:text-white"
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* List */}
                    <ExpenseList
                        expenses={expenses}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>

                {/* Right: Sector Breakdown (solo empresa) */}
                <div className="lg:col-span-1">
                    {!isPersonal && (
                        <SectorBreakdown
                            data={sectorStats}
                            isLoading={statsLoading}
                        />
                    )}

                    {!isPersonal && (
                        <div className="mt-6">
                            <TaxForecastCard
                                data={taxData}
                                isLoading={taxLoading}
                            />
                        </div>
                    )}

                    {isPersonal && (
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">💡 Tip</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Los gastos personales son 100% privados. Solo tú puedes ver y gestionar tus transacciones personales.
                            </p>
                            <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <p className="text-purple-400 text-sm">
                                    🔒 Protegido por Row Level Security
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <ExpenseForm
                    expense={editingExpense}
                    sectors={sectors}
                    categories={categories}
                    isPersonalMode={isPersonal}
                    userId={userId}
                    onSubmit={handleSubmit}
                    onClose={() => {
                        setShowForm(false)
                        setEditingExpense(null)
                    }}
                />
            )}
        </div>
    )
}
