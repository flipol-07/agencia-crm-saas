'use client'

import type { Campaign } from '../types/lead-scraper.types'

interface CampaignsListProps {
    campaigns: Campaign[]
    currentCampaign: Campaign | null
    onSelect: (campaign: Campaign) => void
    onDelete: (id: string) => void
    onClose: () => void
}

export function CampaignsList({ campaigns, currentCampaign, onSelect, onDelete, onClose }: CampaignsListProps) {
    const statusConfig = {
        draft: { label: 'Borrador', color: 'text-gray-400', bg: 'bg-gray-500/20' },
        scraping: { label: 'Scraping...', color: 'text-blue-400', bg: 'bg-blue-500/20' },
        finding_emails: { label: 'Buscando emails...', color: 'text-purple-400', bg: 'bg-purple-500/20' },
        ready: { label: 'Listo', color: 'text-green-400', bg: 'bg-green-500/20' },
        generating: { label: 'Generando...', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        sending: { label: 'Enviando...', color: 'text-orange-400', bg: 'bg-orange-500/20' },
        completed: { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="relative w-full max-w-md h-full bg-[#0d0a1b] border-l border-white/10 overflow-y-auto">
                <div className="sticky top-0 bg-[#0d0a1b] border-b border-white/10 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">📁 Campañas</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <span className="text-4xl block mb-3">📭</span>
                            <p>No tienes campañas todavía</p>
                            <p className="text-sm text-gray-500 mt-1">Crea una nueva búsqueda para empezar</p>
                        </div>
                    ) : (
                        campaigns.map((campaign) => {
                            const status = statusConfig[campaign.status]
                            const isActive = currentCampaign?.id === campaign.id

                            return (
                                <div
                                    key={campaign.id}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${isActive
                                        ? 'bg-[#bfff00]/10 border-[#bfff00]/30'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => onSelect(campaign)}
                                        >
                                            <p className="text-white font-medium truncate">{campaign.name}</p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                {campaign.searchConfig?.sector} • {campaign.searchConfig?.ubicacion}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(campaign.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                title="Eliminar campaña"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <span>📋 {campaign.leadsCount} leads</span>
                                        <span>✉️ {campaign.emailsSent} enviados</span>
                                        <span>{new Date(campaign.createdAt).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
