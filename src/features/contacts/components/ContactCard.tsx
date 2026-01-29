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
            <div className="glass rounded-xl p-5 hover:border-lime-400/30 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-lime-400 transition-colors">
                            {contact.company_name}
                        </h3>
                        {contact.contact_name && (
                            <p className="text-sm text-gray-400 truncate">{contact.contact_name}</p>
                        )}
                    </div>
                    <span className={`ml-2 w-3 h-3 rounded-full ${getStatusColor(contact.status)}`} title={contact.status} />
                </div>

                <div className="space-y-2 text-sm">
                    {contact.email && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{contact.email}</span>
                        </div>
                    )}
                    {contact.phone && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{contact.phone}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-500">{getSourceLabel(contact.source)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${stage.color}-400/20 text-${stage.color}-400`}>
                        {stage.label}
                    </span>
                </div>
            </div>
        </Link>
    )
}
