'use client'

import { useState, useEffect } from 'react'
import { ExpenseInsert, ExpenseWithRelations, Sector, ExpenseCategory } from '../types'
import { classifyExpenseAction } from '../actions/expenseActions'

interface ExpenseFormProps {
    expense?: ExpenseWithRelations | null
    sectors: Sector[]
    categories: ExpenseCategory[]
    isPersonalMode: boolean
    userId: string
    onSubmit: (expense: ExpenseInsert) => Promise<void>
    onClose: () => void
}

export function ExpenseForm({
    expense,
    sectors,
    categories,
    isPersonalMode,
    userId,
    onSubmit,
    onClose
}: ExpenseFormProps) {
    const [formData, setFormData] = useState({
        type: 'expense' as 'expense' | 'income',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        sector_id: '',
        category_id: '',
        tax_deductible: false,
        tax_rate: 21
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [aiReason, setAiReason] = useState<string | null>(null)

    useEffect(() => {
        if (expense) {
            setFormData({
                type: expense.type,
                amount: expense.amount.toString(),
                description: expense.description || '',
                date: expense.date,
                sector_id: expense.sector_id || '',
                category_id: expense.category_id || '',
                tax_deductible: expense.tax_deductible,
                tax_rate: expense.tax_rate
            })
        }
    }, [expense])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('El importe debe ser mayor que 0')
            return
        }

        setIsSubmitting(true)
        try {
            await onSubmit({
                user_id: userId,
                type: formData.type,
                amount: parseFloat(formData.amount),
                currency: 'EUR',
                description: formData.description || null,
                date: formData.date,
                sector_id: !isPersonalMode && formData.sector_id ? formData.sector_id : null,
                category_id: formData.category_id || null,
                is_personal: isPersonalMode,
                tax_deductible: formData.tax_deductible,
                tax_rate: formData.tax_rate,
                receipt_url: null
            })
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAIClassify = async () => {
        if (!formData.description) {
            setError('Escribe una descripción primero para que la IA pueda analizarla')
            return
        }

        setIsAnalyzing(true)
        setError(null)
        setAiReason(null)

        try {
            const results = await classifyExpenseAction({
                description: formData.description,
                sectors,
                categories,
                type: formData.type
            })

            console.log('[AI Classification]', results)

            if (results) {
                setFormData(prev => ({
                    ...prev,
                    sector_id: results.sector_id || prev.sector_id,
                    category_id: results.category_id || prev.category_id,
                    tax_rate: results.tax_rate ?? prev.tax_rate,
                    tax_deductible: results.tax_deductible ?? prev.tax_deductible
                }))
                setAiReason(results.reason)
            }
        } catch (err) {
            console.error('AI Classification failed:', err)
            setError('La IA no pudo clasificar la transacción. Inténtalo manualmente.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const filteredCategories = categories.filter(
        c => c.type === formData.type || c.type === 'both'
    )

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">
                        {expense ? 'Editar Transacción' : 'Nueva Transacción'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Type Toggle */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'expense' })}
                            className={`flex-1 py-2.5 rounded-md font-medium transition-all ${formData.type === 'expense'
                                ? 'bg-red-500/30 text-red-400'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            💸 Gasto
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'income' })}
                            className={`flex-1 py-2.5 rounded-md font-medium transition-all ${formData.type === 'income'
                                ? 'bg-[#8b5cf6]/30 text-[#a78bfa]'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            💰 Ingreso
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Importe (€) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 text-2xl font-semibold"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Descripción
                            </label>
                            {formData.description && (
                                <button
                                    type="button"
                                    onClick={handleAIClassify}
                                    disabled={isAnalyzing}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#a78bfa] text-xs font-semibold hover:bg-[#8b5cf6]/20 transition-all disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Analizando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Clasificación Mágica
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="ej: API OpenAI enero"
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]/50"
                        />
                        {aiReason && (
                            <p className="mt-2 text-xs text-[#a78bfa]/80 flex items-start gap-1.5">
                                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                AI sugerencia: {aiReason}
                            </p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400"
                            required
                        />
                    </div>

                    {/* Sector (solo para empresa) */}
                    {!isPersonalMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Sector
                            </label>
                            <select
                                value={formData.sector_id}
                                onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400 [&>option]:bg-zinc-900 [&>option]:text-white"
                            >
                                <option value="">Seleccionar sector...</option>
                                {sectors.map((sector) => (
                                    <option key={sector.id} value={sector.id}>
                                        {sector.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Categoría
                        </label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-lime-400 [&>option]:bg-zinc-900 [&>option]:text-white"
                        >
                            <option value="">Seleccionar categoría...</option>
                            {filteredCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tax Deductible */}
                    {formData.type === 'expense' && (
                        <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.tax_deductible}
                                    onChange={(e) => setFormData({ ...formData, tax_deductible: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#8b5cf6] focus:ring-[#8b5cf6]/20"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">Gasto deducible (IVA)</span>
                                    <div className="group relative">
                                        <svg className="w-4 h-4 text-gray-400 hover:text-[#a78bfa] transition-colors cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-white/10 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                            Activa esta opción si el gasto tiene factura y puedes recuperar el IVA en tu declaración de impuestos.
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {formData.tax_deductible && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Tipo de IVA
                                    </label>
                                    <div className="flex gap-2">
                                        {[21, 10, 4].map((rate) => (
                                            <button
                                                key={rate}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, tax_rate: rate })}
                                                className={`flex-1 py-2 rounded-lg font-medium transition-all ${formData.tax_rate === rate
                                                    ? 'bg-[#8b5cf6] text-white'
                                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                    }`}
                                            >
                                                {rate}%
                                            </button>
                                        ))}
                                    </div>
                                    {formData.amount && (
                                        <p className="mt-2 text-sm text-[#a78bfa]">
                                            IVA a desgravar: {(parseFloat(formData.amount) * formData.tax_rate / 100).toFixed(2)}€
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-lg bg-[#8b5cf6] text-white font-semibold hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                        >
                            {isSubmitting ? 'Guardando...' : expense ? 'Actualizar' : 'Añadir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
