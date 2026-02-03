'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ContactEmail } from '@/types/database'
import { MailSidebar } from './MailSidebar'
import { MailThreadList } from './MailThreadList'
import { MailView } from './MailView'
import { ComposeEmailModal } from './ComposeEmailModal'
import { markEmailAsRead, markEmailAsUnread } from '../actions/read-status'

interface MailDashboardProps {
    initialEmails: ContactEmail[]
}

export function MailDashboard({ initialEmails }: MailDashboardProps) {
    const [emails, setEmails] = useState<ContactEmail[]>(initialEmails)
    const [selectedFolder, setSelectedFolder] = useState<'inbound' | 'outbound'>('inbound')
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
    const supabase = createClient()

    // Compose State
    const [isComposeOpen, setIsComposeOpen] = useState(false)
    const [composeTo, setComposeTo] = useState('')
    const [composeSubject, setComposeSubject] = useState('')
    const [composeBody, setComposeBody] = useState('')

    // Realtime Subscription
    useEffect(() => {
        // Request notification permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        const channel = supabase
            .channel('global-mail')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'contact_emails'
                },
                (payload: any) => {
                    const newEmail = payload.new as ContactEmail

                    // Only notify for inbound emails that are not already in state
                    if (newEmail.direction === 'inbound') {
                        const audio = new Audio('/sounds/notification.mp3') // Assume sound exists or fails silently
                        audio.play().catch(() => { })

                        toast.info(`Nuevo correo de ${newEmail.from_email}`, {
                            description: newEmail.subject,
                            action: {
                                label: 'Ver',
                                onClick: () => {
                                    setSelectedFolder('inbound')
                                }
                            }
                        })

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(`Nuevo correo de ${newEmail.from_email || 'Desconocido'}`, {
                                body: newEmail.subject || '(Sin asunto)',
                                icon: '/icons/icon-192x192.png'
                            })
                        }
                    }

                    setEmails(prev => {
                        if (prev.find(e => e.id === newEmail.id)) return prev
                        return [newEmail, ...prev]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const handleToggleRead = async (emailId: string, currentStatus: boolean) => {
        // Optimistic update
        setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: !currentStatus } : e))

        try {
            if (currentStatus) {
                await markEmailAsUnread(emailId)
            } else {
                await markEmailAsRead(emailId)
            }
        } catch (error) {
            console.error('Error toggling read status', error)
            toast.error('Error al actualizar estado')
            // Revert
            setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: currentStatus } : e))
        }
    }

    // Process threads
    const threads = useMemo(() => {
        const groups: Record<string, any> = {}

        emails.forEach(email => {
            // Basic folder filtering
            if (email.direction !== selectedFolder) return

            // Normalize subject
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
                    snippet: email.snippet || '',
                    isUnread: false // Track if thread has unread messages
                }
            }

            const group = groups[normalizedSubject]
            group.emails.push(email)
            if (email.from_email) group.participants.add(email.from_email)
            if (email.to_email) group.participants.add(email.to_email)

            if (!email.is_read && email.direction === 'inbound') {
                group.isUnread = true
            }

            const emailDate = new Date(email.received_at || email.created_at)
            if (emailDate > group.lastMessageAt) {
                group.lastMessageAt = emailDate
                group.snippet = email.snippet || ''
                group.id = email.id // Update ID to latest
            }
        })

        // Sort threads desc
        const sorted = Object.values(groups).sort((a: any, b: any) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())

        // Sort emails inside threads
        sorted.forEach((group: any) => {
            group.emails.sort((a: ContactEmail, b: ContactEmail) => {
                const dateA = new Date(a.received_at || a.created_at).getTime()
                const dateB = new Date(b.received_at || b.created_at).getTime()
                return dateA - dateB
            })
        })

        return sorted
    }, [emails, selectedFolder])

    const activeConversation = threads.find((t: any) => t.id === selectedThreadId)

    const handleCompose = () => {
        setComposeTo('')
        setComposeSubject('')
        setComposeBody('')
        setIsComposeOpen(true)
    }

    const handleReply = (to: string, subject: string, context: string) => {
        setComposeTo(to)
        setComposeSubject(subject)
        setComposeBody(context)
        setIsComposeOpen(true)
    }

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] overflow-hidden bg-black text-white">
            <MailSidebar
                selectedFolder={selectedFolder}
                onFolderSelect={(f) => {
                    setSelectedFolder(f)
                    setSelectedThreadId(null)
                }}
                onCompose={handleCompose}
            />

            <MailThreadList
                threads={threads}
                selectedThreadId={selectedThreadId}
                onThreadSelect={setSelectedThreadId}
                folder={selectedFolder}
                onToggleRead={handleToggleRead}
            />

            <main className="flex-[2] h-full overflow-hidden bg-black/40">
                {activeConversation ? (
                    <MailView
                        conversation={activeConversation}
                        onReply={handleReply}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        <div className="text-center p-8">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-400">Selecciona una conversación</p>
                        </div>
                    </div>
                )}
            </main>

            <ComposeEmailModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                initialTo={composeTo}
                initialSubject={composeSubject}
                initialBody={composeBody}
            />
        </div>
    )
}
