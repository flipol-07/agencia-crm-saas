'use client'

import type { ScrapingProgress } from '../types/lead-scraper.types'

interface ScrapingProgressProps {
    progress: ScrapingProgress
}

export function ScrapingProgress({ progress }: ScrapingProgressProps) {
    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

    const phaseConfig: Record<string, { label: string; icon: string; color: string }> = {
        places: { label: 'Buscando negocios', icon: '🔍', color: 'bg-blue-500' },
        emails: { label: 'Buscando emails', icon: '📧', color: 'bg-purple-500' },
        generating: { label: 'Generando contenido', icon: '✨', color: 'bg-yellow-500' },
        sending: { label: 'Enviando emails', icon: '🚀', color: 'bg-orange-500' },
        saving: { label: 'Guardando', icon: '💾', color: 'bg-green-500' },
    }

    const phase = phaseConfig[progress.phase]

    return (
        <div className="bg-gradient-to-r from-[#bfff00]/10 to-purple-500/10 border border-[#bfff00]/20 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl animate-pulse">{phase.icon}</div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{phase.label}</span>
                        <span className="text-[#bfff00] font-bold">{percentage}%</span>
                    </div>
                    <p className="text-gray-400 text-sm">{progress.message}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full ${phase.color} transition-all duration-300 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{progress.current} / {progress.total}</span>
                {progress.startedAt && (
                    <span>Iniciado: {new Date(progress.startedAt).toLocaleTimeString('es-ES')}</span>
                )}
            </div>
        </div>
    )
}
