'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ContactEmail } from '@/types/database'
import { cleanEmailBody } from '../utils/email-cleaner'
import { Check, Inbox, MailOpen, Send } from 'lucide-react'

interface Conversation {
    id: string
    subject: string
    lastMessageAt: Date
    snippet: string
    emails: ContactEmail[]
    participants: Set<string>
    isUnread: boolean
}

interface MailThreadListProps {
    threads: Conversation[]
    selectedThreadId: string | null
    onThreadSelect: (id: string) => void
    folder: 'inbound' | 'outbound'
    onToggleRead: (emailId: string, currentStatus: boolean) => void
}

export function MailThreadList({ threads, selectedThreadId, onThreadSelect, folder, onToggleRead }: MailThreadListProps) {
    const folderLabel = folder === 'inbound' ? 'Bandeja de entrada' : 'Enviados'
    const folderIcon = folder === 'inbound'
        ? <Inbox className="h-5 w-5 text-[var(--ochre)]" />
        : <Send className="h-5 w-5 text-[var(--ochre)]" />

    if (threads.length === 0) {
        return (
            <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg)]">
                <div className="border-b border-[var(--divider)] bg-[var(--bg)]/90 backdrop-blur">
                    <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4 md:px-6">
                        {folderIcon}
                        <div>
                            <p className="text-sm font-semibold text-[var(--ink-700)]">{folderLabel}</p>
                            <p className="text-xs text-[var(--ink-300)]">Sin conversaciones por mostrar</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[var(--ink-300)]">
                    No hay correos en {folder === 'inbound' ? 'la bandeja de entrada' : 'enviados'}.
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
            <div className="border-b border-[var(--divider)] bg-[var(--bg)]/90 backdrop-blur">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                        {folderIcon}
                        <div>
                            <p className="text-sm font-semibold text-[var(--ink-700)]">{folderLabel}</p>
                            <p className="text-xs text-[var(--ink-300)]">{threads.length} conversaciones</p>
                        </div>
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-[var(--divider-strong)] bg-[var(--bg-2)] px-3 py-1 text-xs text-[var(--ink-400)] md:flex">
                        <MailOpen className="h-3.5 w-3.5 text-[var(--ochre)]" />
                        Vista enfocada
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-3 py-3 md:px-4 md:py-4">
                    {threads.map(thread => {
                        const isSelected = selectedThreadId === thread.id
                        const lastEmail = thread.emails[thread.emails.length - 1]
                        const counterpart = folder === 'inbound'
                            ? lastEmail.from_email || 'Remitente desconocido'
                            : lastEmail.to_email || 'Sin destinatario'

                        return (
                            <article
                                key={thread.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onThreadSelect(thread.id)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        onThreadSelect(thread.id)
                                    }
                                }}
                                className={`group relative w-full rounded-2xl border px-4 py-4 text-left transition-all ${isSelected
                                    ? 'border-[var(--ochre)] bg-[var(--ochre-soft)] shadow-[0_14px_30px_rgba(0,0,0,0.18)]'
                                    : thread.isUnread
                                        ? 'border-[var(--divider-strong)] bg-[var(--bg-2)] hover:border-[var(--ochre)] hover:bg-[var(--bg-3)]'
                                        : 'border-[var(--divider)] bg-[var(--bg)] hover:border-[var(--divider-strong)] hover:bg-[var(--bg-2)]'
                                    }`}
                            >
                                {thread.isUnread && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            onToggleRead(lastEmail.id, lastEmail.is_read || false)
                                        }}
                                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--divider-strong)] bg-[var(--bg)] text-[var(--ochre)] opacity-0 transition-opacity hover:bg-[var(--bg-2)] group-hover:opacity-100"
                                        title="Marcar como leído"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                )}

                                <div className="mb-2 flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            {thread.isUnread && <span className="h-2.5 w-2.5 rounded-full bg-[var(--ochre)]" />}
                                            <span className={`block truncate text-sm ${thread.isUnread ? 'font-semibold text-[var(--ink-700)]' : 'font-medium text-[var(--ink-500)]'}`}>
                                                {counterpart}
                                            </span>
                                        </div>
                                        <h4 className={`mt-1 truncate text-sm ${thread.isUnread ? 'font-semibold text-[var(--ink-700)]' : 'font-medium text-[var(--ink-450)]'}`}>
                                            {thread.subject}
                                        </h4>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <span className="whitespace-nowrap text-xs text-[var(--ink-300)]">
                                            {formatDistanceToNow(thread.lastMessageAt, { addSuffix: false, locale: es })}
                                        </span>
                                        {thread.emails.length > 1 && (
                                            <span className="rounded-full border border-[var(--divider-strong)] px-2 py-0.5 text-[11px] text-[var(--ink-400)]">
                                                {thread.emails.length}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="line-clamp-2 text-sm text-[var(--ink-300)]">
                                    {cleanEmailBody(thread.snippet)}
                                </p>
                            </article>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
