'use client'

import { useState, useMemo } from 'react'
import { ContactEmail } from '@/types/database'
import { cleanEmailBody } from '../utils/email-cleaner'
import { ArrowLeft, Eye, EyeOff, Reply, Users } from 'lucide-react'

interface Conversation {
    id: string
    subject: string
    emails: ContactEmail[]
    participants: Set<string>
}

interface MailViewProps {
    conversation: Conversation
    onReply: (to: string, subject: string, context: string) => void
    onBack: () => void
}

export function MailView({ conversation, onReply, onBack }: MailViewProps) {
    const latestEmail = conversation.emails[conversation.emails.length - 1]

    const handleReply = () => {
        const targetEmail = latestEmail.direction === 'inbound' ? latestEmail.from_email : latestEmail.to_email
        const subject = conversation.subject?.startsWith('Re:') ? conversation.subject : `Re: ${conversation.subject || ''}`

        // Construct body context
        const body = `\n\n\n--------------------------------\nEl ${new Date(latestEmail.created_at).toLocaleDateString()} a las ${new Date(latestEmail.created_at).toLocaleTimeString()}, ${latestEmail.from_email} escribió:\n> ${latestEmail.body_text || latestEmail.snippet || ''}`.substring(0, 1500)

        onReply(targetEmail || '', subject, body)
    }

    return (
        <div className="flex h-full flex-1 flex-col bg-[var(--bg-2)] animate-in slide-in-from-right duration-300">
            <div className="border-b border-[var(--divider)] bg-[var(--bg-2)]/95 backdrop-blur">
                <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-5">
                    <div className="mb-4 flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--divider-strong)] bg-[var(--bg)] text-[var(--ink-500)] transition-colors hover:text-[var(--ink-700)]"
                            title="Volver a la lista"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase text-[var(--ink-300)]">Conversacion</p>
                            <h2 className="truncate text-lg font-semibold text-[var(--ink-700)] md:text-xl">{conversation.subject}</h2>
                        </div>
                        <button
                            onClick={handleReply}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,91,255,0.24)] transition-all hover:brightness-110"
                        >
                            <Reply className="h-4 w-4" />
                            <span className="hidden sm:inline">Responder</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ink-400)]">
                        <span className="rounded-full border border-[var(--divider-strong)] bg-[var(--bg)] px-2.5 py-1 text-[var(--ink-600)]">
                            {conversation.emails.length} mensajes
                        </span>
                        <span className="hidden sm:inline text-[var(--ink-300)]">•</span>
                        <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[var(--divider)] bg-[var(--bg)] px-2.5 py-1">
                            <Users className="h-3.5 w-3.5 flex-shrink-0 text-[var(--ochre)]" />
                            <span className="truncate">{Array.from(conversation.participants).join(', ')}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
                    {conversation.emails.map((email, index) => (
                        <MailMessageItem
                            key={email.id}
                            email={email}
                            isLast={index === conversation.emails.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function MailMessageItem({ email, isLast }: { email: ContactEmail, isLast: boolean }) {
    const [showOriginal, setShowOriginal] = useState(false)
    const isInbound = email.direction === 'inbound'

    const rawBody = email.body_text || email.snippet || ''
    const cleanedBody = useMemo(() => cleanEmailBody(rawBody), [rawBody])
    const isCleaned = cleanedBody.length < rawBody.length - 20
    const senderLabel = isInbound ? (email.from_email || 'Desconocido') : 'Tú'
    const recipientLabel = isInbound ? (email.to_email || 'Buzón conectado') : (email.to_email || 'Sin destinatario')
    const timestamp = new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(email.received_at || email.created_at))

    return (
        <div className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
            <article className={`w-full max-w-4xl overflow-hidden rounded-3xl border shadow-[0_18px_40px_rgba(0,0,0,0.16)] ${isInbound
                ? 'border-[var(--divider)] bg-[var(--bg-3)] text-[var(--ink-600)]'
                : 'border-[var(--divider-strong)] bg-[var(--ochre-soft)] text-[var(--ink-700)]'
                }`}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 px-4 py-3 md:px-5">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--ink-700)]">{senderLabel}</p>
                        <p className="truncate text-xs text-[var(--ink-400)]">Para {recipientLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isLast && (
                            <span className="rounded-full border border-[var(--divider-strong)] bg-[var(--bg)] px-2.5 py-1 text-[11px] text-[var(--ink-400)]">
                                Ultimo
                            </span>
                        )}
                        <span className="text-xs text-[var(--ink-400)]">{timestamp}</span>
                    </div>
                </div>

                <div className="px-4 py-4 md:px-5 md:py-5">
                    <div className="whitespace-pre-wrap break-words text-sm leading-7">
                        {showOriginal ? rawBody : cleanedBody}
                    </div>

                    {isCleaned && (
                        <button
                            onClick={() => setShowOriginal(prev => !prev)}
                            className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[var(--ink-400)] transition-colors hover:text-[var(--ink-700)]"
                        >
                            {showOriginal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {showOriginal ? 'Ocultar original' : 'Ver original'}
                        </button>
                    )}
                </div>
            </article>
        </div>
    )
}
