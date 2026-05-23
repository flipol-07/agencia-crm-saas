'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ContactEmail } from '@/types/database'
import { cleanEmailBody } from '../utils/email-cleaner'

interface Conversation {
    id: string
    subject: string
    lastMessageAt: Date
    snippet: string
    emails: ContactEmail[]
    participants: Set<string>
}

interface MailThreadListProps {
    threads: Conversation[]
    selectedThreadId: string | null
    onThreadSelect: (id: string) => void
    folder: 'inbound' | 'outbound'
    onToggleRead: (emailId: string, currentStatus: boolean) => void
}

export function MailThreadList({ threads, selectedThreadId, onThreadSelect, folder, onToggleRead }: MailThreadListProps) {
    if (threads.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-[var(--ink-300)] text-sm p-4 text-center border-r border-[var(--divider)]">
                No hay correos en {folder === 'inbound' ? 'la bandeja de entrada' : 'enviados'}
            </div>
        )
    }

    return (
        <div className="h-full min-h-0 border-r border-[var(--divider)] bg-[var(--bg)] overflow-y-auto overscroll-contain">
            {threads.map(thread => {
                const isSelected = selectedThreadId === thread.id
                // Assuming the last email dictates the read status for the thread in the list view logic
                // Or checking if ANY unread exists. For simplicity, let's look at the last inbound email.
                const lastEmail = thread.emails[thread.emails.length - 1]
                const isUnread = !lastEmail.is_read && lastEmail.direction === 'inbound'

                return (
                    <div
                        key={thread.id}
                        onClick={() => onThreadSelect(thread.id)}
                        className={`p-4 border-b border-[var(--divider-2)] cursor-pointer hover:bg-[var(--bg-3)] transition-colors group relative ${isSelected ? 'bg-[var(--bg-3)] border-l-2 border-l-[var(--accent)]' : isUnread ? 'bg-[var(--accent-tint)]' : ''
                            }`}
                    >
                        {isUnread && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleRead(lastEmail.id, lastEmail.is_read || false)
                                }}
                                className="absolute right-2 top-2 p-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-3)] rounded-full"
                                title="Marcar como leído"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-semibold truncate max-w-[70%] ${isUnread ? 'text-[var(--ink-700)]' : 'text-[var(--ink-500)]'}`}>
                                {folder === 'inbound'
                                    ? Array.from(thread.participants).join(', ')
                                    : (thread.emails[0].to_email || 'Sin destinatario')}
                            </span>
                            <span className="text-xs text-[var(--ink-300)] whitespace-nowrap ml-2">
                                {formatDistanceToNow(thread.lastMessageAt, { addSuffix: false, locale: es })}
                            </span>
                        </div>

                        <h4 className={`text-sm mb-1 truncate ${isUnread ? 'font-bold text-[var(--ink-700)]' : 'font-medium text-[var(--ink-450)]'}`}>
                            {thread.subject}
                        </h4>

                        <p className="text-xs text-[var(--ink-300)] line-clamp-2">
                            {cleanEmailBody(thread.snippet)}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
