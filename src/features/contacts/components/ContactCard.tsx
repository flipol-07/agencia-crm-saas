'use client'

import Link from 'next/link'
import type { Contact } from '@/types/database'
import { PIPELINE_STAGES } from '@/types/database'

interface ContactCardProps {
    contact: Contact
}

export function ContactCard({ contact }: ContactCardProps) {
    const stage = PIPELINE_STAGES.find(s => s.id === contact.pipeline_stage) || PIPELINE_STAGES[0]

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            prospect: 'bg-gray-500',
            qualified: 'bg-blue-500',
            proposal: 'bg-purple-500',
            won: 'bg-lime-500',
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
            <div className="group h-full bg-zinc-900/20 border border-white/5 rounded-2xl p-5 hover:bg-zinc-900/40 hover:border-lime-400/20 hover:shadow-lg hover:shadow-lime-400/5 transition-all duration-300 relative overflow-hidden">
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(contact.status).replace('bg-', 'bg-gradient-to-r from-transparent via-').replace('500', '400 to-transparent opacity-50')}`} />

                <div className="flex items-start justify-between mb-4 mt-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-zinc-100 truncate group-hover:text-lime-400 transition-colors tracking-tight">
                            {contact.company_name}
                        </h3>
                        {contact.contact_name && (
                            <p className="text-sm text-zinc-500 truncate mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                                {contact.contact_name}
                            </p>
                        )}
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(contact.status)} shadow-[0_0_8px_currentColor] opacity-80`} title={contact.status} />
                </div>

                <div className="space-y-2.5 text-sm mb-5">
                    {contact.email && (
                        <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            <div className="p-1.5 rounded-md bg-white/5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="truncate opacity-80">{contact.email}</span>
                        </div>
                    )}
                    {contact.phone && (
                        <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            <div className="p-1.5 rounded-md bg-white/5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <span className="opacity-80">{contact.phone}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 bg-zinc-950/30 px-2 py-1 rounded border border-white/5">
                        {getSourceLabel(contact.source)}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full bg-${stage.color}-500/10 text-${stage.color}-400 border border-${stage.color}-500/20 font-medium`}>
                        {stage.label}
                    </span>
                </div>
            </div>
        </Link>
    )
}
