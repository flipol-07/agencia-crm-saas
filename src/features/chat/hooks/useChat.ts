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

        // Suscribirse a cambios en la tabla messages para este contacto
        const channel = supabase
            .channel(`public:messages:contact_id=eq.${contactId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `contact_id=eq.${contactId}`,
                },
                (payload) => {
                    console.log('Realtime message received:', payload.new)
                    const newMsg = payload.new as Message
                    setMessages((prev) => {
                        // Evitar duplicados si el optimismo ya lo insertó
                        if (prev.some(m => m.id === newMsg.id || (m.whatsapp_message_id && m.whatsapp_message_id === newMsg.whatsapp_message_id))) {
                            return prev
                        }
                        return [...prev, newMsg]
                    })
                }
            )
            .subscribe((status) => {
                console.log('Realtime status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [contactId, fetchMessages, supabase])

    // Enviar mensaje
    const sendMessage = async (content: string) => {
        if (!contactPhone) throw new Error('El contacto no tiene teléfono')
        if (!content.trim()) return

        setSending(true)

        // ID temporal para UI optimista
        const tempId = `temp-${Date.now()}`
        const optimisticMsg: Message = {
            id: tempId,
            contact_id: contactId,
            content: content,
            direction: 'outbound',
            status: 'sent',
            created_at: new Date().toISOString(),
            whatsapp_message_id: null,
            media_url: null,
            sender_name: 'Yo',
            sent_by: null
        }

        // Actualización optimista
        setMessages(prev => [...prev, optimisticMsg])

        try {
            // 1. Enviar a Evolution API real (vía Server Action)
            const apiResult = await evolutionService.sendMessage(contactPhone, content)

            if (!apiResult.success) {
                // Si falla la API, quitamos el mensaje de la lista
                setMessages(prev => prev.filter(m => m.id !== tempId))
                throw new Error(apiResult.error || 'Error enviando a WhatsApp')
            }

            // 2. Insertar en Supabase
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    contact_id: contactId,
                    content: content,
                    direction: 'outbound',
                    status: 'sent',
                    whatsapp_message_id: apiResult.id,
                })
                .select()
                .single()

            if (error) throw error

            // Reemplazar el mensaje optimista por el real (con ID de Supabase)
            setMessages(prev => prev.map(m => m.id === tempId ? data : m))

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
