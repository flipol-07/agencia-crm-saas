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
        green: 'bg-lime-500/10 text-lime-400 border-lime-500/20', // Changed green to lime for consistency
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }

    return (
        <div className="group relative bg-zinc-900/20 border border-white/5 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:bg-zinc-900/40 hover:border-white/10 hover:shadow-xl hover:shadow-black/20">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 p-16 opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500 ${colorStyles[color].split(' ')[0].replace('/10', '/30')}`} />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-zinc-100 tracking-tight">{value}</h3>
                    {subtitle && (
                        <p className="text-xs font-medium text-zinc-500 mt-2 flex items-center gap-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className={`p-3.5 rounded-xl border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
