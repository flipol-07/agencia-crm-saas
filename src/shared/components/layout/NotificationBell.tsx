'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotificationStore } from '@/shared/store/useNotificationStore'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
    const { totalUnread, unreadCounts, unreadDetails } = useNotificationStore()
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const dropdownRef = useRef<HTMLDivElement>(null)

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

    if (totalUnread === 0) return null

    const notifications = Object.entries(unreadCounts).map(([id, count]) => {
        const detail = unreadDetails[id] || { contactName: 'Desconocido', companyName: '' }
        return {
            id,
            count,
            ...detail
        }
    })

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
                    {totalUnread}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-950 border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100] backdrop-blur-xl">
                    <div className="p-3 border-b border-white/5 bg-white/5">
                        <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push(`/contacts/${item.id}`)
                                }}
                                className="p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0 flex items-center justify-between group"
                            >
                                <div className="min-w-0 flex-1 mr-3">
                                    <p className="text-sm font-medium text-white truncate max-w-[180px]">
                                        {item.contactName || item.companyName}
                                    </p>
                                    {item.companyName && item.companyName !== item.contactName && (
                                        <p className="text-xs text-zinc-500 truncate">{item.companyName}</p>
                                    )}
                                    <p className="text-xs text-lime-400 mt-1">
                                        {item.count} {item.count === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
                                    </p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-lime-500 group-hover:scale-125 transition-transform" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
