/**
 * EmailPreview Component
 * Muestra una vista previa de los emails generados con opción de editar y enviar
 */

'use client'

import { useState } from 'react'
import type { Lead } from '../types/lead-scraper.types'

interface EmailPreviewProps {
    leads: Lead[]
    onClose: () => void
    onSend?: (leadIds: string[]) => Promise<void>
}

export function EmailPreview({ leads, onClose, onSend }: EmailPreviewProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set(leads.map(l => l.id)))
    const [isSending, setIsSending] = useState(false)

    const currentLead = leads[selectedIndex]
    const hasGenerated = currentLead?.emailHtml && currentLead?.emailSubject

    const handleSend = async () => {
        if (!onSend || selectedLeads.size === 0) return

        setIsSending(true)
        try {
            await onSend(Array.from(selectedLeads))
            onClose()
        } catch (error) {
            console.error('Error enviando emails:', error)
        } finally {
            setIsSending(false)
        }
    }

    const toggleLead = (leadId: string) => {
        const newSelected = new Set(selectedLeads)
        if (newSelected.has(leadId)) {
            newSelected.delete(leadId)
        } else {
            newSelected.add(leadId)
        }
        setSelectedLeads(newSelected)
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Vista Previa de Emails</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {leads.filter(l => l.emailHtml).length} de {leads.length} emails generados
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {onSend && (
                            <button
                                onClick={handleSend}
                                disabled={isSending || selectedLeads.size === 0}
                                className="px-6 py-2.5 bg-[#bfff00] text-black font-semibold rounded-lg hover:bg-[#a8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? '⏳ Enviando...' : `🚀 Enviar (${selectedLeads.size})`}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Lista de Leads */}
                    <div className="w-80 border-r border-white/10 overflow-y-auto">
                        <div className="p-4 space-y-2">
                            {leads.map((lead, index) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedIndex(index)}
                                    className={`p-4 rounded-lg cursor-pointer transition-all ${selectedIndex === index
                                            ? 'bg-[#bfff00]/10 border border-[#bfff00]/30'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedLeads.has(lead.id)}
                                            onChange={() => toggleLead(lead.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-[#bfff00] checked:border-[#bfff00]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate">
                                                {lead.nombre}
                                            </div>
                                            <div className="text-sm text-gray-400 truncate">
                                                {lead.email}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                {lead.emailHtml ? (
                                                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                                        ✓ Generado
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                                                        ⏳ Pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {hasGenerated ? (
                            <>
                                {/* Email Subject */}
                                <div className="p-6 border-b border-white/10 bg-white/5">
                                    <div className="text-sm text-gray-400 mb-1">Asunto:</div>
                                    <div className="text-lg font-medium text-white">
                                        {currentLead.emailSubject}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                                        <div>
                                            <span className="font-medium">Para:</span> {currentLead.email}
                                        </div>
                                        <div>
                                            <span className="font-medium">Negocio:</span> {currentLead.nombre}
                                        </div>
                                    </div>
                                </div>

                                {/* Email Content */}
                                <div className="flex-1 overflow-y-auto p-6 bg-white">
                                    <div
                                        dangerouslySetInnerHTML={{ __html: currentLead.emailHtml || '' }}
                                        className="max-w-3xl mx-auto"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">📧</div>
                                    <p className="text-lg">Email no generado aún</p>
                                    <p className="text-sm mt-2">
                                        Este lead está pendiente de generación
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
