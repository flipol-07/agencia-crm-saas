'use server'

import { createClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/email/service'
import { revalidatePath } from 'next/cache'

export async function syncContactEmails(contactId: string, contactEmail: string) {
    try {
        if (!contactEmail) throw new Error('El contacto no tiene email')

        // 1. Obtener emails del servidor IMAP
        const emails = await EmailService.fetchEmailsForContact(contactEmail)

        if (emails.length === 0) return { count: 0 }

        // 2. Guardar en Supabase (cache)
        const supabase = await createClient()

        // Mapear a formato DB
        const emailsToUpsert = emails.map(email => ({
            contact_id: contactId,
            message_id: email.messageId,
            subject: email.subject,
            snippet: email.snippet,
            from_email: email.from,
            to_email: email.to,
            direction: email.direction,
            received_at: email.date.toISOString(),
            is_read: true, // Por defecto leídos si ya los sincronizamos
            body_text: email.text,
            body_html: email.html
        }))

        // Upsert para no duplicar
        const { error } = await supabase
            .from('contact_emails')
            .upsert(emailsToUpsert as any, { onConflict: 'message_id' })

        if (error) throw new Error(`Error BD: ${error.message}`)

        // Actualizar last_interaction del contacto con la fecha del email más reciente
        if (emails.length > 0) {
            const lastEmailDate = emails[0].date.toISOString()
            await supabase
                .from('contacts')
                .update({ last_interaction: lastEmailDate } as any)
                .eq('id', contactId)
        }

        revalidatePath(`/contacts/${contactId}`)
        return { count: emails.length }

    } catch (error) {
        console.error('Sync Emails Error:', error)
        throw new Error(error instanceof Error ? error.message : 'Error de sincronización')
    }
}
