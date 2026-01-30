
import { createClient } from '@/lib/supabase/client'

import type { EvolutionConfig } from '@/features/settings/services/settingsService'

export const syncService = {
    async syncEverything(config: EvolutionConfig, onProgress?: (msg: string) => void) {
        const supabase = createClient()
        const { baseUrl, apiKey, instanceName } = config

        // Helper para fetch
        const fetchEvo = async (endpoint: string) => {
            const url = `${baseUrl.replace(/\/$/, '')}/${endpoint}`
            const headers = { 'apikey': apiKey }
            const res = await fetch(url, { headers })
            if (!res.ok) throw new Error(`Evolution API Error ${res.status}: ${await res.text()}`)
            return res.json()
        }

        // 1. Obtener Chats (Contactos)
        if (onProgress) onProgress('Obteniendo chats de WhatsApp...')

        // Endpoint typical v2: /chat/findContacts/{instance}
        // Nota: El endpoint exacto depende de la versión. Usualmente es /chat/findContacts o /chat/fetchContacts
        const chatsData = await fetchEvo(`chat/findContacts/${instanceName}`)
        const chats = Array.isArray(chatsData) ? chatsData : (chatsData.data || [])

        if (onProgress) onProgress(`Encontrados ${chats.length} chats. Sincronizando contactos...`)

        let processedCount = 0

        for (const chat of chats) {
            // Datos del chat
            // remoteJid: user id (raw)
            // name: nombre mostrar
            // pushName: nombre push
            // picture: url avatar
            const phone = chat.id?.replace('@s.whatsapp.net', '') || chat.remoteJid?.replace('@s.whatsapp.net', '')
            if (!phone || phone.includes('@g.us')) continue // Saltamos grupos por ahora

            const name = chat.name || chat.pushName || phone

            // Upsert Contacto
            // Buscamos primero si existe por teléfono
            const { data: existing } = await (supabase.from('contacts') as any)
                .select('id')
                .eq('phone', phone)
                .single()

            let contactId = existing?.id

            if (!contactId) {
                const { data: newContact, error } = await (supabase.from('contacts') as any)
                    .insert({
                        company_name: name, // Usamos nombre como empresa por defecto
                        contact_name: name,
                        phone: phone,
                        source: 'inbound_whatsapp',
                        status: 'prospect',
                        pipeline_stage: 'nuevo'
                    })
                    .select('id')
                    .single()

                if (error) {
                    console.error('Error creando contacto:', error)
                    continue
                }
                contactId = newContact.id
            }

            // Sincronizar mensajes recientes si es necesario
            // (Para el MVP masivo, tal vez solo creamos contactos. Sincronizar CADA mensaje histórico puede ser lento)
            // OPCIONAL: Traer últimos 10 mensajes

            processedCount++
        }

        if (onProgress) onProgress(`Sincronizados ${processedCount} contactos.`)
        return { syncedContacts: processedCount }
    }
}
