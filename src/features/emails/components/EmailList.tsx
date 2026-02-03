'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import type { ContactEmail } from '@/types/database'
import { cleanEmailBody } from '../utils/email-cleaner'
import { EmailEyeButton } from './EmailEyeButton'

interface EmailListProps {
    contactId: string
    contactEmail: string | null
    emails: ContactEmail[]
    onRefresh?: () => void
}

interface Conversation {
    id: string
    subject: string
    lastMessageAt: Date
    emails: ContactEmail[]
    participants: Set<string>
    snippet: string
}

export function EmailList({ contactId, contactEmail, emails, onRefresh }: EmailListProps) {
    const router = useRouter()
    const [showAll, setShowAll] = useState(false)
    const [readEmailIds, setReadEmailIds] = useState<Set<string>>(new Set())
    const supabase = createClient()

    // Fetch read statuses
    useEffect(() => {
        const fetchReadStatuses = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !emails.length) return

            // Map emails to message_id for the query
            const messageIds = emails.map(e => e.message_id).filter(Boolean) as string[]

            if (messageIds.length === 0) return

            const { data: reads } = await supabase
                .from('email_reads')
                .select('email_id')
                .eq('user_id', user.id)
                .in('email_id', messageIds)

            if (reads) {
                const readIds = (reads as any[]).map((r: any) => r.email_id as string);
                setReadEmailIds(new Set(readIds));
            }
        }

        fetchReadStatuses()
    }, [emails, supabase])

    // Group emails into conversations
    const conversations = useMemo(() => {
        const groups: Record<string, Conversation> = {}

        if (!emails) return []

        emails.forEach(email => {
            // Normalize subject: remove Re:, Fwd:, etc.
            const normalizedSubject = (email.subject || '(Sin asunto)')
                .replace(/^((re|fwd|rv|reenv.o|reenvio|aw|wg):\s*)+/i, '')
                .trim()

            if (!groups[normalizedSubject]) {
                groups[normalizedSubject] = {
                    id: email.id,
                    subject: normalizedSubject,
                    lastMessageAt: new Date(email.received_at || email.created_at),
                    emails: [],
                    participants: new Set(),
                    snippet: email.snippet || ''
                }
            }

            const group = groups[normalizedSubject]
            group.emails.push(email)
            group.participants.add(email.from_email || '')

            const emailDate = new Date(email.received_at || email.created_at)
            if (emailDate > group.lastMessageAt) {
                group.lastMessageAt = emailDate
                group.snippet = email.snippet || ''
                group.id = email.id // Keep ID of latest email for keying
            }
        })

        // Sort conversations by date (newest first)
        const sorted = Object.values(groups).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())

        // Sort emails inside conversations (oldest first for reading flow)
        sorted.forEach(group => {
            group.emails.sort((a, b) => {
                const dateA = new Date(a.received_at || a.created_at).getTime()
                const dateB = new Date(b.received_at || b.created_at).getTime()
                return dateA - dateB
            })
        })

        return sorted
    }, [emails])

    // Subscription for realtime updates
    useEffect(() => {
        if (!contactId) return

        const supabase = createClient()
        const channel = supabase
            .channel('contact_emails_change_listener')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'contact_emails',
                    filter: `contact_id=eq.${contactId}`,
                },
                () => {
                    router.refresh()
                    onRefresh?.()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [contactId, router, onRefresh])

    if (!contactEmail) {
        return (
            <div className="text-center py-6 text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                Añade un email al contacto para ver comunicaciones.
            </div>
        )
    }

    // Limit to 3 most recent conversations to avoid clutter unless 'showAll' is true
    const displayedConversations = showAll ? conversations : conversations.slice(0, 3)

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {conversations.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                        No hay correos registrados. Sincronización automática activa.
                    </p>
                ) : (
                    displayedConversations.map(conversation => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            readEmailIds={readEmailIds}
                            onReadToggle={(emailId, isRead) => {
                                const newSet = new Set(readEmailIds)
                                if (isRead) newSet.add(emailId)
                                else newSet.delete(emailId)
                                setReadEmailIds(newSet)
                            }}
                            contactId={contactId}
                        />
                    ))
                )}
            </div>

            {conversations.length > 3 && (
                <div className="text-center mt-4 pb-2">
                    <button
                        className="text-xs text-lime-400 hover:text-lime-300 transition-colors font-medium flex items-center gap-1 mx-auto bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                Ocultar historial
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                Ver {conversations.length - 3} conversaciones más antiguas
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

function ConversationItem({ conversation, readEmailIds, onReadToggle, contactId }: { conversation: Conversation, readEmailIds: Set<string>, onReadToggle: (id: string, state: boolean) => void, contactId: string }) {
    const [expanded, setExpanded] = useState(false)
    const latestEmail = conversation.emails[conversation.emails.length - 1]
    const count = conversation.emails.length

    // Check if the latest email is outbound to highlight "waiting for reply" context
    const isLatestOutbound = latestEmail.direction === 'outbound'

    return (
        <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${expanded ? 'border-lime-400/30 bg-white/5' : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}>
            {/* Cabecera del Hilo */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="p-3 cursor-pointer transition-colors"
            >
                <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                        {count > 1 && (
                            <span className="text-[10px] bg-white/10 text-white px-1.5 rounded-full border border-white/10">
                                {count} msgs
                            </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                            {latestEmail && formatDistanceToNow(new Date(latestEmail.received_at || latestEmail.created_at), { addSuffix: true, locale: es })}
                        </span>
                        {isLatestOutbound && (
                            <span className="text-[10px] text-lime-400 flex items-center gap-1 font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                Respondiste
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <h4 className={`text-sm font-semibold truncate flex-1 leading-snug ${expanded ? 'text-lime-400' : 'text-slate-200'}`}>
                        {conversation.subject || '(Sin asunto)'}
                    </h4>
                </div>

                {!expanded && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-light italic">
                        {latestEmail && cleanEmailBody(latestEmail.body_text || latestEmail.snippet || '')}
                    </p>
                )}
            </div>

            {/* Lista de Mensajes (Expandido) */}
            {expanded && (
                <div className="border-t border-white/5 bg-black/40">
                    <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {conversation.emails.map((email, index) => (
                            <EmailMessageItem
                                key={email.id}
                                email={email}
                                isLast={index === conversation.emails.length - 1}
                                isRead={readEmailIds.has(email.message_id || '')}
                                onReadToggle={onReadToggle}
                                contactId={contactId}
                            />
                        ))}
                    </div>

                    {/* Botón Responder (Global al hilo - responde al último) */}
                    <div className="px-4 py-3 border-t border-white/5 bg-white/5 flex justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                const targetEmail = latestEmail.direction === 'inbound' ? latestEmail.from_email : latestEmail.to_email
                                const subject = conversation.subject?.startsWith('Re:') ? conversation.subject : `Re: ${conversation.subject || ''}`

                                // Construct body context (quoting the latest message)
                                const body = `\n\n\n--------------------------------\nEl ${new Date(latestEmail.created_at).toLocaleDateString()} a las ${new Date(latestEmail.created_at).toLocaleTimeString()}, ${latestEmail.from_email} escribió:\n> ${latestEmail.body_text || latestEmail.snippet || ''}`.substring(0, 1500)

                                const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                window.open(mailtoUrl, '_blank')
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-lime-400 text-black text-xs font-bold rounded-lg hover:bg-lime-300 transition-all hover:scale-105 shadow-lg shadow-lime-400/20"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Responder Correo
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmailMessageItem({ email, isLast, isRead, onReadToggle, contactId }: { email: ContactEmail, isLast: boolean, isRead: boolean, onReadToggle: (id: string, s: boolean) => void, contactId: string }) {
    const [showFull, setShowFull] = useState(isLast)
    const [showOriginal, setShowOriginal] = useState(false)
    const isInbound = email.direction === 'inbound'

    const rawBody = email.body_text || email.snippet || ''
    const cleanedBody = useMemo(() => cleanEmailBody(rawBody), [rawBody])
    const isCleaned = cleanedBody.length < rawBody.length - 20 // Significant cleaning occurred

    return (
        <div className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-md transition-all ${isInbound
                ? 'bg-slate-800/80 border border-white/10 rounded-tl-none text-slate-100'
                : 'bg-lime-400 text-black rounded-tr-none font-medium'
                }`}>

                <div className={`flex items-center gap-2 mb-2 ${isInbound ? 'opacity-50' : 'opacity-70'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isInbound ? (email.from_email || 'Cliente').split('<')[0].split('@')[0] : 'Tú'}
                    </span>
                    <span className="text-[10px] font-medium">
                        {formatDistanceToNow(new Date(email.received_at || email.created_at), { addSuffix: true, locale: es })}
                    </span>

                    {/* Add Eye Button here for inbound emails */}
                    {isInbound && (
                        <div className="ml-auto">
                            <EmailEyeButton
                                emailId={email.message_id || ''}
                                isRead={isRead}
                                contactId={contactId}
                                onToggle={(newState) => onReadToggle(email.message_id || '', newState)}
                            />
                        </div>
                    )}
                </div>

                <div onClick={() => setShowFull(!showFull)} className="cursor-pointer">
                    {showFull ? (
                        <div className="space-y-4">
                            <div className={`text-[13px] leading-relaxed whitespace-pre-wrap break-words ${isInbound ? 'text-slate-200' : 'text-slate-900 font-medium'}`}>
                                {showOriginal ? rawBody : cleanedBody}
                            </div>

                            {isCleaned && !showOriginal && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowOriginal(true)
                                    }}
                                    className={`text-[10px] uppercase font-bold tracking-tighter mt-4 flex items-center gap-1 ${isInbound ? 'text-slate-500 hover:text-slate-300' : 'text-black/60 hover:text-black/90'}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Ver mensaje original completo
                                </button>
                            )}

                            {showOriginal && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowOriginal(false)
                                    }}
                                    className={`text-[10px] uppercase font-bold tracking-tighter mt-4 flex items-center gap-1 ${isInbound ? 'text-slate-500 hover:text-slate-300' : 'text-black/60 hover:text-black/90'}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Ocultar original
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className={`text-xs line-clamp-2 italic ${isInbound ? 'text-slate-400' : 'text-black/70'}`}>
                            {cleanedBody || email.snippet}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
