export default function ContactDetailLoading() {
    return (
        <div className="space-y-6">
            <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-xl p-6 animate-pulse">
                        <div className="h-6 bg-white/10 rounded w-24 mb-4" />
                        <div className="space-y-3">
                            <div className="h-4 bg-white/10 rounded w-full" />
                            <div className="h-4 bg-white/10 rounded w-5/6" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
