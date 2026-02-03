'use client'

import { useState, useEffect } from 'react'
import { teamChatService } from '../services/chatService'
import { TeamChatWithMembers } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UserSelectorModal } from './UserSelectorModal'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNotificationStore } from '@/shared/store/useNotificationStore'

export function ChatList() {
    const { user } = useAuth()
    const { clearTeam } = useNotificationStore()
    const params = useParams()
    const activeChatId = params?.chatId as string

    const [chats, setChats] = useState<TeamChatWithMembers[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewChat, setShowNewChat] = useState(false)

    const fetchChats = async () => {
        // Don't set loading true if refreshing?
        const data = await teamChatService.getChats()
        setChats(data)
        setLoading(false)
    }

    useEffect(() => {
        if (user) {
            fetchChats()
            clearTeam()

            // Subscribe to new chats or updates
            const supabase = createClient()
            const channel = supabase
                .channel('chat_list_updates')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'team_chats' // We should filter by participation ideally, but RLS on Select helps. Realtime filter is limited.
                }, () => {
                    fetchChats()
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'team_chat_participants',
                    filter: `user_id=eq.${user.id}`
                }, () => fetchChats())
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'team_messages'
                }, () => {
                    fetchChats() // Update last message preview
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user])

    const getOtherParticipant = (chat: TeamChatWithMembers) => {
        if (!user) return null
        return chat.participants.find(p => p.profiles?.id !== user.id)?.profiles
    }

    // Helper to get self if chat has no other participant (e.g. self chat)
    // Or handle groups later.
    const getChatDisplayInfo = (chat: TeamChatWithMembers) => {
        const other = getOtherParticipant(chat)
        if (other) return {
            name: other.full_name || other.email || 'Usuario',
            avatar: other.avatar_url,
            initial: (other.full_name || other.email || '?')[0].toUpperCase()
        }
        return null // Don't show if no other participant (unless group, handled later)
    }

    return (
        <div className="flex flex-col w-full h-full bg-transparent">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h1 className="font-bold text-lg text-white">Chats</h1>
                <button
                    onClick={() => setShowNewChat(true)}
                    className="p-2 bg-lime-500 text-black rounded-lg hover:bg-lime-400 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/5 rounded w-1/2" />
                                    <div className="h-3 bg-white/5 rounded w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No tienes conversaciones activas.</p>
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="text-lime-500 hover:underline mt-2 text-sm"
                        >
                            Comenzar un chat
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 space-y-1 p-2">
                        {chats.map(chat => {
                            const info = getChatDisplayInfo(chat)
                            if (!info) return null

                            const isActive = activeChatId === chat.id

                            return (
                                <Link
                                    key={chat.id}
                                    href={`/team-chat/${chat.id}`}
                                    className={`block p-3 rounded-xl transition-all ${isActive
                                        ? 'bg-lime-500/10 border border-lime-500/20'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden border ${isActive ? 'border-lime-500/50 text-lime-500 bg-lime-500/10' : 'border-white/10 bg-zinc-800 text-gray-400'}`}>
                                                {info.avatar ? (
                                                    <img src={info.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    info.initial
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className={`font-medium text-sm truncate ${isActive ? 'text-lime-400' : 'text-gray-200'}`}>
                                                    {info.name}
                                                </h3>
                                                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                                    {chat.updated_at && formatDistanceToNow(new Date(chat.updated_at), { addSuffix: false, locale: es })}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate ${isActive ? 'text-lime-500/70' : 'text-gray-500'}`}>
                                                {chat.last_message_preview || 'Nueva conversación'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            <UserSelectorModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
        </div>
    )
}
