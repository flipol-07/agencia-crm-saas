import { NextResponse } from 'next/server'
import { EmailService } from '@/lib/email/service'
import { createClient } from '@/lib/supabase/server'


export async function GET(req: Request) {
    // Security check (only in production)
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret') || req.headers.get('authorization')?.split(' ')[1]

    if (process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('[Sync] Iniciando sincronización global de emails via IMAP...')

        // 1. Fetch recent emails
        const emails = await EmailService.fetchGlobalUnread(20)

        if (emails.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'No se encontraron correos nuevos' })
        }

        const supabase = await createClient()
        let syncedCount = 0

        // 2. Process each email
        for (const email of emails) {
            // Find contact by email
            const { data: contact } = await (supabase.from('contacts') as any)
                .select('id')
                .eq('email', email.from)
                .single()

            const contactId = contact?.id || null

            // Upsert email
            const { error: upsertError } = await (supabase.from('contact_emails') as any).upsert({
                contact_id: contactId,
                message_id: email.messageId,
                subject: email.subject,
                from_email: email.from,
                to_email: email.to,
                body_text: email.text,
                body_html: email.html,
                direction: 'inbound',
                received_at: email.date.toISOString(),
                is_read: false,
                snippet: email.snippet
            }, {
                onConflict: 'message_id'
            })

            if (!upsertError) {
                syncedCount++

                // Update contact last interaction if exists
                if (contactId) {
                    await (supabase.from('contacts') as any)
                        .update({ last_interaction: new Date().toISOString() })
                        .eq('id', contactId)
                }
            }
        }

        console.log(`[Sync] Sincronización completada. ${syncedCount} correos procesados.`)

        return NextResponse.json({
            success: true,
            synced: syncedCount,
            total_fetched: emails.length,
            latest_email: emails.length > 0 ? {
                from: emails[0].from,
                subject: emails[0].subject,
                date: emails[0].date
            } : null
        })

    } catch (error: any) {
        console.error('[Sync] Error en la sincronización:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
