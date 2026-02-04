import Link from 'next/link'
import type { Contact } from '@/types/database'
import { getRecentLeads } from '../services/dashboard.service'
import { RecentLeadItem } from './RecentLeadItem'

export async function RecentLeads({ userId }: { userId: string }) {
    const leads = await getRecentLeads(userId) as Contact[]

    return (
        <div className="glass-card p-6 h-full flex flex-col rounded-2xl border border-white/5 relative overflow-hidden group">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-neon-lime/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon-lime opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-neon-lime"></span>
                    </span>
                    Leads Recientes
                </h3>
                <Link href="/contacts" className="text-xs font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                    Ver todos
                </Link>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <p className="text-white font-medium">No hay actividad reciente.</p>
                        <p className="text-gray-500 text-sm mt-1">Tus nuevos leads aparecerán aquí.</p>
                    </div>
                ) : (
                    leads.map(lead => (
                        <RecentLeadItem key={lead.id} lead={lead} />
                    ))
                )}
            </div>
        </div>
    )
}
