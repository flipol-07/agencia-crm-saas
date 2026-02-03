import { create } from 'zustand'

interface AuraStore {
    isOpen: boolean
    messageTrigger: string | null
    setIsOpen: (isOpen: boolean) => void
    triggerMessage: (message: string) => void
    clearTrigger: () => void
}

export const useAuraStore = create<AuraStore>((set) => ({
    isOpen: false,
    messageTrigger: null,
    setIsOpen: (isOpen) => set({ isOpen }),
    triggerMessage: (message) => set({ messageTrigger: message, isOpen: true }),
    clearTrigger: () => set({ messageTrigger: null }),
}))
