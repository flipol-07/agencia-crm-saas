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
        console.log('Webhook received:', JSON.stringify(payload, null, 2))

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

        // Limpiar teléfono (quitar @s.whatsapp.net)
        const cleanPhone = phone.replace('@s.whatsapp.net', '')

        const supabase = await createClient()

        // 1. Buscar contacto por teléfono
        // Nota: En producción esto debe ser super robusto (normalización de prefijos, etc)
        // Aquí asumimos coincidencia exacta para el MVP
        const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('id')
            .eq('phone', cleanPhone)
            .single()

        if (contactError || !contact) {
            console.log(`Contact not found for phone: ${cleanPhone}`)
            // TODO: Crear contacto desconocido o usar log de "mensajes huérfanos"
            // PENDIENTE: Decisión de negocio -> ¿Creamos lead automático?
            return NextResponse.json({ ok: true })
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
