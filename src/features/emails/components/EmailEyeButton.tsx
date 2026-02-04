'use client'

import { useState } from 'react'
import { markEmailAsRead, markEmailAsUnread } from '../actions/read-status'
import { toast } from 'sonner'
import { useNotificationStore } from '@/shared/store/useNotificationStore'

interface EmailEyeButtonProps {
    emailId: string
    isRead: boolean
    contactId?: string // Needed for local store update
    onToggle?: (newState: boolean) => void
}

export function EmailEyeButton({ emailId, isRead: initialIsRead, contactId, onToggle }: EmailEyeButtonProps) {
    const [isRead, setIsRead] = useState(initialIsRead)
    const [loading, setLoading] = useState(false)
    const { decrement, increment } = useNotificationStore()

    const toggleRead = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (loading) return

        const newState = !isRead
        setLoading(true)

        // Optimistic update
        setIsRead(newState)
        onToggle?.(newState)

        if (newState) {
            // Marking as READ
            if (contactId) decrement(contactId) // Reduce count immediately
            const res = await markEmailAsRead(emailId)
            if (!res.success) {
                // Revert
                setIsRead(!newState)
                onToggle?.(!newState)
                if (contactId) increment(contactId) // Revert count
                toast.error('Error al marcar como leído')
            }
        } else {
            // Marking as UNREAD
            if (contactId) increment(contactId) // Increase count immediately
            const res = await markEmailAsUnread(emailId)
            if (!res.success) {
                // Revert
                setIsRead(!newState)
                onToggle?.(!newState)
                if (contactId) decrement(contactId) // Revert count
                toast.error('Error al marcar como no leído')
            }
        }

        setLoading(false)
    }

    return (
        <button
            onClick={toggleRead}
            disabled={loading}
            className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isRead
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    : 'text-[#8b5cf6] hover:text-[#a78bfa] bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20'
                }`}
            title={isRead ? "Marcar como no leído" : "Marcar como leído"}
        >
            {isRead ? (
                // Open Eye (Seen)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ) : (
                // Closed Eye (Unseen) - actually usually "Open Eye" means "Mark as read"?
                // Let's use:
                // If READ -> Show Open Eye (Dimmed)
                // If UNREAD -> Show Closed Eye (Bright) or "Mark as Read" icon?
                // Standard: 
                // Unread item -> Dot or Bold.
                // Read item -> Normal.
                // Button to Toggle:
                // If Read -> "Mark Unread" (Closed Eye?)
                // If Unread -> "Mark Read" (Open Eye)

                // Let's stick to the visual:
                // Is Read (Seen) -> Open Eye (Gray)
                // Is Not Read (Unseen) -> Eye with Slash? Or just Bright Open Eye?
                // User said "un boton de un ojo... para ver correos".
                // Let's use:
                // Read: Open Eye (Normal/Gray)
                // Unread: Closed Eye (Bright/Lime) or Eye with notification dot?

                // Let's try:
                // Read: Open Eye
                // Unread: Eye Off (Closed)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
            )}
        </button>
    )
}
