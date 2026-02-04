'use client'

import { useAuraStore } from '@/features/ai-assistant/store/aura-store'

export function AuraTrigger() {
    const { triggerMessage } = useAuraStore()

    return (
        <button
            onClick={() => triggerMessage('¿Qué hago ahora? Haz un análisis rápido de mi CRM y dime mis 3 prioridades.')}
            className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white rounded-lg font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-[#8b5cf6]/20"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ¿Qué hago ahora?
        </button>
    )
}
