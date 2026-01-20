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
        console.log(`[Webhook] Event: ${event} received.`)

        // Log específico para mensajes
        if (event === 'messages.upsert') {
            console.log(`[Webhook] Message payload:`, JSON.stringify(payload.data, null, 2))
        }

        // Validar payload mínimo (adaptar según docs reales de Evolution API v2)
        // Nota: Evolution API tiene varios tipos de eventos (messages.upsert, etc)
        // Aquí asumimos una estructura genérica para el ejemplo

        // Extraer datos clave
        let phone = payload?.data?.key?.remoteJid || payload?.sender
        let content = payload?.data?.message?.conversation || payload?.data?.message?.extendedTextMessage?.text
        let messageId = payload?.data?.key?.id || payload?.data?.keyId

        if (!phone || !content) {
            console.log('Ignored webhook: No phone or content found')
            return NextResponse.json({ ok: true }) // Responder 200 siempre para no bloquear webhook
        }

        // Limpiar teléfono (quitar @s.whatsapp.net y cualquier signo +)
        const cleanPhone = phone.replace('@s.whatsapp.net', '').replace('+', '')

        const supabase = await createClient()

        // 1. Buscar contacto por teléfono (buscando que contenga el número limpio)
        let { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('id')
            .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.substring(2)}%`) // Busca con y sin prefijo
            .limit(1)
            .maybeSingle()

        if (!contact) {
            console.log(`Contact not found for phone: ${cleanPhone}. Creating automatic prospect.`)
            const { data: newContact, error: createError } = await supabase
                .from('contacts')
                .insert({
                    company_name: `WhatsApp ${cleanPhone}`,
                    contact_name: payload?.data?.pushName || `User ${cleanPhone}`,
                    phone: cleanPhone,
                    source: 'inbound_whatsapp',
                    status: 'prospect',
                    pipeline_stage: 'nuevo'
                })
                .select('id')
                .single()

            if (createError) {
                console.error('Error creating automatic contact:', createError)
                return NextResponse.json({ ok: true })
            }
            contact = newContact
        }

        // 2. Insertar mensaje en BD
        const { error: msgError } = await supabase
            .from('messages')
            .insert({
                contact_id: contact.id,
                content: content,
                direction: 'inbound',
                status: 'delivered',
                whatsapp_message_id: messageId,
                media_url: null, // TODO: Manejar media
            })

        if (msgError) {
            console.error('Error inserting message:', msgError)
            return NextResponse.json({ error: msgError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
