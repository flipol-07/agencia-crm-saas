'use client'

import Link from 'next/link'
import { useContacts } from '@/features/contacts/hooks'
import { PIPELINE_STAGES } from '@/types/database'
import type { Contact } from '@/types/database'

function PipelineCard({ contact }: { contact: Contact }) {
    const getSourceIcon = (source: string) => {
        const icons: Record<string, string> = {
            inbound_whatsapp: '📱',
            inbound_email: '📧',
            outbound: '📤',
            referral: '🤝',
            website: '🌐',
            other: '📌',
        }
        return icons[source] || '📌'
    }

    return (
        <Link href={`/contacts/${contact.id}`}>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-lime-400/30 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white group-hover:text-lime-400 transition-colors truncate">
                        {contact.company_name}
                    </h4>
                    <span className="text-xs ml-2">{getSourceIcon(contact.source)}</span>
                </div>

                {contact.contact_name && (
                    <p className="text-sm text-gray-400 truncate mb-2">{contact.contact_name}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {contact.phone && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            WA
                        </span>
                    )}
                    {contact.email && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

function PipelineColumn({
    stage,
    contacts,
    color
}: {
    stage: string
    contacts: Contact[]
    color: string
}) {
    const colorClasses: Record<string, string> = {
        gray: 'border-gray-500/30 bg-gray-500/5',
        blue: 'border-blue-500/30 bg-blue-500/5',
        purple: 'border-purple-500/30 bg-purple-500/5',
        amber: 'border-amber-500/30 bg-amber-500/5',
        lime: 'border-lime-500/30 bg-lime-500/5',
        red: 'border-red-500/30 bg-red-500/5',
    }

    const headerColors: Record<string, string> = {
        gray: 'text-gray-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        amber: 'text-amber-400',
        lime: 'text-lime-400',
        red: 'text-red-400',
    }

    return (
        <div className={`flex flex-col min-w-[280px] max-w-[320px] border rounded-xl ${colorClasses[color]}`}>
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${headerColors[color]}`}>{stage}</h3>
                    <span className="text-sm text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
                        {contacts.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                {contacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Sin contactos
                    </div>
                ) : (
                    contacts.map(contact => (
                        <PipelineCard key={contact.id} contact={contact} />
                    ))
                )}
            </div>
        </div>
    )
}

export function PipelineKanban() {
    const { contacts, loading } = useContacts()

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {PIPELINE_STAGES.map(stage => (
                    <div key={stage.id} className="flex flex-col min-w-[280px] max-w-[320px] border border-white/10 rounded-xl animate-pulse">
                        <div className="p-4 border-b border-white/10">
                            <div className="h-5 bg-white/10 rounded w-24" />
                        </div>
                        <div className="p-3 space-y-3">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="bg-white/5 rounded-lg p-4">
                                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-white/10 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Agrupar contactos por pipeline_stage
    const contactsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage.id] = contacts.filter(c => c.pipeline_stage === stage.id)
        return acc
    }, {} as Record<string, Contact[]>)

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map(stage => (
                <PipelineColumn
                    key={stage.id}
                    stage={stage.label}
                    contacts={contactsByStage[stage.id] || []}
                    color={stage.color}
                />
            ))}
        </div>
    )
}
