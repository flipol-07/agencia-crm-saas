'use client'

import { useState, useEffect } from 'react'
import { teamChatService } from '../services/chatService'
import { TeamChatWithMembers } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UserSelectorModal } from './UserSelectorModal'
import { CreateGroupModal } from './CreateGroupModal'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNotificationStore } from '@/shared/store/useNotificationStore'

export function ChatList() {
    const { user } = useAuth()
    const { clearTeam } = useNotificationStore()
    const params = useParams()
    const activeChatId = params?.chatId as string

    const [chats, setChats] = useState<(TeamChatWithMembers & { unread_count: number })[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewChat, setShowNewChat] = useState(false)
    const [showNewGroup, setShowNewGroup] = useState(false)

    const fetchChats = async () => {
        const data = await teamChatService.getChats()
        setChats(data)
        setLoading(false)
    }

    useEffect(() => {
        if (user) {
            fetchChats()
            clearTeam()

            const supabase = createClient()
            const channel = supabase
                .channel('chat_list_updates')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'team_chats'
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
                    event: '*',
                    schema: 'public',
                    table: 'team_messages'
                }, (payload: any) => {
                    console.log('Realtime update:', payload)
                    fetchChats()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user])

    const getOtherParticipant = (chat: TeamChatWithMembers & { unread_count: number }) => {
        if (!user) return null
        return chat.participants.find(p => p.profiles?.id !== user.id)?.profiles
    }

    const getChatDisplayInfo = (chat: TeamChatWithMembers & { unread_count: number }) => {
        if (chat.is_group) {
            return {
                name: chat.name || 'Grupo sin nombre',
                avatar: chat.avatar_url,
                initial: (chat.name || 'G')[0].toUpperCase(),
                isGroup: true
            }
        }

        const other = getOtherParticipant(chat)
        if (other) return {
            name: other.full_name || other.email || 'Usuario',
            avatar: other.avatar_url,
            initial: (other.full_name || other.email || '?')[0].toUpperCase(),
            isGroup: false
        }
        return null
    }

    return (
        <div className="flex flex-col w-full h-full bg-transparent">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h1 className="font-bold text-lg text-white">Chats</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowNewGroup(true)}
                        className="p-2 bg-zinc-800 text-gray-400 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                        title="Nuevo Grupo"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowNewChat(true)}
                        className="p-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
                        title="Nuevo Chat Individual"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
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
                            className="text-[#8b5cf6] hover:underline mt-2 text-sm"
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
                                        ? 'bg-[#8b5cf6]/10 border border-[#8b5cf6]/20'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden border ${isActive ? 'border-[#8b5cf6]/50 text-[#8b5cf6] bg-[#8b5cf6]/10' : 'border-white/10 bg-zinc-800 text-gray-400'}`}>
                                                {info.avatar ? (
                                                    <img src={info.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : info.isGroup ? (
                                                    <span className="text-xs">GRP</span>
                                                ) : (
                                                    info.initial
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className={`font-medium text-sm truncate ${isActive ? 'text-[#a78bfa]' : chat.unread_count > 0 ? 'text-white font-bold' : 'text-gray-200'}`}>
                                                    {info.name}
                                                </h3>
                                                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                                    {chat.updated_at && formatDistanceToNow(new Date(chat.updated_at), { addSuffix: false, locale: es })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className={`text-xs truncate ${isActive ? 'text-[#8b5cf6]/70' : chat.unread_count > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                                                    {chat.last_message_preview || 'Nueva conversación'}
                                                </p>
                                                {chat.unread_count > 0 && (
                                                    <span className="bg-[#8b5cf6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                                                        {chat.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            <UserSelectorModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
            {showNewGroup && (
                <CreateGroupModal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} />
            )}
        </div >
    )
}
