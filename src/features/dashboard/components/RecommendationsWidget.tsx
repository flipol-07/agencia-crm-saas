
import { getDashboardRecommendations } from '../services/dashboard.service'
import { Recommendation } from '../lib/recommendation-engine'
import Link from 'next/link'

import { AuraTrigger } from './AuraTrigger'

export async function RecommendationsWidget({ userId }: { userId: string }) {
    const recommendations = await getDashboardRecommendations(userId)

    return (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xs uppercase tracking-wider font-semibold text-text-muted flex items-center gap-2">
                    <span className="w-8 h-px bg-gradient-to-r from-yellow-500 to-transparent"></span>
                    Recomendaciones Inteligentes
                </h2>
                <AuraTrigger />
            </div>

            {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec) => (
                        <RecommendationCard key={rec.id} recommendation={rec} />
                    ))}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-400">No hay recomendaciones adicionales en este momento.</p>
                </div>
            )}
        </section>
    )
}


function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
    const { type, title, message, actionLabel, actionUrl } = recommendation

    const styleMap = {
        success: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', title: 'text-green-500' },
        warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', title: 'text-amber-500' },
        critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', title: 'text-red-500' },
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', title: 'text-blue-500' },
    }

    const styles = styleMap[type] || styleMap.info

    return (
        <div className={`rounded-xl p-5 border ${styles.bg} ${styles.border} flex flex-col gap-3 transition-transform hover:scale-[1.01]`}>
            <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-lg bg-black/20 ${styles.icon}`}>
                    {type === 'success' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                    {type === 'warning' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    )}
                    {type === 'critical' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {type === 'info' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                </div>
                <div>
                    <h3 className={`font-semibold ${styles.title}`}>{title}</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{message}</p>
                </div>
            </div>

            {actionLabel && actionUrl && (
                <div className="mt-auto pt-2 flex justify-end">
                    <Link
                        href={actionUrl}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors ${styles.title}`}
                    >
                        {actionLabel} →
                    </Link>
                </div>
            )}
        </div>
    )
}
