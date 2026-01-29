'use client'

import { useState, useRef, useEffect } from 'react'
import { useTeamMembers } from '../hooks'

interface TaskAssigneeSelectorProps {
    assignees: { user_id: string; profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null } }[]
    onAssign: (userId: string) => void
    onUnassign: (userId: string) => void
    disabled?: boolean
}

export function TaskAssigneeSelector({ assignees, onAssign, onUnassign, disabled }: TaskAssigneeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { members, loading } = useTeamMembers()

    const assignedIds = assignees.map(a => a.user_id)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return email[0].toUpperCase()
    }

    const handleToggle = (userId: string) => {
        if (assignedIds.includes(userId)) {
            onUnassign(userId)
        } else {
            onAssign(userId)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 
                    hover:bg-white/5 transition-all text-sm
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                {assignees.length > 0 ? (
                    <div className="flex -space-x-2">
                        {assignees.slice(0, 3).map((a) => (
                            <div
                                key={a.user_id}
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-black ring-2 ring-gray-900"
                                title={a.profiles.full_name || a.profiles.email}
                            >
                                {getInitials(a.profiles.full_name, a.profiles.email)}
                            </div>
                        ))}
                        {assignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-medium text-white ring-2 ring-gray-900">
                                +{assignees.length - 3}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-gray-500">Sin asignar</span>
                )}
                <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-56 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Asignar a</p>
                    </div>
                    {loading ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Cargando...</div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto">
                            {members.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleToggle(member.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-all
                                        ${assignedIds.includes(member.id) ? 'bg-lime-500/10' : 'hover:bg-white/5'}
                                    `}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-xs font-bold text-black">
                                        {getInitials(member.full_name, member.email)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {member.full_name || member.email.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                    </div>
                                    {assignedIds.includes(member.id) && (
                                        <svg className="w-5 h-5 text-lime-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Avatar group para mostrar asignados (versión readonly)
export function TaskAssigneeAvatars({ assignees }: { assignees: TaskAssigneeSelectorProps['assignees'] }) {
    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return email[0].toUpperCase()
    }

    if (assignees.length === 0) {
        return <span className="text-xs text-gray-500">Sin asignar</span>
    }

    return (
        <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((a) => (
                <div
                    key={a.user_id}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-black ring-2 ring-gray-900"
                    title={a.profiles.full_name || a.profiles.email}
                >
                    {getInitials(a.profiles.full_name, a.profiles.email)}
                </div>
            ))}
            {assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-medium text-white ring-2 ring-gray-900">
                    +{assignees.length - 3}
                </div>
            )}
        </div>
    )
}
