'use server'

import { createClient } from '@/lib/supabase/server'
import type { EvolutionConfig } from '@/features/settings/services/settingsService'

export async function syncEvolutionData(config: EvolutionConfig) {
    try {
        // 1. Configuración: Prioridad ENV > Argumentos
        const baseUrl = process.env.EVOLUTION_API_URL || config.baseUrl
        const apiKey = process.env.EVOLUTION_API_KEY || config.apiKey
        const instanceName = process.env.EVOLUTION_INSTANCE_NAME || config.instanceName

        // Normalizar URL (quitar slash final si tiene)
        const cleanUrl = baseUrl?.replace(/\/$/, '')

        if (!cleanUrl || !apiKey || !instanceName) {
            throw new Error('Configuración incompleta. Revisa las variables de entorno o la configuración.')
        }

        console.log(`[Server Action] Syncing with Evolution API: ${cleanUrl}, Instance: ${instanceName}`)

        // 2. Fetch Chats desde Evolution
        // Intentamos /chat/findChats que es el endpoint para listar conversaciones activas
        const response = await fetch(`${cleanUrl}/chat/findChats/${instanceName}`, {
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
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
