'use client'

import { useState, useEffect } from 'react'
import { teamChatService } from '../services/chatService'
import { Profile } from '@/types/database'
import { useRouter } from 'next/navigation'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export function UserSelectorModal({ isOpen, onClose }: Props) {
    const [query, setQuery] = useState('')
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            searchUsers('')
        }
    }, [isOpen])

    const searchUsers = async (q: string) => {
        setLoading(true)
        const results = await teamChatService.searchUsers(q)
        setUsers(results)
        setLoading(false)
    }

    const handleSelectUser = async (userId: string) => {
        setCreating(true)
        try {
            const chatId = await teamChatService.createOrGetChat(userId)
            onClose()
            router.push(`/team-chat/${chatId}`)
        } catch (error) {
            console.error('Failed to create chat', error)
        } finally {
            setCreating(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Nuevo Chat</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="p-4 border-b border-white/10">
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            searchUsers(e.target.value)
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#8b5cf6] outline-none"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Cargando...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No se encontraron usuarios</div>
                    ) : (
                        <div className="space-y-1">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user.id)}
                                    disabled={creating}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] flex items-center justify-center font-bold text-lg overflow-hidden relative">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            (user.full_name || user.email || '?')[0].toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">
                                            {user.full_name || 'Sin Nombre'}
                                        </div>
                                        <div className="text-gray-500 text-xs truncate">
                                            {user.email}
                                        </div>
                                    </div>
                                    {user.billing_name && (
                                        <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                            CRM
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
