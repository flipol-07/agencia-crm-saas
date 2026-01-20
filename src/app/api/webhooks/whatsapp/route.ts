import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const payload = await request.json()
        const event = (payload?.event || 'unknown').toLowerCase()
        const data = payload.data

        console.log(`[Webhook] Event: ${event}`)
        // console.log(`[Webhook] Data Keys:`, Object.keys(data || {}))

        // 1. Identificar si es un mensaje
        const isUpsert = event.includes('upsert')
        const hasMessage = !!(data?.message)

        if (!isUpsert && !hasMessage) {
            console.log(`[Webhook] Event ignored: ${event} (No upsert and no message data)`)
            return NextResponse.json({ ok: true })
        }

        // 2. Extraer teléfono y contenido (lógica unificada)
        const remoteJid = data?.key?.remoteJid || payload.sender || ''
        const phone = remoteJid.split('@')[0].replace(/\D/g, '')

        if (!phone) {
            console.log('[Webhook] ERROR: No phone found in remoteJid', remoteJid)
            return NextResponse.json({ ok: true })
        }

        const message = data?.message || {}
        const content =
            message.conversation ||
            message.extendedTextMessage?.text ||
            message.imageMessage?.caption ||
            message.videoMessage?.caption ||
            '';

        console.log(`[Webhook] Processing Message from ${phone}. Content length: ${content.length}`)

        const supabase = createClient()

        // 3. Buscar o crear contacto
        const phoneSuffix = phone.slice(-9)
        const { data: existingContact, error: searchError } = await (supabase
            .from('contacts')
            .select('id')
            .filter('phone', 'ilike', `%${phoneSuffix}%`)
            .maybeSingle() as any)

        if (searchError) console.error('[Webhook] DB Search Error:', searchError)

        let contactId = (existingContact as any)?.id

        if (!contactId) {
            console.log(`[Webhook] Contact not found (${phoneSuffix}), creating...`)
            const { data: newContact, error: createError } = await (supabase
                .from('contacts')
                .insert({
                    company_name: `WhatsApp ${phone}`,
                    contact_name: data?.pushName || `User ${phone}`,
                    phone: phone,
                    source: 'inbound_whatsapp',
                    status: 'prospect',
                    pipeline_stage: 'nuevo'
                } as any) as any)
                .select('id')
                .single()

            if (createError || !newContact) {
                console.error('[Webhook] DB Contact Create Error:', createError)
                return NextResponse.json({ ok: true })
            }
            contactId = newContact.id
        }

        if (!contactId) return NextResponse.json({ ok: true })

        // Detectar dirección
        const isFromMe = data?.key?.fromMe || false
        const direction = isFromMe ? 'outbound' : 'inbound'
        const status = isFromMe ? 'sent' : 'delivered'

        // 4. Insertar mensaje (o actualizar si ya existe por ID)
        console.log(`[Webhook] Upserting message (${direction}) for contact_id: ${contactId}`)

        const { error: msgError } = await (supabase
            .from('messages')
            .upsert({
                contact_id: contactId,
                content: content,
                direction: direction,
                status: status,
                whatsapp_message_id: data?.key?.id || data?.messageId,
                payload: data
            }, {
                onConflict: 'whatsapp_message_id',
                ignoreDuplicates: true
            } as any) as any)

        if (msgError) {
            console.error('[Webhook] DB Message Insert Error:', msgError)
            return NextResponse.json({ error: msgError.message }, { status: 500 })
        }

        console.log(`[Webhook] SUCCESS: Message stored for ${phone}`)
        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[Webhook] FATAL ERROR:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
