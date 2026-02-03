'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/email/service'
import { revalidatePath } from 'next/cache'

export async function sendEmailAction(formData: FormData) {
    const to = formData.get('to') as string
    const subject = formData.get('subject') as string
    const body = formData.get('body') as string
    const inHandler = formData.get('inHandler') === 'true' // Flag to link to existing thread if reply

    if (!to || !subject || !body) {
        throw new Error('Faltan campos obligatorios')
    }

    try {
        // 1. Send via SMTP
        // Convert \n to <br> for HTML simple compatibility if it's plain text
        const htmlBody = body.replace(/\n/g, '<br>')
        const info = await EmailService.sendEmail(to, subject, htmlBody, body)

        // 2. Save to Supabase (Outbound)
        const supabase = await createAdminClient()

        // Attempt to find contact_id
        const cleanTo = to.match(/<(.+)>/)?.[1] || to
        const { data: contact } = await (supabase
            .from('contacts')
            .select('id')
            .eq('email', cleanTo)
            .single() as any)

        const messageId = info.messageId.replace(/[<>]/g, '') // Clean message ID

        const { error } = await (supabase.from('contact_emails') as any).insert({
            contact_id: contact?.id || null,
            message_id: messageId,
            subject,
            snippet: body.substring(0, 150),
            from_email: process.env.EMAIL_USER, // We assume it's sent from system account
            to_email: to,
            direction: 'outbound',
            is_read: true,
            body_text: body,
            body_html: htmlBody,
            received_at: new Date().toISOString()
        })

        if (error) {
            console.error('Error saving sent email to DB:', error)
            // We don't throw here to avoid telling user it failed if it was actually sent
        }

        revalidatePath('/mail')
        revalidatePath('/contacts')

        return { success: true, messageId }

    } catch (error) {
        console.error('Send Email Error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error al enviar' }
    }
}
