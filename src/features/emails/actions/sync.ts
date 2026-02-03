'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/email/service'
import { revalidatePath } from 'next/cache'

export async function syncContactEmails(contactId: string, contactEmail: string) {
    try {
        if (!contactEmail) throw new Error('El contacto no tiene email')

        // 1. Obtener emails del servidor IMAP
        const emails = await EmailService.fetchEmailsForContact(contactEmail)

        if (emails.length === 0) return { count: 0 }

        // 2. Guardar en Supabase (cache)
        const supabase = await createAdminClient()

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
            is_read: email.direction === 'outbound', // Solo los salientes se marcan leídos por defecto
            body_text: email.text,
            body_html: email.html
        }))

        // Deduplicar por message_id para evitar error en upsert batch (ON CONFLICT no soporta duplicados en el payload)
        const uniqueEmailsToUpsert = Array.from(
            new Map(emailsToUpsert.map(item => [item.message_id, item])).values()
        )

        // Upsert para no duplicar
        const { error } = await (supabase.from('contact_emails') as any)
            .upsert(uniqueEmailsToUpsert as any, { onConflict: 'message_id' })

        if (error) throw new Error(`Error BD: ${error.message}`)

        // Actualizar last_interaction del contacto con la fecha del email más reciente
        if (emails.length > 0) {
            const lastEmailDate = emails[0].date.toISOString()
            await (supabase.from('contacts') as any)
                .update({ last_interaction: lastEmailDate } as any)
                .eq('id', contactId)
        }

        revalidatePath(`/contacts/${contactId}`)
        return { count: emails.length }

    } catch (error) {
        console.error('Email Sync Error [Internal]:', error)
        // No exponemos detalles técnicos internos del servidor IMAP/BD al cliente
        // pero sí un mensaje útil
        const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Error de conexión o timeout');
        throw new Error(`Fallo en sincronización: ${message}`);
    }
}
