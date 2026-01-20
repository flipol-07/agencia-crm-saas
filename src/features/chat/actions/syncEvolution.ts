'use server'

import { createClient } from '@/lib/supabase/server'
import type { EvolutionConfig } from '@/features/settings/services/settingsService'

export async function syncEvolutionData(config: EvolutionConfig) {
    try {
        const { baseUrl, apiKey, instanceName } = config

        // Normalizar URL (quitar slash final si tiene)
        const cleanUrl = baseUrl.replace(/\/$/, '')

        console.log(`[Server Action] Syncing with Evolution API: ${cleanUrl}, Instance: ${instanceName}`)

        // 1. Fetch Contactos/Chats desde Evolution (Server-to-Server request, no hay CORS/Mixed Content issues)
        // Endpoint: /chat/findContacts/{instance}
        const response = await fetch(`${cleanUrl}/chat/findContacts/${instanceName}`, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            },
            cache: 'no-store' // No cachear
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Error Evolution API (${response.status}): ${errorText}`)
        }

        const chatsData = await response.json()
        // Algunos endpoints devuelven array directo, otros { data: [...] }
        const chats = Array.isArray(chatsData) ? chatsData : (chatsData || [])

        console.log(`[Server Action] Chats found: ${chats.length}`)

        // 2. Insertar en Supabase
        const supabase = await createClient()
        let processedCount = 0

        for (const chat of chats) {
            // Extraer teléfono
            // id suele ser "123456789@s.whatsapp.net"
            const rawId = chat.id || chat.remoteJid
            if (!rawId) continue

            // Ignorar grupos (@g.us) y broadcasts (@broadcast)
            if (rawId.includes('@g.us') || rawId.includes('@broadcast') || rawId === 'status@broadcast') continue

            const phone = rawId.replace('@s.whatsapp.net', '')
            const name = chat.name || chat.pushName || chat.screenName || phone // Intentar coger nombre real

            // Upsert Contacto
            // Primero miramos si existe para no machacar datos existentes si no queremos
            const { data: existing } = await supabase
                .from('contacts')
                .select('id')
                .eq('phone', phone)
                .single()

            if (!existing) {
                // Crear nuevo
                await supabase.from('contacts').insert({
                    company_name: name || `WhatsApp ${phone}`, // Fallback name
                    contact_name: name,
                    phone: phone,
                    source: 'inbound_whatsapp',
                    status: 'prospect',
                    pipeline_stage: 'nuevo'
                })
                processedCount++
            }
        }

        return { success: true, count: processedCount, totalFound: chats.length }

    } catch (error: any) {
        console.error('[Server Action Error]', error)
        return { success: false, error: error.message }
    }
}
