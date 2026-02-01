'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RealtimeNotifications() {
    const supabase = createClient()
    const { increment, setCounts } = useNotificationStore()
    const router = useRouter()

    useEffect(() => {
        // 1. Fetch initial counts
        const fetchInitialCounts = async () => {
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
                setCounts(counts)
            }
        }

        fetchInitialCounts()

        // 2. Subscribe to new emails
        const channel = supabase
            .channel('realtime_emails')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'contact_emails',
                    filter: 'direction=eq.inbound'
                },
                (payload) => {
                    const newEmail = payload.new as any
                    if (newEmail.contact_id) {
                        increment(newEmail.contact_id)

                        // Show toast
                        toast('Nuevo mensaje recibido', {
                            description: newEmail.subject,
                            action: {
                                label: 'Ver',
                                onClick: () => router.push(`/contacts/${newEmail.contact_id}`)
                            }
                        })

                        // Revalidate server data (optional but good for consistency)
                        router.refresh()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, increment, setCounts, router])

    return null
}
