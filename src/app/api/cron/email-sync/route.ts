import { NextResponse } from 'next/server'
import { EmailService } from '@/lib/email/service'
import { createAdminClient } from '@/lib/supabase/server'
import { WhatsAppService } from '@/shared/lib/whatsapp'
import { WebPushService } from '@/shared/lib/web-push'

const TEAM_MESSAGE_EVENT_TITLE = 'cron_team_message_notified'

export async function GET(req: Request) {
    // Security check (only in production)
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret') || req.headers.get('authorization')?.split(' ')[1]

    // Aceptamos tanto CRON_SECRET como el valor específico enviado por el usuario
    const isValidSecret = secret === process.env.CRON_SECRET ||
        secret === process.env.EMAIL_WEBHOOK_SECRET ||
        secret === 'aurie-maquina-2026';

    if (process.env.NODE_ENV === 'production' && !isValidSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    try {
        console.log('[Cron] Iniciando sincronización de Emails y Chat...')
        let syncedEmails = 0
        let notifiedChatMessages = 0
        const diagnostics = {
            whatsapp_email_attempted: 0,
            whatsapp_email_sent: 0,
            whatsapp_chat_attempted: 0,
            whatsapp_chat_sent: 0,
            whatsapp_last_error: '' as string,
            whatsapp_last_status: 0 as number,
            push_targets: 0,
            push_subscriptions: 0,
            push_sent: 0,
            push_failed: 0
        }

        const subscriptionsByUser = new Map<string, any[]>()
        const notificationPrefsByUser = new Map<string, { push_enabled: boolean, whatsapp_enabled: boolean, whatsapp_number: string }>()

        // 1. Loading preferences in batch
        const loadNotificationPreferencesForUsers = async (userIds: string[]) => {
            const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
            const idsToLoad = uniqueUserIds.filter(userId => !notificationPrefsByUser.has(userId))
            if (idsToLoad.length === 0) return

            const keys = idsToLoad.map(userId => `notification_preferences:${userId}`)
            const { data } = await (supabase
                .from('app_settings') as any)
                .select('key, value')
                .in('key', keys)

            const byKey = new Map<string, any>()
            for (const row of (data || [])) {
                byKey.set(row.key, row.value || {})
            }

            for (const userId of idsToLoad) {
                const raw = byKey.get(`notification_preferences:${userId}`) || {}
                notificationPrefsByUser.set(userId, {
                    push_enabled: raw.push_enabled !== false,
                    whatsapp_enabled: raw.whatsapp_enabled === true,
                    whatsapp_number: typeof raw.whatsapp_number === 'string' ? raw.whatsapp_number : '',
                })
            }
        }

        // Parallelized notification sending
        const sendNotificationsToUsers = async (
            userIds: string[],
            payload: { title: string, body: string, data?: Record<string, any> },
            buildWhatsAppMsg: (userId: string) => string
        ) => {
            const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
            if (uniqueUserIds.length === 0) return

            await loadNotificationPreferencesForUsers(uniqueUserIds)

            const notificationPromises = uniqueUserIds.map(async (userId) => {
                const pref = notificationPrefsByUser.get(userId)

                // 1. WhatsApp
                if (pref?.whatsapp_enabled && /^34\d{8,15}$/.test(pref.whatsapp_number)) {
                    diagnostics.whatsapp_email_attempted++
                    const waResult = await WhatsAppService.sendMessageToNumberDetailed(pref.whatsapp_number, buildWhatsAppMsg(userId))
                    if (waResult.success) diagnostics.whatsapp_email_sent++
                    else diagnostics.whatsapp_last_error = String(waResult.error || '').slice(0, 100)
                }

                // 2. Push
                if (pref?.push_enabled !== false) {
                    let subs: any[] = subscriptionsByUser.get(userId) || [];
                    if (subs.length === 0) {
                        const { data } = await (supabase.from('push_subscriptions') as any).select('id, subscription').eq('user_id', userId)
                        subs = (data || []) as any[];
                        subscriptionsByUser.set(userId, subs)
                    }

                    await Promise.allSettled(subs.map(async (sub) => {
                        diagnostics.push_subscriptions++
                        const result = await WebPushService.sendNotification(sub.subscription, payload)
                        if (result.success) diagnostics.push_sent++
                        else {
                            diagnostics.push_failed++
                            if (result.error === 'GONE') {
                                await (supabase.from('push_subscriptions') as any).delete().eq('id', sub.id)
                            }
                        }
                    }))
                }
            })

            await Promise.allSettled(notificationPromises)
        }

        // ============================================
        // 1. SINCRONIZACIÓN DE EMAILS (IMAP)
        // ============================================
        const emails = await EmailService.fetchGlobalRecent(20)
        if (emails.length > 0) {
            // Batch check existence
            const messageIds = emails.map(e => e.messageId)
            const { data: existingIdsData } = await (supabase
                .from('contact_emails') as any)
                .select('message_id')
                .in('message_id', messageIds)

            const existingIds = new Set((existingIdsData || []).map((row: any) => row.message_id))
            const newEmails = emails.filter(e => !existingIds.has(e.messageId))

            for (const email of newEmails) {
                try {
                    // Contact check (could be batched but more complex due to email lookup)
                    const { data: contact } = await (supabase.from('contacts') as any).select('id, assigned_to, created_by').eq('email', email.from).maybeSingle()
                    const contactId = contact?.id || null

                    const { error: upsertError } = await (supabase.from('contact_emails') as any).upsert({
                        contact_id: contactId,
                        message_id: email.messageId,
                        subject: email.subject,
                        from_email: email.from,
                        to_email: email.to,
                        body_text: email.text,
                        body_html: email.html,
                        direction: email.direction,
                        received_at: email.date.toISOString(),
                        is_read: false,
                        snippet: email.snippet
                    }, { onConflict: 'message_id' })

                    if (upsertError) continue

                    if (email.direction === 'inbound') {
                        syncedEmails++
                        const pushTargets: string[] = []
                        if (contact?.assigned_to) pushTargets.push(contact.assigned_to)
                        if (contact?.created_by) pushTargets.push(contact.created_by)

                        if (pushTargets.length === 0) {
                            const { data: profiles } = await (supabase.from('profiles') as any).select('id').limit(5)
                                ; (profiles || []).forEach((p: any) => pushTargets.push(p.id))
                        }

                        // Send notifications in background (don't strictly await each one sequentially)
                        await sendNotificationsToUsers(
                            Array.from(new Set(pushTargets)),
                            {
                                title: 'Nuevo Email',
                                body: `${email.from}: ${email.subject || '(Sin asunto)'}`,
                                data: { url: contactId ? `/contacts/${contactId}` : '/mail' }
                            },
                            () => `📧 *Nuevo Email en CRM Aurie*\n\n*De:* ${email.from}\n*Asunto:* ${email.subject || '(Sin asunto)'}\n\n👉 Ver: https://agencia-crm-saas.vercel.app${contactId ? `/contacts/${contactId}` : '/mail'}`
                        )

                        if (contactId) {
                            await (supabase.from('contacts') as any).update({ last_interaction: new Date().toISOString() }).eq('id', contactId)
                        }
                    }
                } catch (err) {
                    console.error('[Cron] Loop Email Error:', err)
                }
            }
        }

        // ============================================
        // 2. NOTIFICACIÓN DE MENSAJES DE CHAT (TEAM)
        // ============================================
        const fiveMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString()
        const { data: recentMessages, error: chatError } = await (supabase
            .from('team_messages') as any)
            .select(`*, sender:profiles!team_messages_sender_id_fkey(full_name), chat:team_chats(id, name, is_group)`)
            .gt('created_at', fiveMinutesAgo)
            .is('read_at', null)

        if (!chatError && recentMessages && recentMessages.length > 0) {
            for (const msg of (recentMessages as any[])) {
                const { data: alreadyNotified } = await (supabase.from('notifications') as any).select('id').eq('title', TEAM_MESSAGE_EVENT_TITLE).eq('message', msg.id).maybeSingle()
                if (alreadyNotified) continue

                const { data: participants } = await (supabase.from('team_chat_participants') as any).select('user_id').eq('chat_id', msg.chat_id).neq('user_id', msg.sender_id)
                const pushTargets = (participants || []).map((p: any) => p.user_id).filter(Boolean)

                if (pushTargets.length > 0) {
                    const senderName = msg.sender?.full_name || 'Alguien del equipo'
                    const chatName = msg.chat?.name || (msg.chat?.is_group ? 'Grupo' : 'Chat privado')

                    await sendNotificationsToUsers(
                        pushTargets,
                        {
                            title: `Mensaje en ${chatName}`,
                            body: `${senderName}: ${msg.content.substring(0, 120)}`,
                            data: { url: `/team-chat/${msg.chat_id}` }
                        },
                        () => `💬 *Mensaje de Equipo*\n\n*De:* ${senderName}\n*Mensaje:* ${msg.content.substring(0, 120)}\n\n👉 https://agencia-crm-saas.vercel.app/team-chat/${msg.chat_id}`
                    )
                }

                await (supabase.from('notifications') as any).insert({ title: TEAM_MESSAGE_EVENT_TITLE, message: msg.id, user_id: null, metadata: { chat_id: msg.chat_id, sender_id: msg.sender_id } })
                notifiedChatMessages++
            }
        }

        return NextResponse.json({
            success: true,
            emails_synced: syncedEmails,
            chat_messages_notified: notifiedChatMessages,
            diagnostics,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('[Cron] Error Crítico:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
