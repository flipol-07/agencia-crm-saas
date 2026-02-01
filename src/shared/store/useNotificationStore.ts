import { create } from 'zustand'

interface NotificationState {
    unreadCounts: Record<string, number> // contactId -> count
    totalUnread: number
    setCounts: (counts: Record<string, number>) => void
    increment: (contactId: string) => void
    clear: (contactId: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
    unreadCounts: {},
    totalUnread: 0,
    setCounts: (counts) => set({
        unreadCounts: counts,
        totalUnread: Object.values(counts).reduce((a, b) => a + b, 0)
    }),
    increment: (contactId) => set((state) => {
        const newCount = (state.unreadCounts[contactId] || 0) + 1
        const newCounts = { ...state.unreadCounts, [contactId]: newCount }
        return {
            unreadCounts: newCounts,
            totalUnread: state.totalUnread + 1
        }
    }),
    clear: (contactId) => set((state) => {
        const currentCount = state.unreadCounts[contactId] || 0
        const newCounts = { ...state.unreadCounts }
        delete newCounts[contactId]
        return {
            unreadCounts: newCounts,
            totalUnread: Math.max(0, state.totalUnread - currentCount)
        }
    })
}))
