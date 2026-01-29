'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { syncContactEmails } from '@/features/emails/actions/sync'
import type { ContactEmail } from '@/types/database'

interface EmailListProps {
    contactId: string
    contactEmail: string | null
    emails: ContactEmail[]
    onRefresh?: () => void
}

export function EmailList({ contactId, contactEmail, emails, onRefresh }: EmailListProps) {
    const [loading, setLoading] = useState(false)

    const handleSync = async () => {
        if (!contactEmail) return
        setLoading(true)
        try {
            await syncContactEmails(contactId, contactEmail)
            onRefresh?.()
        } catch (error) {
            console.error(error)
            alert('Error al sincronizar correos')
        } finally {
            setLoading(false)
        }
    }

    if (!contactEmail) {
        return (
            <div className="text-center py-6 text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                Añade un email al contacto para ver comunicaciones.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Correos Recientes</h3>
                <button
                    onClick={handleSync}
                    disabled={loading}
                    className="text-xs bg-lime-400/10 text-lime-400 border border-lime-400/20 px-3 py-1.5 rounded-md hover:bg-lime-400/20 transition-all flex items-center gap-1"
                >
                    {loading ? (
                        <span className="animate-spin">↻</span>
                    ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                    {loading ? 'Sincronizando...' : 'Sincronizar'}
                </button>
            </div>

            <div className="space-y-3">
                {emails.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                        No hay correos registrados. Pulsa sincronizar para buscar en el servidor.
                    </p>
                ) : (
                    emails.map(email => (
                        <EmailItem key={email.id} email={email} />
                    ))
                )}
            </div>
        </div>
    )
}

function EmailItem({ email }: { email: ContactEmail }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className={`rounded-lg border transition-all duration-200 overflow-hidden ${email.direction === 'inbound'
            ? 'bg-white/5 border-white/10'
            : 'bg-lime-400/5 border-lime-400/10 ml-4'
            }`}>
            {/* Cabecera Clickable */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${email.direction === 'inbound'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-lime-500/20 text-lime-400'
                            }`}>
                            {email.direction === 'inbound' ? 'Recibido' : 'Enviado'}
                        </span>
                        <span className="text-xs text-gray-400">
                            {email.received_at && formatDistanceToNow(new Date(email.received_at), { addSuffix: true, locale: es })}
                        </span>
                    </div>
                    {/* Icono Chevron */}
                    <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <h4 className="text-sm font-medium text-white truncate flex-1 leading-snug">
                        {email.subject || '(Sin asunto)'}
                    </h4>
                </div>

                {!expanded && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-light">
                        {email.snippet}
                    </p>
                )}
            </div>

            {/* Contenido Expandido */}
            {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-black/20">
                    <div className="mb-4 text-xs text-gray-400 space-y-1 mt-2">
                        <p><span className="text-gray-500">De:</span> {email.from_email}</p>
                        <p><span className="text-gray-500">Para:</span> {email.to_email}</p>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 text-xs overflow-x-auto bg-white/5 p-3 rounded-lg border border-white/5">
                        {email.body_html ? (
                            <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
                        ) : (
                            <pre className="whitespace-pre-wrap font-sans">{email.body_text || email.snippet}</pre>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                const isInbound = email.direction === 'inbound'
                                const targetEmail = isInbound ? email.from_email : email.to_email
                                const subject = email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`
                                const body = `\n\n\n--------------------------------\nEl ${new Date(email.created_at).toLocaleDateString()} a las ${new Date(email.created_at).toLocaleTimeString()}, ${email.from_email} escribió:\n> ${email.body_text || email.snippet || ''}`.substring(0, 1500) // Limitamos longitud para evitar errores de URL

                                const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                window.open(mailtoUrl, '_blank')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-400 text-black text-xs font-medium rounded hover:bg-lime-300 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Responder
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

