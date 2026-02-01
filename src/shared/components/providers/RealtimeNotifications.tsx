'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RealtimeNotifications() {
    // Memoize client to avoid recreation on every render
    const supabase = useMemo(() => createClient(), [])
    const { increment, setCounts } = useNotificationStore()
    const router = useRouter()

    useEffect(() => {
        // Request notification permission for PWA/Mobile
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        console.log('RealtimeNotifications: [1/4] Initializing global listener...')

        // 1. Fetch initial counts
        const fetchInitialCounts = async () => {
            console.log('RealtimeNotifications: [2/4] Fetching initial unread counts...')
            const { data, error } = await (supabase.from('contact_emails') as any)
                .select('contact_id')
                .eq('is_read', false)
                .eq('direction', 'inbound')

            if (data) {
                const counts: Record<string, number> = {}
                data.forEach((email: any) => {
                    if (email.contact_id) {
                        counts[email.contact_id] = (counts[email.contact_id] || 0) + 1
                    }
                })
                console.log('RealtimeNotifications: Initial counts loaded:', counts)
                setCounts(counts)
            }
            if (error) {
                console.error('RealtimeNotifications: Error fetching initial counts:', error)
            }
        }

        fetchInitialCounts()

        // 2. Subscribe to new emails
        console.log('RealtimeNotifications: [3/4] Subscribing to ALL contact_emails changes...')
        const channel = supabase
            .channel('realtime_emails_global')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT', // Only notify on NEW inserts to avoid duplicates on updates
                    schema: 'public',
                    table: 'contact_emails'
                },
                (payload: any) => {
                    console.log('RealtimeNotifications: 🔔 DB Event Received:', payload.eventType, payload)

                    const newEmail = payload.new as any

                    // Filter in JS for maximum local debugging
                    if (newEmail.direction === 'inbound') {
                        console.log('RealtimeNotifications: ✅ Inbound verified from:', newEmail.from_email)

                        if (newEmail.contact_id) {
                            increment(newEmail.contact_id)
                        }

                        const title = newEmail.contact_id ? 'Nuevo mensaje de contacto' : 'Mensaje (Remitente desconocido)'
                        const body = `${newEmail.from_email}: ${newEmail.subject || 'Sin asunto'}`

                        // 1. Show Toast (Browser UI)
                        toast.success(title, {
                            description: body,
                            duration: 15000,
                            action: newEmail.contact_id ? {
                                label: 'Ver Contacto',
                                onClick: () => router.push(`/contacts/${newEmail.contact_id}`)
                            } : undefined
                        })

                        // 2. Show Native Notification (PWA / Mobile System)
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(title, {
                                body: body,
                                icon: '/aurie-official-logo.png'
                            })
                        }

                        // 3. Refresh router
                        router.refresh()
                    }
                }
            )
            // Subscribe to Team Chat Messages
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'team_messages'
                },
                async (payload: any) => {
                    const newMsg = payload.new as any

                    // Filter out own messages
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user && newMsg.sender_id !== user.id) {
                        const title = 'Nuevo mensaje de equipo'
                        const body = newMsg.content || 'Imagen/Archivo'

                        toast.info(title, {
                            description: body,
                            duration: 5000,
                            action: {
                                label: 'Responder',
                                onClick: () => router.push(`/team-chat/${newMsg.chat_id}`)
                            }
                        })

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(title, {
                                body: body,
                                icon: '/aurie-official-logo.png'
                            })
                        }
                    }
                }
            )
            .subscribe((status: string) => {
                console.log('RealtimeNotifications: [4/4] Subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('RealtimeNotifications: 🚀 CRM is LIVE for all incoming mail!')
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('RealtimeNotifications: ❌ ERROR in real-time channel connection')
                    toast.error('Error de conexión Realtime', {
                        description: 'Las notificaciones podrían no llegar al instante.'
                    })
                }
            })

        return () => {
            console.log('RealtimeNotifications: Cleaning up...')
            supabase.removeChannel(channel)
        }
    }, [supabase, increment, setCounts, router])

    return null
}
