import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

// Type básico para el payload de Evolution API (simplificado)
interface EvolutionPayload {
    data: {
        key: {
            remoteJid: string // El número de teléfono (e.g. 34600123456@s.whatsapp.net)
        }
        message?: {
            conversation?: string
            extendedTextMessage?: {
                text: string
            }
        }
        keyId: string // ID del mensaje
    }
    sender: string // Number
}

export async function POST(request: Request) {
    try {
        const payload = await request.json()
        const event = (payload?.event || 'unknown').toLowerCase()

        console.log(`[Webhook] Event Received: ${event}`)
        // console.log(`[Webhook] Full Payload:`, JSON.stringify(payload, null, 2))

        // Aceptamos varias formas de 'messages.upsert' (algunas versiones usan snake_case o caps)
        const isMessageEvent = event.includes('messages.upsert') || event.includes('message.upsert') || event.includes('messages_upsert')

        if (!isMessageEvent) {
            console.log(`[Webhook] Ignored event type: ${event}`)
            return NextResponse.json({ ok: true })
        }

        const data = payload.data
        if (!data) return NextResponse.json({ ok: true })

        // Si es un mensaje nuestro (enviado desde el móvil o web de whatsapp), lo ignoramos para no duplicar
        if (data.key?.fromMe) {
            console.log('[Webhook] Ignoring message fromMe: true')
            return NextResponse.json({ ok: true })
        }

        // Extraer teléfono y contenido limpiamente
        const remoteJid = data.key?.remoteJid || payload.sender || ''
        const phone = remoteJid.split('@')[0].replace(/\D/g, '') // Solo números

        if (!phone) {
            console.log('[Webhook] No phone found in payload')
            return NextResponse.json({ ok: true })
        }

        // Extraer contenido del mensaje (intentar varios campos comunes)
        const message = data.message || {}
        const content =
            message.conversation ||
            message.extendedTextMessage?.text ||
            message.imageMessage?.caption ||
            message.videoMessage?.caption ||
            message.buttonsResponseMessage?.selectedButtonId ||
            payload.text ||
            '';

        const messageId = data.key?.id || data.messageId

        const supabase = await createClient()

        // 1. Buscar contacto (usando el número limpio)
        let { data: contact } = await supabase
            .from('contacts')
            .select('id')
            .filter('phone', 'ilike', `%${phone}%`)
            .maybeSingle()

        // 2. Si no existe, crear prospecto automático
        if (!contact) {
            console.log(`[Webhook] Contact ${phone} not found. Creating automatic prospect...`)
            const { data: newContact, error: createError } = await supabase
                .from('contacts')
                .insert({
                    company_name: `WhatsApp ${phone}`,
                    contact_name: data.pushName || `User ${phone}`,
                    phone: phone,
                    source: 'inbound_whatsapp',
                    status: 'prospect',
                    pipeline_stage: 'nuevo'
                })
                .select('id')
                .single()

            if (createError) {
                console.error('[Webhook] Error creating contact:', createError)
                return NextResponse.json({ error: createError.message }, { status: 500 })
            }
            contact = newContact
        }

        // 3. Insertar el mensaje
        const { error: msgError } = await supabase
            .from('messages')
            .insert({
                contact_id: contact.id,
                content: content,
                direction: 'inbound',
                status: 'delivered',
                whatsapp_message_id: messageId,
                payload: data
            })

        if (msgError) {
            console.error('[Webhook] Error inserting message:', msgError)
            return NextResponse.json({ error: msgError.message }, { status: 500 })
        }

        console.log(`[Webhook] Message inserted successfully from ${phone}`)
        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[Webhook] Global Error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
