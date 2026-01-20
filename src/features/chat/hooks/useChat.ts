'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/database'
import { evolutionService } from '../services'

export function useChat(contactId: string, contactPhone: string | null) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    const supabase = createClient()
    const channelRef = useRef<any>(null)

    // Fetch inicial
    const fetchMessages = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setMessages(data)
        }
        setLoading(false)
    }, [contactId, supabase])

    // Subscripción Realtime
    useEffect(() => {
        fetchMessages()

        channelRef.current = supabase
            .channel(`chat:${contactId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `contact_id=eq.${contactId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages((prev) => [...prev, newMsg])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channelRef.current)
        }
    }, [contactId, fetchMessages, supabase])

    // Enviar mensaje
    const sendMessage = async (content: string) => {
        if (!contactPhone) throw new Error('El contacto no tiene teléfono')
        if (!content.trim()) return

        setSending(true)

        try {
            // 1. Enviar a Evolution API (Mock por ahora)
            const apiResult = await evolutionService.sendMessage(contactPhone, content)

            if (!apiResult.success) throw new Error('Error enviando a WhatsApp')

            // 2. Insertar en Supabase (esto disparará el realtimeEvent también, pero podemos usar optimistic UI)
            // Nota: Si insertamos aquí y luego llega por realtime, podríamos tener duplicados momentáneos 
            // si no manejamos bien las keys. Sin embargo, como el INSERT devuelve el ID real, es mejor esperar el INSERT DB.

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    contact_id: contactId,
                    content: content,
                    direction: 'outbound',
                    status: 'sent',
                    whatsapp_message_id: apiResult.id,
                    // sender_name: 'Yo', // TODO: Coger del user context
                })
                .select()
                .single()

            if (error) throw error

            // No necesitamos hacer setMessages aquí porque el Realtime lo hará
            // Pero para feedback instantáneo (Optimistic) podríamos hacerlo si realtime tiene delay

            return data
        } catch (error) {
            console.error('Error sending message:', error)
            throw error
        } finally {
            setSending(false)
        }
    }

    return {
        messages,
        loading,
        sending,
        sendMessage,
    }
}
