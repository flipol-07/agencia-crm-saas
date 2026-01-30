import { Skeleton } from '@/shared/components/ui/Skeleton'

export default function DashboardLoading() {
    return (
        <div className="space-y-8 pb-10">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <div className="flex flex-col sm:items-end gap-3">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            {/* KPIs Grid Skeleton */}
            <section>
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                                <Skeleton className="h-12 w-12 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Analytics Grid Skeleton */}
            <section>
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="h-80 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </section>

            {/* Action Center Skeleton */}
            <section>
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-[400px] bg-white/5 border border-white/10 rounded-2xl p-6">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="h-[400px] bg-white/5 border border-white/10 rounded-2xl p-6">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="h-[400px] bg-white/5 border border-white/10 rounded-2xl p-6">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </section>
        </div>
    )
}
