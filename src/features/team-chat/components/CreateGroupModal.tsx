'use client'

import { useState, useEffect } from 'react'
import { teamChatService } from '../services/chatService'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTeamMembers } from '@/features/tasks/hooks'

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
    const [searchQuery, setSearchQuery] = useState('')
    // Use Pick to allow partial profile objects returned by useTeamMembers
    type MemberProfile = Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>
    const [searchResults, setSearchResults] = useState<MemberProfile[]>([])
    const [selectedUsers, setSelectedUsers] = useState<MemberProfile[]>([])
    const [groupName, setGroupName] = useState('')
    const [loading, setLoading] = useState(false)
    const { members, loading: loadingMembers } = useTeamMembers()
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setSearchResults(members)
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = members.filter(member =>
                (member.full_name?.toLowerCase() || '').includes(query) ||
                member.email.toLowerCase().includes(query)
            )
            setSearchResults(filtered)
        }
    }, [searchQuery, members])

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return

        try {
            setLoading(true)
            const participantIds = selectedUsers.map(u => u.id)
            // Add self if not included (though service handles logic, usually UI assumes self is part)
            // The service requires participant IDs.

            const chatId = await teamChatService.createGroupChat(groupName, participantIds)

            onClose()
            router.push(`/team-chat/${chatId}`)
        } catch (error) {
            console.error('Error creating group:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleUser = (user: MemberProfile) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
        } else {
            setSelectedUsers([...selectedUsers, user])
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#18181b] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white">Nuevo Grupo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {/* Group Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Grupo</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#8b5cf6]"
                            placeholder="Ej: Equipo Marketing"
                            autoFocus
                        />
                    </div>

                    {/* User Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Añadir Participantes</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#8b5cf6]"
                            placeholder="Buscar personas..."
                        />
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-1 bg-[#8b5cf6]/20 text-[#a78bfa] px-2 py-1 rounded-full text-sm border border-[#8b5cf6]/30">
                                    <span>{user.full_name || user.email}</span>
                                    <button onClick={() => toggleUser(user)} className="hover:text-white">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-1 mt-2">
                        {loadingMembers ? (
                            <div className="text-center text-gray-500 py-4">Cargando usuarios...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(profile => {
                                // Skip current user in the list to avoid adding self
                                if (profile.id === user?.id) return null

                                const isSelected = selectedUsers.some(u => u.id === profile.id)
                                return (
                                    <button
                                        key={profile.id}
                                        onClick={() => toggleUser(profile)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isSelected ? 'bg-[#8b5cf6]/20' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-300">
                                                    {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">
                                                {profile.full_name || 'Usuario'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{profile.email}</div>
                                        </div>
                                        {isSelected && (
                                            <div className="text-[#8b5cf6]">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                )
                            })
                        ) : (
                            <div className="text-center text-gray-500 py-4">No se encontraron usuarios</div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreateGroup}
                        disabled={loading || !groupName.trim() || selectedUsers.length === 0}
                        className="px-4 py-2 bg-[#8b5cf6] text-white rounded-lg text-sm font-medium hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creando...
                            </>
                        ) : (
                            'Crear Grupo'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
