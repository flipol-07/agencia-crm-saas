'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'
import { sendChatNotification } from '@/features/team-chat/actions/send-chat-notification'

const WEBPUSH_PUBLIC_KEY = 'BCH53wV_AUnSB_XZBXTA6iGDr4oil_deUAtu6YP8_SEibQ9-0SGB_wyjyGsXQsupOBdnnFW3q9GW93xZwJL_Crg'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function RealtimeNotifications() {
    // Memoize client to avoid recreation on every render
    const supabase = useMemo(() => createClient(), [])
    const { increment, decrement, setCounts, incrementTeam, setTeamUnread } = useNotificationStore()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // 0. Push Notification Setup
        const setupPushNotifications = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.warn('Push notifications not supported in this browser.')
                return
            }

            try {
                console.log('Push: Checking Service Worker...')
                const registration = await navigator.serviceWorker.ready
                console.log('Push: Service Worker Ready:', registration.active?.state)

                // Request permission
                const permission = await Notification.requestPermission()
                console.log('Push: Permission status:', permission)
                if (permission !== 'granted') return

                // Check for existing subscription
                let subscription = await registration.pushManager.getSubscription()
                console.log('Push: Existing subscription:', !!subscription)

                if (!subscription) {
                    console.log('Push: Creating new subscription...')
                    // Create new subscription
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(WEBPUSH_PUBLIC_KEY)
                    })
                    console.log('Push: New subscription created.')
                }

                // Send to backend
                const response = await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription })
                })

                if (response.ok) {
                    console.log('Push: Backend synchronized successfully.')
                } else {
                    console.error('Push: Backend synchronization failed.')
                }
            } catch (error) {
                console.error('Error setting up push notifications:', error)
            }
        }

        setupPushNotifications()

        // 1. Fetch initial counts (Per User via RPC)
        const fetchInitialCounts = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase.rpc('get_my_unread_counts')

            if (data) {
                const counts: Record<string, number> = {}
                const details: Record<string, { contactName: string, companyName: string }> = {}

                data.forEach((row: any) => {
                    if (row.contact_id && row.count > 0) {
                        counts[row.contact_id] = Number(row.count)
                        details[row.contact_id] = {
                            contactName: row.contact_name || '',
                            companyName: row.company_name || 'Sin empresa'
                        }
                    }
                })
                setCounts(counts, details)
            }
            if (error) {
                console.error('RealtimeNotifications: Error fetching initial counts:', error)
            }

            // 2. Fetch team unread count
            const { data: teamData, error: teamError } = await supabase.rpc('get_team_unread_count')
            if (teamData !== null && !teamError) {
                setTeamUnread(Number(teamData))
            }
        }

        fetchInitialCounts()

        // 2. Realtime Subscriptions
        const channel = supabase
            .channel('realtime_notifications_hub')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'contact_emails'
                },
                async (payload: any) => {
                    const newEmail = payload.new as any

                    // Filter in JS: Only inbound emails matter for notifications
                    if (newEmail.direction === 'inbound') {
                        let contactName = 'Contacto'

                        if (newEmail.contact_id) {
                            // Fetch contact name for the store detail
                            const { data: contact } = await supabase
                                .from('contacts')
                                .select('contact_name, company_name')
                                .eq('id', newEmail.contact_id)
                                .single()

                            if (contact) {
                                contactName = contact.contact_name || contact.company_name || 'Contacto'
                                increment(newEmail.contact_id, {
                                    contactName: contact.contact_name || '',
                                    companyName: contact.company_name || ''
                                })
                            } else {
                                increment(newEmail.contact_id)
                            }
                        }

                        const receivedAt = new Date(newEmail.received_at || new Date()).getTime()
                        const now = Date.now()
                        const isRecent = (now - receivedAt) < 1000 * 60 * 60 // 1 hour

                        // Only notify if recent to avoid spam
                        if (isRecent) {
                            const title = `Mensaje de ${contactName}`
                            const body = `${newEmail.subject || 'Sin asunto'}`

                            // 1. Toast
                            toast.success(title, {
                                description: body,
                                duration: 8000,
                                action: newEmail.contact_id ? {
                                    label: 'Ver',
                                    onClick: () => router.push(`/contacts/${newEmail.contact_id}`)
                                } : undefined
                            })

                            // 2. Native Notification
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification(title, { body, icon: '/aurie-official-logo.png' })
                            }
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'email_reads' // Listen for "Mark as Read" actions
                },
                async (payload: any) => {
                    const newRead = payload.new as any
                    const { data: { user } } = await supabase.auth.getUser()

                    // If *I* read it (or my other device did), decrement count
                    if (user && newRead.user_id === user.id) {
                        // We need the contact_id to find which counter to decrement.
                        // Fetch it from the email_id (message_id)
                        const { data: email } = await supabase
                            .from('contact_emails')
                            .select('contact_id')
                            .eq('message_id', newRead.email_id)
                            .single()

                        if (email?.contact_id) {
                            decrement(email.contact_id)
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'team_messages'
                },
                async (payload: any) => {
                    const newMsg = payload.new as any
                    const { data: { user } } = await supabase.auth.getUser()

                    // Filter out own messages
                    if (user && newMsg.sender_id !== user.id) {
                        // 1. Update store if not on the chat page
                        if (pathname !== `/team-chat/${newMsg.chat_id}`) {
                            incrementTeam()
                        }

                        const title = 'Nuevo mensaje de equipo'
                        const body = newMsg.content || 'Adjunto'

                        // 2. Toast
                        toast.info(title, {
                            description: body,
                            duration: 5000,
                            action: {
                                label: 'Responder',
                                onClick: () => router.push(`/team-chat/${newMsg.chat_id}`)
                            }
                        })

                        // 3. Push and WhatsApp
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(title, { body, icon: '/aurie-official-logo.png' })
                        }

                        // Always trigger WhatsApp notification (backend handles if needed)
                        sendChatNotification(newMsg.sender_id, body, newMsg.chat_id)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tasks'
                },
                async (payload: any) => {
                    const newTask = payload.new as any
                    const { data: { user } } = await supabase.auth.getUser()

                    // Only notify if assigned to current user
                    if (user && newTask.assigned_to === user.id) {
                        const title = 'Nueva tarea asignada'
                        const body = newTask.title || 'Sin título'

                        toast.info(title, {
                            description: body,
                            action: {
                                label: 'Ver',
                                onClick: () => router.push(`/tasks/list?id=${newTask.id}`)
                            }
                        })

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(title, { body, icon: '/aurie-official-logo.png' })
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'contacts'
                },
                async (payload: any) => {
                    const oldContact = payload.old as any
                    const newContact = payload.new as any

                    // Notify on lead status (pipeline phase) changes
                    if (newContact.pipeline_phase !== oldContact.pipeline_phase) {
                        const title = 'Cambio en Pipeline'
                        const body = `${newContact.company_name}: ${oldContact.pipeline_phase || 'Lead'} -> ${newContact.pipeline_phase}`

                        toast.success(title, {
                            description: body,
                            action: {
                                label: 'Ver',
                                onClick: () => router.push(`/contacts/${newContact.id}`)
                            }
                        })

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(title, { body, icon: '/aurie-official-logo.png' })
                        }
                    }
                }
            )
            .subscribe((status: string) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('RealtimeNotifications: Connection Error', status)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, increment, decrement, setCounts, router])

    return null
}
