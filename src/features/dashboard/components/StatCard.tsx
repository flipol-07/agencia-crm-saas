import { Card } from '@/shared/components/ui/Card'
import { InfoTooltip } from '@/shared/components/ui/Tooltip'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    color?: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'lime'
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    tooltip?: string
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    color = 'blue',
    trend,
    trendValue,
    tooltip
}: StatCardProps) {
    const colorStyles = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        green: 'bg-brand/10 text-brand border-brand/20',
        lime: 'bg-brand/10 text-brand border-brand/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        purple: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }

    const trendColors = {
        up: 'text-brand',
        down: 'text-red-400',
        neutral: 'text-text-muted'
    }

    const trendIcons = {
        up: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
        ),
        down: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
        ),
        neutral: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
        )
    }

    return (
        <Card hoverEffect className="p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 opacity-0 group-hover:opacity-20 rounded-full blur-2xl transition-opacity duration-500 ${colorStyles[color].split(' ')[0].replace('/10', '/50')}`} />

            <div className="relative flex items-start justify-between">
                <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2 flex items-center gap-1.5">
                        {title}
                        {tooltip && <InfoTooltip content={tooltip} position="right" />}
                    </div>

                    <h3 className="text-3xl font-display font-bold text-text-primary tracking-tight">{value}</h3>

                    {/* Trend indicator */}
                    {trend && trendValue && (
                        <div className={`flex items-center gap-1 mt-2 ${trendColors[trend]}`}>
                            {trendIcons[trend]}
                            <span className="text-xs font-medium">{trendValue}</span>
                        </div>
                    )}

                    {subtitle && !trend && (
                        <p className="text-xs font-medium text-text-muted mt-2 flex items-center gap-1">
                            {subtitle}
                        </p>
                    )}

                    {subtitle && trend && (
                        <p className="text-xs font-medium text-text-muted mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className={`p-3.5 rounded-xl border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
        </Card>
    )
}

