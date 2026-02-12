'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ContactEmail } from '@/types/database'
import { cleanEmailBody } from '../utils/email-cleaner'
import { toast } from 'sonner'

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

        const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoUrl, '_blank')
        toast.info('Abriendo cliente de correo predeterminado...')
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-black/40 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/10">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                        title="Volver a la lista"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-lg md:text-xl font-bold text-white flex-1 truncate">{conversation.subject}</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReply}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-brand text-black font-bold rounded-lg hover:bg-brand/90 transition-all flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span className="hidden sm:inline">Responder</span>
                            <span className="sm:hidden text-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 overflow-hidden">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-white flex-shrink-0">
                        {conversation.emails.length} mensajes
                    </span>
                    <span>•</span>
                    <span className="truncate">Participantes: {Array.from(conversation.participants).join(', ')}</span>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {conversation.emails.map((email, index) => (
                    <MailMessageItem
                        key={email.id}
                        email={email}
                        isLast={index === conversation.emails.length - 1}
                    />
                ))}
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

    return (
        <div className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
            <div className="flex items-center gap-2 mb-2 px-1">
                <span className="font-bold text-sm text-white">
                    {isInbound ? (email.from_email || 'Desconocido').split('<')[0] : 'Tú'}
                </span>
                <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(email.received_at || email.created_at), { addSuffix: true, locale: es })}
                </span>
            </div>

            <div className={`max-w-[85%] rounded-2xl p-5 shadow-lg border ${isInbound
                ? 'bg-slate-800/50 border-white/5 rounded-tl-none text-slate-100'
                : 'bg-brand/10 border-brand/20 text-white rounded-tr-none'
                }`}>

                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {showOriginal ? rawBody : cleanedBody}
                </div>

                {isCleaned && !showOriginal && (
                    <button
                        onClick={() => setShowOriginal(true)}
                        className="text-[10px] uppercase font-bold tracking-tighter mt-4 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ver original
                    </button>
                )}
                {showOriginal && (
                    <button
                        onClick={() => setShowOriginal(false)}
                        className="text-[10px] uppercase font-bold tracking-tighter mt-4 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        Ocultar original
                    </button>
                )}
            </div>
        </div>
    )
}
