'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'

export function RealtimeNotifications() {
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()
    const pathname = usePathname()
    const pathnameRef = useRef(pathname || '')

    useEffect(() => {
        pathnameRef.current = pathname || ''
    }, [pathname])

    const increment = useNotificationStore((s) => s.increment)
    const decrement = useNotificationStore((s) => s.decrement)
    const setCounts = useNotificationStore((s) => s.setCounts)
    const incrementTeam = useNotificationStore((s) => s.incrementTeam)
    const setTeamUnread = useNotificationStore((s) => s.setTeamUnread)

    useEffect(() => {
        let channel: any = null

        const startSubscription = async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser()

            if (userError || !user) {
                console.log('Realtime: Waiting for session...')
                return
            }

            console.log('Realtime: Subscribing for user', user.id)

            // 1. Initial State Sync
            try {
                const { data: counts } = await supabase.rpc('get_my_unread_counts')
                if (counts) {
                    const c: Record<string, number> = {}
                    const d: Record<string, any> = {}
                    counts.forEach((row: any) => {
                        if (row.contact_id && row.count > 0) {
                            c[row.contact_id] = Number(row.count)
                            d[row.contact_id] = {
                                contactName: row.contact_name,
                                companyName: row.company_name,
                            }
                        }
                    })
                    setCounts(c, d)
                }
                const { data: teamCount } = await supabase.rpc('get_team_unread_count')
                if (teamCount !== null) setTeamUnread(Number(teamCount))
            } catch (e) {
                console.error('Realtime Sync Error', e)
            }

            // 2. Cleanup previous channel
            if (channel) {
                supabase.removeChannel(channel)
            }

            // 3. Setup New Channel
            const channelName = `auth_hub_${user.id}_${Date.now()}`
            channel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'contact_emails' },
                    (p: any) => {
                        const email = p.new
                        if (email.direction === 'inbound') {
                            increment(email.contact_id)
                            toast.success(`Email de ${email.from_email}`, {
                                description: email.subject,
                                action: {
                                    label: 'Ver',
                                    onClick: () => router.push(`/contacts/${email.contact_id}`),
                                },
                            })
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'email_reads' },
                    async (p: any) => {
                        const read = p.new
                        if (read.user_id === user.id) {
                            const { data } = await supabase
                                .from('contact_emails')
                                .select('contact_id')
                                .eq('message_id', read.email_id)
                                .single()
                            if (data?.contact_id) decrement(data.contact_id)
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'team_messages' },
                    (p: any) => {
                        const msg = p.new
                        if (msg.sender_id !== user.id) {
                            if (!(pathnameRef.current || '').includes(msg.chat_id)) {
                                incrementTeam()
                            }
                            toast.info('Mensaje de Equipo', {
                                description: msg.content,
                                action: {
                                    label: 'Chat',
                                    onClick: () => router.push(`/team-chat/${msg.chat_id}`),
                                },
                            })
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'tasks' },
                    (p: any) => {
                        const t = p.new
                        if (t.assigned_to === user.id) {
                            toast.info('Tarea Asignada', { description: t.title })
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'contacts' },
                    (p: any) => {
                        const { old: o, new: n } = p
                        if (o && n && n.pipeline_phase !== o.pipeline_phase) {
                            toast.success('Cambio en Pipeline', {
                                description: `${n.company_name}: ${n.pipeline_phase}`,
                                action: {
                                    label: 'Ver',
                                    onClick: () => router.push(`/contacts/${n.id}`),
                                },
                            })
                        }
                    }
                )
                .subscribe((status: string, err?: any) => {
                    console.log(`Realtime Hub [${channelName}]: ${status}`, err || '')
                })
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: string) => {
            console.log('Realtime Auth State Change:', event)
            if (
                event === 'SIGNED_IN' ||
                event === 'INITIAL_SESSION' ||
                event === 'TOKEN_REFRESHED'
            ) {
                startSubscription()
            } else if (event === 'SIGNED_OUT') {
                if (channel) supabase.removeChannel(channel)
                channel = null
            }
        })

        startSubscription()

        return () => {
            subscription.unsubscribe()
            if (channel) supabase.removeChannel(channel)
        }
    }, [
        supabase,
        increment,
        decrement,
        setCounts,
        setTeamUnread,
        incrementTeam,
        router,
    ])

    return null
}
