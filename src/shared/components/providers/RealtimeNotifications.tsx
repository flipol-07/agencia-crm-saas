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
                    event: '*', // Listen to everything (INSERT/UPDATE/DELETE) for total visibility
                    schema: 'public',
                    table: 'contact_emails'
                },
                (payload) => {
                    console.log('RealtimeNotifications: 🔔 DB Event Received:', payload.eventType, payload)

                    if (payload.eventType === 'INSERT') {
                        const newEmail = payload.new as any

                        if (newEmail.direction === 'inbound') {
                            console.log('RealtimeNotifications: ✅ Inbound verified from:', newEmail.from_email)

                            if (newEmail.contact_id) {
                                increment(newEmail.contact_id)
                            }

                            const title = newEmail.contact_id ? 'Nuevo mensaje de contacto' : 'Mensaje (Remitente desconocido)'

                            // Show toast
                            toast.success(title, {
                                description: `${newEmail.from_email}: ${newEmail.subject || 'Sin asunto'}`,
                                duration: 10000,
                                action: newEmail.contact_id ? {
                                    label: 'Ver Contacto',
                                    onClick: () => router.push(`/contacts/${newEmail.contact_id}`)
                                } : undefined
                            })

                            // Refresh router
                            router.refresh()
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('RealtimeNotifications: [4/4] Subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('RealtimeNotifications: 🚀 CRM is LIVE for all incoming mail!')
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('RealtimeNotifications: Error connecting to Realtime channel')
                }
            })

        return () => {
            console.log('RealtimeNotifications: Cleaning up listener...')
            supabase.removeChannel(channel)
        }
    }, [supabase, increment, setCounts, router])

    return null
}
