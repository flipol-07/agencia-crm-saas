'use client'

interface ExpenseSummaryProps {
    totalExpenses: number
    totalIncome: number
    balance: number
    taxDeductible: number
    isLoading: boolean
}

export function ExpenseSummary({
    totalExpenses,
    totalIncome,
    balance,
    taxDeductible,
    isLoading
}: ExpenseSummaryProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value)

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl p-5 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-20 mb-3" />
                        <div className="h-8 bg-white/10 rounded w-28" />
                    </div>
                ))}
            </div>
        )
    }

    const cards = [
        {
            label: 'Ingresos',
            value: totalIncome,
            color: 'text-[#a78bfa]',
            bgColor: 'bg-[#8b5cf6]/10',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            )
        },
        {
            label: 'Gastos',
            value: totalExpenses,
            color: 'text-red-400',
            bgColor: 'bg-red-400/10',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            )
        },
        {
            label: 'Balance',
            value: balance,
            color: balance >= 0 ? 'text-[#a78bfa]' : 'text-red-400',
            bgColor: balance >= 0 ? 'bg-[#8b5cf6]/10' : 'bg-red-400/10',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
            )
        },
        {
            label: 'IVA Deducible',
            value: taxDeductible,
            color: 'text-purple-400',
            bgColor: 'bg-purple-400/10',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
            )
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="glass rounded-xl p-5 hover:bg-white/[0.08] transition-colors"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                            {card.icon}
                        </div>
                        <span className="text-sm text-gray-400">{card.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${card.color}`}>
                        {formatCurrency(card.value)}
                    </p>
                </div>
            ))}
        </div>
    )
}
