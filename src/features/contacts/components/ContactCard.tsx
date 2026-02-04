'use client'

import Link from 'next/link'
import type { Contact } from '@/types/database'
import { PIPELINE_STAGES } from '@/types/database'
import { useNotificationStore } from '@/shared/store/useNotificationStore'

interface ContactCardProps {
    contact: Contact
}

export function ContactCard({ contact }: ContactCardProps) {
    const { unreadCounts } = useNotificationStore()
    const unreadCount = unreadCounts[contact.id] || 0
    const stage = PIPELINE_STAGES.find(s => s.id === contact.pipeline_stage) || PIPELINE_STAGES[0]

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            prospect: 'bg-gray-500',
            qualified: 'bg-blue-500',
            proposal: 'bg-purple-500',
            won: 'bg-[#8b5cf6]',
            active: 'bg-green-500',
            maintenance: 'bg-cyan-500',
            lost: 'bg-red-500',
        }
        return colors[status] || 'bg-gray-500'
    }

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            inbound_whatsapp: '📱 Mensajería',
            inbound_email: '📧 Email',
            outbound: '📤 Outbound',
            referral: '🤝 Referido',
            website: '🌐 Web',
            other: '📌 Otro',
        }
        return labels[source] || source
    }

    return (
        <Link href={`/contacts/${contact.id}`}>
            <div className="group h-full bg-[#0a0a0a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:bg-[#0a0a0a]/80 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-500 relative overflow-hidden">
                {/* Ambient Purple Glow on Hover */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] group-hover:bg-purple-600/20 transition-all duration-700 pointer-events-none" />

                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(contact.status).replace('bg-', 'bg-gradient-to-b from-').replace('500', '400 to-transparent')}`} />

                <div className="flex items-start justify-between mb-4 mt-1 relative z-10">
                    <div className="flex-1 min-w-0 pl-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-display font-bold text-white truncate group-hover:text-brand-neon-lime transition-colors">
                                {contact.company_name}
                            </h3>
                            {unreadCount > 0 && (
                                <span className="flex-shrink-0 bg-brand-neon-lime text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {contact.contact_name && (
                            <p className="text-sm text-gray-400 truncate mt-1 flex items-center gap-2 font-medium">
                                {contact.contact_name}
                            </p>
                        )}
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border bg-white/5 border-white/10 text-gray-400 group-hover:border-purple-500/30 group-hover:text-purple-400 transition-colors`}>
                        {stage.label}
                    </span>
                </div>

                <div className="space-y-3 text-sm mb-6 pl-3 relative z-10">
                    {contact.email && (
                        <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-300 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-purple-500/20 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="truncate flex-1 font-medium">{contact.email}</span>
                        </div>
                    )}
                    {contact.phone && (
                        <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-300 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-purple-500/20 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <span className="flex-1 font-medium">{contact.phone}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 px-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                            {getSourceLabel(contact.source)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Probability Score - Purple/Lime Gradient */}
                        {typeof contact.probability_close === 'number' && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                <span className={`w-1.5 h-1.5 rounded-full ${contact.probability_close >= 70 ? 'bg-brand-neon-lime shadow-[0_0_8px_#8b5cf6]' : 'bg-purple-500 shadow-[0_0_8px_#8b5cf6]'
                                    }`}></span>
                                <span className="text-xs font-bold text-white">{contact.probability_close}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
