'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
    const { totalUnread, unreadCounts, unreadDetails, teamUnread } = useNotificationStore()
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const actualTotal = totalUnread + teamUnread

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (actualTotal === 0) return null

    const notifications = Object.entries(unreadCounts).map(([id, count]) => {
        const detail = unreadDetails[id] || { contactName: 'Desconocido', companyName: '' }
        return {
            id,
            count,
            type: 'email',
            ...detail
        }
    })

    if (teamUnread > 0) {
        notifications.unshift({
            id: 'team-chat',
            count: teamUnread,
            type: 'team',
            contactName: 'Chat de Equipo',
            companyName: 'Mensaje interno'
        })
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-all group rounded-lg hover:bg-white/5"
            >
                <svg className="w-6 h-6 group-hover:text-lime-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-black animate-in zoom-in duration-300">
                    {actualTotal}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-950 border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100] backdrop-blur-xl">
                    <div className="p-3 border-b border-white/5 bg-white/5">
                        <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.map((item: any) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setIsOpen(false)
                                    if (item.type === 'team') {
                                        router.push('/team-chat')
                                    } else {
                                        router.push(`/contacts/${item.id}`)
                                    }
                                }}
                                className="p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0 flex items-center justify-between group"
                            >
                                <div className="min-w-0 flex-1 mr-3 flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${item.type === 'team' ? 'bg-blue-500/20 text-blue-400' : 'bg-lime-500/20 text-lime-400'}`}>
                                        {item.type === 'team' ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate max-w-[180px]">
                                            {item.contactName || item.companyName}
                                        </p>
                                        {item.companyName && item.companyName !== item.contactName && (
                                            <p className="text-xs text-zinc-500 truncate">{item.companyName}</p>
                                        )}
                                        <p className={`text-xs mt-1 ${item.type === 'team' ? 'text-blue-400' : 'text-lime-400'}`}>
                                            {item.count} {item.count === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`h-2 w-2 rounded-full ${item.type === 'team' ? 'bg-blue-500' : 'bg-lime-500'} group-hover:scale-125 transition-transform`} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
