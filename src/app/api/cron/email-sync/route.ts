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
            push_targets: 0,
            push_subscriptions: 0,
            push_sent: 0,
            push_failed: 0
        }

        // Mapa de subscriptions por user para evitar múltiples queries.
        const subscriptionsByUser = new Map<string, any[]>()

        const sendPushToUsers = async (
            userIds: string[],
            payload: { title: string, body: string, data?: Record<string, any> }
        ) => {
            const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
            if (uniqueUserIds.length === 0) return

            for (const userId of uniqueUserIds) {
                let subs = subscriptionsByUser.get(userId)
                if (!subs) {
                    const { data } = await (supabase
                        .from('push_subscriptions') as any)
                        .select('id, subscription')
                        .eq('user_id', userId)
                    const loadedSubs = data || []
                    subscriptionsByUser.set(userId, loadedSubs)
                    subs = loadedSubs
                }

                for (const sub of subs || []) {
                    diagnostics.push_subscriptions++
                    const result = await WebPushService.sendNotification(sub.subscription, payload)
                    if (result.success) {
                        diagnostics.push_sent++
                    } else {
                        diagnostics.push_failed++
                    }

                    if (result.error === 'GONE') {
                        await (supabase
                            .from('push_subscriptions') as any)
                            .delete()
                            .eq('id', sub.id)
                    }
                }
            }
        }

        // ============================================
        // 1. SINCRONIZACIÓN DE EMAILS (IMAP)
        // ============================================
        const emails = await EmailService.fetchGlobalRecent(20)

        for (const email of emails) {
            try {
                // Buscar contacto por email
                const { data: contact, error: contactError } = await (supabase
                    .from('contacts') as any)
                    .select('id, assigned_to, created_by')
                    .eq('email', email.from)
                    .maybeSingle()

                if (contactError) {
                    console.error(`[Cron] Error buscando contacto ${email.from}:`, contactError)
                    continue
                }

                const contactId = contact?.id || null

                // Verificar si ya existe para evitar duplicar notificaciones
                const { data: existing, error: checkError } = await (supabase
                    .from('contact_emails') as any)
                    .select('id')
                    .eq('message_id', email.messageId)
                    .maybeSingle()

                if (checkError) {
                    // Si el error es de sintaxis UUID (22P02), es que la columna message_id está mal tipada
                    if ((checkError as any).code === '22P02') {
                        console.error(`[Cron] 🚨 ERROR DE ESQUEMA: La columna contact_emails.message_id debe ser TEXT, no UUID.`)
                        console.error(`[Cron] 💡 SOLUCIÓN: Ejecuta este SQL en el panel de Supabase:`)
                        console.error(`       ALTER TABLE contact_emails ALTER COLUMN message_id TYPE text;`)
                    } else {
                        console.error(`[Cron] Error verificando existencia de email:`, checkError)
                    }
                    continue
                }

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
                }, {
                    onConflict: 'message_id'
                })

                if (upsertError) {
                    console.error(`[Cron] Error al upsertar email ${email.messageId}:`, upsertError)
                    continue
                }

                // Solo notificamos nuevos inbound (evita alertas de correos salientes).
                if (!existing && email.direction === 'inbound') {
                    syncedEmails++

                    const pushTargets: string[] = []
                    if (contact?.assigned_to) pushTargets.push(contact.assigned_to)
                    if (contact?.created_by) pushTargets.push(contact.created_by)

                    // Fallback: si no hay owner claro, empujamos a todos los perfiles.
                    if (pushTargets.length === 0) {
                        const { data: profiles } = await (supabase
                            .from('profiles') as any)
                            .select('id')
                        ;(profiles || []).forEach((p: any) => p?.id && pushTargets.push(p.id))
                    }
                    diagnostics.push_targets += Array.from(new Set(pushTargets)).length

                    diagnostics.whatsapp_email_attempted++
                    const whatsappResult = await WhatsAppService.notifyNewEmail(email.from, email.subject, contactId)
                    if (whatsappResult) diagnostics.whatsapp_email_sent++

                    await sendPushToUsers(pushTargets, {
                        title: 'Nuevo Email',
                        body: `${email.from}: ${email.subject || '(Sin asunto)'}`,
                        data: { url: contactId ? `/contacts/${contactId}` : '/mail' }
                    })

                    if (contactId) {
                        await (supabase.from('contacts') as any)
                            .update({ last_interaction: new Date().toISOString() })
                            .eq('id', contactId)
                    }
                }
            } catch (loopError) {
                console.error(`[Cron] Error procesando email individual:`, loopError)
            }
        }

        // ============================================
        // 2. NOTIFICACIÓN DE MENSAJES DE CHAT (TEAM)
        // ============================================
        // Buscamos mensajes del equipo creados en los últimos 6 minutos (margen para evitar gaps)
        // que no hayan sido leídos.
        const fiveMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString()

        const { data: recentMessages, error: chatError } = await (supabase
            .from('team_messages') as any)
            .select(`
                *,
                sender:profiles!team_messages_sender_id_fkey(full_name),
                chat:team_chats(id, name, is_group)
            `)
            .gt('created_at', fiveMinutesAgo)
            .is('read_at', null)

        if (!chatError && recentMessages) {
            // Notificamos mensajes de equipo unread
            for (const msg of (recentMessages as any[])) {
                // Deduplicación persistente por mensaje para no reenviar cada 5 min.
                const { data: alreadyNotified } = await (supabase
                    .from('notifications') as any)
                    .select('id')
                    .eq('title', TEAM_MESSAGE_EVENT_TITLE)
                    .eq('message', msg.id)
                    .maybeSingle()

                if (alreadyNotified) continue

                // Evitamos auto-notificarnos si somos el remitente (aunque el admin suele ser quien recibe)
                const senderName = msg.sender?.full_name || 'Alguien del equipo'
                const chatName = msg.chat?.name || (msg.chat?.is_group ? 'Grupo' : 'Chat privado')

                    diagnostics.whatsapp_chat_attempted++
                    const whatsappChatResult = await WhatsAppService.notifyNewTeamMessage(
                        senderName,
                        msg.content.substring(0, 100),
                        msg.chat_id
                    )
                    if (whatsappChatResult) diagnostics.whatsapp_chat_sent++

                    // Push a participantes del chat, excepto remitente.
                    const { data: participants } = await (supabase
                        .from('team_chat_participants') as any)
                        .select('user_id')
                        .eq('chat_id', msg.chat_id)
                        .neq('user_id', msg.sender_id)

                    const pushTargets = (participants || []).map((p: any) => p.user_id).filter(Boolean)
                    diagnostics.push_targets += Array.from(new Set(pushTargets)).length
                    await sendPushToUsers(pushTargets, {
                        title: `Mensaje en ${chatName}`,
                        body: `${senderName}: ${msg.content.substring(0, 120)}`,
                        data: { url: `/team-chat/${msg.chat_id}` }
                    })

                await (supabase
                    .from('notifications') as any)
                    .insert({
                        title: TEAM_MESSAGE_EVENT_TITLE,
                        message: msg.id,
                        user_id: null,
                        metadata: {
                            chat_id: msg.chat_id,
                            sender_id: msg.sender_id
                        }
                    })

                notifiedChatMessages++
            }
        }

        console.log(`[Cron] Sincronización completada: ${syncedEmails} emails, ${notifiedChatMessages} chats.`)

        return NextResponse.json({
            success: true,
            emails_synced: syncedEmails,
            chat_messages_notified: notifiedChatMessages,
            diagnostics,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('[Cron] Error Crítico:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
