import { Card } from '@/shared/components/ui/Card'

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    color = 'blue'
}: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    color?: 'blue' | 'green' | 'red' | 'purple' | 'amber'
}) {
    const colorStyles = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        green: 'bg-brand/10 text-brand border-brand/20', // Using brand color for green
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        purple: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }

    return (
        <Card hoverEffect className="p-6 relative">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 p-16 opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500 ${colorStyles[color].split(' ')[0].replace('/10', '/30')}`} />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-text-muted mb-2">{title}</p>
                    <h3 className="text-3xl font-display font-bold text-text-primary tracking-tight">{value}</h3>
                    {subtitle && (
                        <p className="text-xs font-medium text-text-muted mt-2 flex items-center gap-1">
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
