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
        const event = payload?.event || 'unknown'

        // Log para depuración en Vercel
        console.log(`[Webhook] Event: ${event}`, JSON.stringify(payload, null, 2))

        // Solo procesamos inserción de mensajes
        if (event !== 'messages.upsert') {
            return NextResponse.json({ ok: true })
        }

        const messageData = payload.data?.message || payload.data
        if (!messageData) return NextResponse.json({ ok: true })

        // Extraer datos clave
        // Evolution v2 usa key.remoteJid para el destinatario/remitente
        const remoteJid = payload.data?.key?.remoteJid || payload.sender
        if (!remoteJid) return NextResponse.json({ ok: true })

        const phone = remoteJid.replace('@s.whatsapp.net', '').replace('+', '')

        // El contenido puede venir en varios campos según el tipo de mensaje
        const content =
            payload.data?.message?.conversation ||
            payload.data?.message?.extendedTextMessage?.text ||
            payload.data?.message?.imageMessage?.caption ||
            payload.data?.message?.videoMessage?.caption ||
            '';

        const messageId = payload.data?.key?.id

        // Si es un mensaje nuestro (fromMe: true), lo ignoramos para evitar bucles 
        // o lo marcamos como outbound si queremos sincronizar lo enviado desde fuera del CRM
        if (payload.data?.key?.fromMe) {
            console.log('Ignoring outbound message from WhatsApp Web/Mobile')
            return NextResponse.json({ ok: true })
        }

        const supabase = await createClient()

        // 1. Buscar o crear contacto
        let { data: contact } = await supabase
            .from('contacts')
            .select('id')
            .or(`phone.ilike.%${phone}%,phone.ilike.%${phone.substring(2)}%`)
            .maybeSingle()

        if (!contact) {
            const { data: newContact, error: errorCur } = await supabase
                .from('contacts')
                .insert({
                    company_name: `WhatsApp ${phone}`,
                    contact_name: payload.data?.pushName || `User ${phone}`,
                    phone: phone,
                    source: 'inbound_whatsapp',
                    status: 'prospect',
                    pipeline_stage: 'nuevo'
                })
                .select('id')
                .single()

            if (errorCur) throw errorCur
            contact = newContact
        }

        // 2. Insertar mensaje como INBOUND
        const { error: msgError } = await supabase
            .from('messages')
            .insert({
                contact_id: contact.id,
                content: content,
                direction: 'inbound',
                status: 'delivered',
                whatsapp_message_id: messageId,
                payload: payload.data // Guardamos todo por si acaso
            })

        if (msgError) throw msgError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Webhook error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
