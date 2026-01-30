'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { type DashboardPeriod } from '../services/dashboard.service'

export function PeriodSelector({ periods }: { periods: { value: DashboardPeriod; label: string }[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentPeriod = (searchParams.get('period') as DashboardPeriod) || '30d'

    const setPeriod = (period: DashboardPeriod) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', period)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
            {periods.map((p) => (
                <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${currentPeriod === p.value
                        ? 'bg-brand text-black shadow-lg shadow-brand/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    )
}
