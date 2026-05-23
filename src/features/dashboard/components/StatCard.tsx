import { ReactNode } from 'react'
import { Tooltip } from '@/shared/components/ui/Tooltip'

interface StatCardProps {
    title: string
    value: string
    subtitle?: string
    icon?: ReactNode
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    color?: 'brand' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'lime'
    tooltip?: string
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    color = 'brand',
    tooltip
}: StatCardProps) {

    const getColorClasses = (c: string) => {
        switch (c) {
            case 'purple': return 'text-purple-300 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(192,132,252,0.2)]'
            case 'blue': return 'text-blue-300 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.2)]'
            case 'green': return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]'
            case 'red': return 'text-red-300 bg-red-500/10 border-red-500/20 group-hover:border-red-500/50 group-hover:shadow-[0_0_20px_rgba(248,113,113,0.2)]'
            case 'yellow': return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20 group-hover:border-yellow-500/50 group-hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]'
            case 'lime': return 'text-violet-300 bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/50 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]'
            default: return 'text-brand-neon-blue bg-brand-neon-blue/10 border-brand-neon-blue/20 group-hover:border-brand-neon-blue/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]'
        }
    }

    const colorClass = getColorClasses(color)

    const cardContent = (
        <div className={`group relative p-4 sm:p-6 rounded-2xl border transition-all duration-300 glass-card hover:-translate-y-1 ${colorClass.split(' ').filter(c => c.includes('hover')).join(' ')} border-white/5`}>
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/5 to-transparent`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${colorClass.split(' ').filter(c => !c.includes('hover')).join(' ')}`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[var(--ink-400)]'
                            } px-2 py-1 rounded-full bg-[var(--bg-3)] border border-[var(--divider)] backdrop-blur-sm`}>
                            {trend === 'up' ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            ) : trend === 'down' ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            ) : (
                                <span className="w-2 h-0.5 bg-current rounded-full" />
                            )}
                            {trendValue}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[var(--ink-400)] text-xs font-bold tracking-widest uppercase">{title}</h3>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl sm:text-3xl font-bold text-[var(--ink-700)] font-display tracking-tight">{value}</p>
                    </div>

                    {subtitle && (
                        <p className="text-xs text-[var(--ink-450)] mt-2 font-medium bg-[var(--bg-3)] inline-block px-2 py-0.5 rounded-md border border-[var(--divider)]">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )

    if (tooltip) {
        return (
            <Tooltip content={tooltip} position="bottom">
                {cardContent}
            </Tooltip>
        )
    }

    return cardContent
}
