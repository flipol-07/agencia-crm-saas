'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/email/service'
import { revalidatePath } from 'next/cache'

export async function syncGlobalEmails() {
    try {
        console.log('🔄 Iniciando sincronización global de correos...')

        // 1. Obtener emails recientes (Inbox y Sent)
        const emails = await EmailService.fetchGlobalRecent(50) // Traemos los últimos 50

        if (emails.length === 0) return { count: 0 }

        const supabase = await createAdminClient()

        // 2. Obtener lista de contactos para intentar matchear
        // Traemos email y id para buscar coincidencia
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, email')
            .not('email', 'is', null)

        // Crear mapa email -> contact_id
        const contactMap = new Map<string, string>()
        contacts?.forEach((c: any) => {
            if (c.email) contactMap.set(c.email.toLowerCase(), c.id)
        })

        // 3. Preparar upsert payload
        const emailsToUpsert = emails.map(email => {
            // Intentar encontrar contact_id
            // Si es inbound, buscamos por el 'from'. Si es outbound, por el 'to'.
            // PERO un hilo puede tener múltiples participantes.
            // Para simplificar: buscamos si el 'other party' está en nuestros contactos.

            const otherPartyEmail = email.direction === 'inbound' ? email.from : email.to
            const cleanEmail = otherPartyEmail.match(/<(.+)>/)?.[1] || otherPartyEmail

            const matchedContactId = contactMap.get(cleanEmail.toLowerCase()) || null

            return {
                contact_id: matchedContactId, // Puede ser NULL si no es un contacto registrado
                message_id: email.messageId,
                subject: email.subject,
                snippet: email.snippet,
                from_email: email.from,
                to_email: email.to,
                direction: email.direction,
                received_at: email.date.toISOString(),
                is_read: email.direction === 'outbound', // Salientes leídos por defecto
                body_text: email.text,
                body_html: email.html
            }
        })

        // Deduplicar por message_id
        const uniqueEmailsToUpsert = Array.from(
            new Map(emailsToUpsert.map(item => [item.message_id, item])).values()
        )

        // 4. Upsert (Guardar incluso si no tiene contact_id)
        const { error } = await (supabase.from('contact_emails') as any)
            .upsert(uniqueEmailsToUpsert as any, { onConflict: 'message_id' })

        if (error) {
            console.error('Error upserting global emails:', error)
            throw new Error(`Error BD: ${error.message}`)
        }

        console.log(`✅ Sincronizados ${uniqueEmailsToUpsert.length} correos globales`)

        revalidatePath('/mail')
        revalidatePath('/contacts') // Por si se actualizaron hilos de contactos
        return { count: uniqueEmailsToUpsert.length }

    } catch (error) {
        console.error('Global Email Sync Error:', error)
        const message = error instanceof Error ? error.message : 'Error desconocido'
        throw new Error(`Fallo en sincronización global: ${message}`)
    }
}
