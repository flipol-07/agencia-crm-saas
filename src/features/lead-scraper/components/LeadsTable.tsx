'use client'

import { useState } from 'react'
import type { Lead } from '../types/lead-scraper.types'
import { useLeadScraperStore } from '../store/leadScraperStore'

interface LeadsTableProps {
    leads: Lead[]
    isLoading: boolean
    onGenerateEmails?: (leadIds: string[]) => Promise<void>
    onAddLeads?: () => void
    onPreviewLead?: (leadId: string) => void
}

export function LeadsTable({ leads, isLoading, onGenerateEmails, onAddLeads, onPreviewLead }: LeadsTableProps) {
    const { selectedLeads, toggleLeadSelection, selectAllLeads, clearSelection } = useLeadScraperStore()
    const [isGenerating, setIsGenerating] = useState(false)
    const [generateError, setGenerateError] = useState('')

    const handleGenerateEmails = async () => {
        if (!onGenerateEmails || selectedLeads.length === 0) return

        setIsGenerating(true)
        setGenerateError('')

        try {
            await onGenerateEmails(selectedLeads)
        } catch (error) {
            setGenerateError(error instanceof Error ? error.message : 'Error al generar emails')
        } finally {
            setIsGenerating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-400">
                    {isGenerating ? 'Generando emails personalizados...' : 'Cargando leads...'}
                </p>
                {isGenerating && (
                    <p className="text-gray-500 text-sm mt-2">Esto puede tardar unos segundos por lead.</p>
                )}
            </div>
        )
    }

    if (leads.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-400">No hay leads todavía.</p>
                <p className="text-gray-500 text-sm mt-2">Configura una búsqueda para generar leads.</p>
            </div>
        )
    }

    const allSelected = selectedLeads.length === leads.length && leads.length > 0
    const someSelected = selectedLeads.length > 0

    return (
        <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => allSelected ? clearSelection() : selectAllLeads()}
                            className="w-4 h-4 rounded border-white/20 text-[#8b5cf6] focus:ring-[#8b5cf6]"
                        />
                        <span className="text-sm text-gray-400">
                            {someSelected ? `${selectedLeads.length} seleccionados` : 'Seleccionar todos'}
                        </span>
                    </label>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                        {leads.length} leads • {leads.filter(l => l.email).length} con email
                    </span>

                    {!someSelected && onAddLeads && (
                        <button
                            onClick={onAddLeads}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm border border-white/10 transition-colors"
                            title="Generar más leads para esta campaña"
                        >
                            <span>➕</span>
                            <span>Generar más</span>
                        </button>
                    )}

                    {someSelected && (
                        <>
                            <button
                                onClick={handleGenerateEmails}
                                disabled={isGenerating}
                                className="px-3 py-1.5 bg-[#8b5cf6]/10 text-[#a78bfa] rounded-lg text-sm hover:bg-[#8b5cf6]/20 transition-colors disabled:opacity-50 disabled:cursor-wait font-medium border border-[#8b5cf6]/20"
                            >
                                {isGenerating ? '⏳ Generando...' : '✉️ Generar Emails'}
                            </button>
                            <button className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-colors">
                                📥 Exportar
                            </button>
                        </>
                    )}

                    {generateError && (
                        <span className="text-red-400 text-sm">{generateError}</span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 text-left">
                            <th className="w-10 px-4 py-3"></th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Negocio</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Categoría</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {leads.map((lead) => (
                            <tr
                                key={lead.id}
                                className={`hover:bg-white/5 transition-colors ${selectedLeads.includes(lead.id || '') ? 'bg-[#8b5cf6]/5' : ''
                                    }`}
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedLeads.includes(lead.id || '')}
                                        onChange={() => toggleLeadSelection(lead.id || '')}
                                        className="w-4 h-4 rounded border-white/20 text-[#8b5cf6] focus:ring-[#8b5cf6]"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="text-white font-medium">{lead.nombre}</p>
                                        <p className="text-gray-500 text-sm truncate max-w-xs">{lead.direccion}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-gray-400 text-sm">{lead.categoria}</span>
                                </td>
                                <td className="px-4 py-3">
                                    {lead.email ? (
                                        <a href={`mailto:${lead.email}`} className="text-[#a78bfa] text-sm hover:underline">
                                            {lead.email}
                                        </a>
                                    ) : (
                                        <span className="text-gray-600 text-sm">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {lead.rating ? (
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-400 text-[10px]">⭐</span>
                                            <span className="text-white text-sm">{lead.rating}</span>
                                            <span className="text-gray-500 text-xs">({lead.totalReviews})</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 text-sm">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={lead.emailStatus} />
                                        {lead.emailStatus === 'generated' && onPreviewLead && (
                                            <button
                                                onClick={() => onPreviewLead(lead.id)}
                                                className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-[#a78bfa]"
                                                title="Previsualizar Email"
                                            >
                                                👁️
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: Lead['emailStatus'] }) {
    const config = {
        pending: { label: 'Pendiente', bg: 'bg-gray-500/20', text: 'text-gray-400' },
        generated: { label: 'Generado', bg: 'bg-[#8b5cf6]/20', text: 'text-[#a78bfa]' },
        sent: { label: 'Enviado', bg: 'bg-green-500/20', text: 'text-green-400' },
        error: { label: 'Error', bg: 'bg-red-500/20', text: 'text-red-400' },
    }

    const { label, bg, text } = config[status || 'pending']

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${bg} ${text}`}>
            {label}
        </span>
    )
}

