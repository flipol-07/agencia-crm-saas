import { create } from 'zustand'

interface NotificationDetail {
    contactName: string
    companyName: string
}

interface NotificationState {
    unreadCounts: Record<string, number> // contactId -> count
    unreadDetails: Record<string, NotificationDetail> // contactId -> details
    totalUnread: number
    teamUnread: number
    setCounts: (counts: Record<string, number>, details?: Record<string, NotificationDetail>) => void
    increment: (contactId: string, detail?: NotificationDetail) => void
    decrement: (contactId: string) => void
    clear: (contactId: string) => void
    incrementTeam: () => void
    clearTeam: () => void
    setTeamUnread: (count: number) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
    unreadCounts: {},
    unreadDetails: {},
    totalUnread: 0,
    setCounts: (counts, details) => set((state) => ({
        unreadCounts: counts,
        unreadDetails: details || state.unreadDetails,
        totalUnread: Object.values(counts).reduce((a, b) => a + b, 0)
    })),
    increment: (contactId, detail) => set((state) => {
        const newCount = (state.unreadCounts[contactId] || 0) + 1
        const newCounts = { ...state.unreadCounts, [contactId]: newCount }
        const newDetails = detail ? { ...state.unreadDetails, [contactId]: detail } : state.unreadDetails

        return {
            unreadCounts: newCounts,
            unreadDetails: newDetails,
            totalUnread: state.totalUnread + 1
        }
    }),
    decrement: (contactId) => set((state) => {
        const currentCount = state.unreadCounts[contactId] || 0
        if (currentCount <= 0) return state

        const newCount = currentCount - 1
        const newCounts = { ...state.unreadCounts }

        if (newCount === 0) {
            delete newCounts[contactId]
        } else {
            newCounts[contactId] = newCount
        }

        return {
            unreadCounts: newCounts,
            totalUnread: Math.max(0, state.totalUnread - 1)
        }
    }),
    clear: (contactId) => set((state) => {
        const currentCount = state.unreadCounts[contactId] || 0
        const newCounts = { ...state.unreadCounts }
        delete newCounts[contactId]

        // Optional: clear details too? Not strictly necessary but cleaner
        // const newDetails = { ...state.unreadDetails }
        // delete newDetails[contactId]

        return {
            unreadCounts: newCounts,
            // unreadDetails: newDetails,
            totalUnread: Math.max(0, state.totalUnread - currentCount)
        }
    }),
    teamUnread: 0,
    incrementTeam: () => set((state) => ({ teamUnread: state.teamUnread + 1 })),
    clearTeam: () => set({ teamUnread: 0 }),
    setTeamUnread: (count: number) => set({ teamUnread: count })
}))
