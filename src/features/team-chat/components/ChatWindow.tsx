'use client'

import { useState, useEffect, useRef } from 'react'
import { teamChatService } from '../services/chatService'
import { TeamMessage, Profile } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { markChatAsRead } from '../actions/chat-actions'

interface Props {
    chatId: string
}

export function ChatWindow({ chatId }: Props) {
    const { user } = useAuth()
    const { clearTeam } = useNotificationStore()
    const [messages, setMessages] = useState<TeamMessage[]>([])
    const [chatInfo, setChatInfo] = useState<{ name: string, avatar: string | null } | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (!user) return
        loadData()
        clearTeam()

        // Realtime subscription
        const supabase = createClient()
        const channel = supabase
            .channel(`chat_${chatId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'team_messages',
                filter: `chat_id=eq.${chatId}`
            }, (payload: { new: TeamMessage }) => {
                const newMsg = payload.new
                if (newMsg.sender_id !== user.id) {
                    markChatAsRead(chatId)
                    clearTeam()
                }

                setMessages(prev => {
                    // Avoid duplicates if optimistic update adds generic ID vs real
                    if (prev.some(m => m.id === newMsg.id)) return prev
                    return [...prev, newMsg]
                })
                setTimeout(scrollToBottom, 100)
            })
            .subscribe()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [chatId, user])

    const loadData = async () => {
        setLoading(true)
        const [msgs, chat] = await Promise.all([
            teamChatService.getMessages(chatId),
            teamChatService.getChat(chatId)
        ])
        setMessages(msgs)
        markChatAsRead(chatId)

        if (chat && user) {
            const other = chat.participants.find(p => p.profiles?.id !== user.id)?.profiles
            if (other) {
                setChatInfo({
                    name: other.full_name || other.email || 'Usuario',
                    avatar: other.avatar_url
                })
            } else {
                setChatInfo({ name: 'Chat', avatar: null })
            }
        }

        setLoading(false)
        setTimeout(scrollToBottom, 200)
    }

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() || sending) return

        const content = newMessage.trim()
        setNewMessage('')
        setSending(true)

        // Optimistic
        const tempId = Math.random().toString()
        const optimisticMsg: TeamMessage = {
            id: tempId,
            chat_id: chatId,
            sender_id: user?.id || null,
            content: content,
            created_at: new Date().toISOString(),
            read_at: null
        }

        setMessages(prev => [...prev, optimisticMsg])
        scrollToBottom()

        try {
            await teamChatService.sendMessage(chatId, content)
            // Remove optimistic will happen when real message arrives or we replace it logic.
            // For now, let's just leave it, assuming lists key won't conflict heavily until refresh.
            // Better: Filter out tempId if we confirm send?
            setMessages(prev => prev.filter(m => m.id !== tempId))
        } catch (error) {
            console.error(error)
            alert('Error enviando mensaje')
            setMessages(prev => prev.filter(m => m.id !== tempId))
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Cargando conversación...</div>

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/20">
                <Link href="/team-chat" className="md:hidden text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>

                <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center overflow-hidden border border-white/10">
                    {chatInfo?.avatar ? (
                        <img src={chatInfo.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[#8b5cf6] font-bold">{chatInfo?.name?.[0]?.toUpperCase() || '#'}</span>
                    )}
                </div>
                <div>
                    <h2 className="font-bold text-white leading-tight">{chatInfo?.name || 'Cargando...'}</h2>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isMe = msg.sender_id === user?.id
                    const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id)

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start mb-2'}`}>
                            <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2 relative shadow-sm ${isMe
                                ? 'bg-[#8b5cf6] text-white rounded-tr-none'
                                : 'bg-zinc-800 text-white rounded-tl-none border border-white/5'
                                }`}>
                                <p className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                    {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                                    {isMe && (
                                        <span className="ml-1">
                                            {msg.read_at ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-900 border-t border-white/10">
                <form onSubmit={handleSend} className="flex gap-2 items-end max-w-4xl mx-auto">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl flex items-center p-1 focus-within:ring-1 focus-within:ring-[#8b5cf6]/50 focus-within:border-[#8b5cf6]/50 transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe un mensaje..."
                            className="w-full bg-transparent border-none text-white px-4 py-3 max-h-32 min-h-[44px] focus:ring-0 resize-none scrollbar-hide placeholder:text-gray-500"
                            rows={1}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-[#8b5cf6] text-white p-3 rounded-xl hover:bg-[#7c3aed] disabled:opacity-50 disabled:hover:bg-[#8b5cf6] transition-all flex-shrink-0"
                    >
                        {sending ? (
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
