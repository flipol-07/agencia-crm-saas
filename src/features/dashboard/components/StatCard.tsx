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
        blue: 'bg-blue-500/10 text-blue-400',
        green: 'bg-lime-500/10 text-lime-400',
        red: 'bg-red-500/10 text-red-400',
        purple: 'bg-purple-500/10 text-purple-400',
        amber: 'bg-amber-500/10 text-amber-400',
    }

    return (
        <div className="glass p-6 rounded-xl border border-white/5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-white">{value}</h3>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
