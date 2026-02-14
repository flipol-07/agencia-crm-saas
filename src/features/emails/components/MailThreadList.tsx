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
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-4 text-center border-r border-white/10">
                No hay correos en {folder === 'inbound' ? 'la bandeja de entrada' : 'enviaos'}
            </div>
        )
    }

    return (
        <div className="h-full min-h-0 border-r border-white/10 bg-black/10 overflow-y-auto overscroll-contain">
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
                        className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group relative ${isSelected ? 'bg-white/10 border-l-2 border-l-brand' : isUnread ? 'bg-white/[0.02]' : ''
                            }`}
                    >
                        {isUnread && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleRead(lastEmail.id, lastEmail.is_read || false)
                                }}
                                className="absolute right-2 top-2 p-1 text-brand opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full"
                                title="Marcar como leído"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-semibold truncate max-w-[70%] ${isUnread ? 'text-white' : 'text-gray-300'}`}>
                                {folder === 'inbound'
                                    ? Array.from(thread.participants).join(', ')
                                    : (thread.emails[0].to_email || 'Sin destinatario')}
                            </span>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {formatDistanceToNow(thread.lastMessageAt, { addSuffix: false, locale: es })}
                            </span>
                        </div>

                        <h4 className={`text-sm mb-1 truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-gray-400'}`}>
                            {thread.subject}
                        </h4>

                        <p className="text-xs text-gray-500 line-clamp-2">
                            {cleanEmailBody(thread.snippet)}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
