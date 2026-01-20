import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks'

interface ChatFeedProps {
    contactId: string
    contactPhone: string | null
}

import { MessageBubble } from './MessageBubble'

export function ChatFeed({ contactId, contactPhone }: ChatFeedProps) {
    const { messages, loading, sending, sendMessage } = useChat(contactId, contactPhone)
    const [newMessage, setNewMessage] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll al fondo al recibir mensajes
    useEffect(() => {
        if (scrollRef.current) {
            // Pequeño timeout para asegurar que el DOM se pintó
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                }
            }, 50)
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        // Guardar texto actual y limpiar input inmediatamente (UX)
        const textToSend = newMessage
        setNewMessage('')

        try {
            await sendMessage(textToSend)
        } catch (error) {
            console.error('Failed to send:', error)
            setNewMessage(textToSend) // Restaurar si falla
            alert('Error enviando mensaje')
        }
    }

    return (
        <div className="flex flex-col h-[600px] bg-[#0b141a] rounded-xl overflow-hidden shadow-2xl border border-white/10 relative">
            {/* Background Image Pattern */}
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png')] pointer-events-none" />

            {/* Header (opcional si ya está en la layout columna) */}
            <div className="bg-[#202c33] p-3 flex items-center gap-3 border-b border-white/5 z-10">
                <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-300">
                    👤
                </div>
                <div>
                    <p className="font-medium text-white text-sm">
                        {contactPhone || 'Sin teléfono'}
                    </p>
                    {/* <p className="text-xs text-gray-400">En línea</p> */}
                </div>
            </div>

            {/* Messages Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="text-sm bg-[#202c33] px-3 py-1 rounded-lg text-[#8696a0]">
                            🔒 Los mensajes están cifrados de extremo a extremo.
                        </p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="bg-[#202c33] p-2 z-10">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                    {/* Botón Adjuntar Mock */}
                    <button type="button" className="p-3 text-[#8696a0] hover:text-white transition-colors">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.646 3.972 1.646h13.75c1.5 0 2.912-.584 3.972-1.646s1.646-2.472 1.646-3.972c0-1.5-.584-2.912-1.646-3.972s-2.472-1.646-3.972-1.646h-7.584l2.449-2.424 1.414 1.414 1.414-1.414-3.803-3.766a1 1 0 0 0-1.414 0l-3.804 3.766 1.415 1.414 1.414-1.414 2.449 2.424H1.816Zm4.366-2.972c.532-3.003 3.144-5.284 6.242-5.284h7.584c.97 0 1.883.378 2.568 1.064s1.065 1.597 1.065 2.568-.379 1.882-1.065 2.568-1.597 1.065-2.568 1.065h-13.75c-.97 0-1.883-.378-2.568-1.065S2.625 12.534 2.625 11.563c0-.97.378-1.883 1.065-2.568.513-.513 1.15-.873 1.847-1.042l.645 1.947Z"></path>
                        </svg>
                    </button>

                    <input
                        type="text"
                        value={newMessage}
                        disabled={!contactPhone}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={contactPhone ? "Escribe un mensaje" : "Añade un teléfono para chatear"}
                        className="flex-1 bg-[#2a3942] text-white placeholder-[#8696a0] rounded-lg px-4 py-3 focus:outline-none border-none resize-none"
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending || !contactPhone}
                        className="p-3 bg-[#005c4b] text-white rounded-full hover:bg-[#007a63] disabled:opacity-50 disabled:bg-gray-600 transition-all flex-shrink-0"
                    >
                        {sending ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
