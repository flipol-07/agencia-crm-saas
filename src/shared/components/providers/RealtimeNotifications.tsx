'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { toast } from 'sonner'
import { useRouter }
import 'next/navigation'

export function RealtimeNotifications() {
    // Memoize client to avoid recreation on every render
    const supabase = useMemo(() => createClient(), [])
    const { increment, setCounts } = useNotificationStore()
    const router = useRouter()

    useEffect(() => {
        console.log('RealtimeNotifications: Initializing listener...')

        // 1. Fetch initial counts
        const fetchInitialCounts = async () => {
            console.log('RealtimeNotifications: Fetching initial unread counts...')
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
        console.log('RealtimeNotifications: Subscribing to contact_emails table...')
        const channel = supabase
            .channel('realtime_emails_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'contact_emails'
                },
                (payload) => {
                    console.log('RealtimeNotifications: New event received!', payload)
                    const newEmail = payload.new as any

                    // Filter in JS for reliability
                    if (newEmail.direction === 'inbound' && newEmail.contact_id) {
                        console.log('RealtimeNotifications: Processing inbound email for contact:', newEmail.contact_id)
                        increment(newEmail.contact_id)

                        // Show toast
                        toast.success('Nuevo mensaje recibido', {
                            description: newEmail.subject || 'Sin asunto',
                            duration: 8000,
                            action: {
                                label: 'Ver',
                                onClick: () => router.push(`/contacts/${newEmail.contact_id}`)
                            }
                        })

                        // Refresh router to update any server components
                        router.refresh()
                    }
                }
            )
            .subscribe((status) => {
                console.log('RealtimeNotifications: Subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('RealtimeNotifications: Listening for live updates!')
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
