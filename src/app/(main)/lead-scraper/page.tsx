'use client'

import { useEffect, useState } from 'react'
import { useLeadScraper } from '@/features/lead-scraper/hooks/useLeadScraper'
import {
    SearchConfigurator,
    LeadsTable,
    CampaignsList,
    ScrapingProgress,
    TemplateEditor,
    EmailPreview,
    SendingPanel
} from '@/features/lead-scraper/components'
import type { Lead } from '@/features/lead-scraper/types/lead-scraper.types'

export default function LeadScraperPage() {
    const {
        campaigns,
        currentCampaign,
        leads,
        scrapingProgress,
        isLoading,
        error,
        activeTab,
        setActiveTab,
        setCurrentCampaign,
        loadCampaigns,
        loadLeads,
        generateEmails,
        deleteCampaign,
        addLeads,
    } = useLeadScraper()

    const [showCampaigns, setShowCampaigns] = useState(false)
    const [showEmailPreview, setShowEmailPreview] = useState(false)
    const [previewLeads, setPreviewLeads] = useState<Lead[]>([])
    const [pendingPreviewLeadIds, setPendingPreviewLeadIds] = useState<string[]>([])

    // Efecto para mostrar preview cuando los leads se actualicen después de generar
    useEffect(() => {
        if (pendingPreviewLeadIds.length > 0 && !isLoading) {
            const generatedLeads = leads.filter(lead =>
                pendingPreviewLeadIds.includes(lead.id) && lead.emailHtml
            )

            console.log('📧 Checking for generated emails:', {
                pending: pendingPreviewLeadIds,
                found: generatedLeads.length,
                leads: generatedLeads.map(l => ({ id: l.id, hasHtml: !!l.emailHtml }))
            })

            if (generatedLeads.length > 0) {
                setPreviewLeads(generatedLeads)
                setShowEmailPreview(true)
                setPendingPreviewLeadIds([])
            }
        }
    }, [leads, pendingPreviewLeadIds, isLoading])

    useEffect(() => {
        loadCampaigns()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Solo al montar

    const tabs = [
        { id: 'search', label: 'Buscar Leads', icon: '🔍' },
        { id: 'leads', label: 'Leads', icon: '📋', count: leads.length },
        { id: 'templates', label: 'Templates', icon: '✉️' },
        { id: 'send', label: 'Enviar', icon: '🚀' },
    ] as const

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Lead Scraper</h1>
                    <p className="text-gray-400 mt-1">
                        Genera leads, encuentra emails y envía campañas personalizadas.
                    </p>
                </div>
                <button
                    onClick={() => setShowCampaigns(!showCampaigns)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                >
                    <span>📁</span>
                    <span>Campañas ({campaigns.length})</span>
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Campaigns Sidebar */}
            {showCampaigns && (
                <CampaignsList
                    campaigns={campaigns}
                    currentCampaign={currentCampaign}
                    onSelect={(campaign) => {
                        setCurrentCampaign(campaign)
                        loadLeads(campaign.id)
                        setActiveTab('leads')
                        setShowCampaigns(false)
                    }}
                    onDelete={deleteCampaign}
                    onClose={() => setShowCampaigns(false)}
                />
            )}

            {/* Scraping Progress */}
            {scrapingProgress && (
                <ScrapingProgress progress={scrapingProgress} />
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                            ? 'bg-[#bfff00]/10 text-[#bfff00] border-b-2 border-[#bfff00]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {'count' in tab && tab.count > 0 && (
                            <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'search' && (
                    <SearchConfigurator />
                )}

                {activeTab === 'leads' && (
                    <LeadsTable
                        leads={leads}
                        isLoading={isLoading}
                        onGenerateEmails={async (leadIds) => {
                            if (currentCampaign) {
                                try {
                                    await generateEmails(currentCampaign.id, leadIds)

                                    // Marcar estos IDs como pendientes de preview
                                    // El useEffect se encargará de mostrar el modal cuando los leads se actualicen
                                    setPendingPreviewLeadIds(leadIds)
                                } catch (error) {
                                    console.error('Error generando emails:', error)
                                }
                            }
                        }}
                        onAddLeads={async () => {
                            if (currentCampaign) {
                                const countStr = prompt('¿Cuántos leads adicionales quieres buscar?', '20')
                                if (countStr) {
                                    const count = parseInt(countStr)
                                    if (!isNaN(count) && count > 0) {
                                        try {
                                            await addLeads(currentCampaign.id, count)
                                        } catch (error) {
                                            console.error('Error añadiendo leads:', error)
                                        }
                                    }
                                }
                            }
                        }}
                        onPreviewLead={(leadId) => {
                            setPendingPreviewLeadIds([leadId])
                        }}
                    />
                )}

                {activeTab === 'templates' && (
                    <TemplateEditor />
                )}

                {activeTab === 'send' && currentCampaign && (
                    <SendingPanel
                        campaign={currentCampaign}
                        leads={leads}
                    />
                )}

                {activeTab === 'send' && !currentCampaign && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center text-gray-400">
                        <span className="text-4xl mb-4 block">📁</span>
                        <p>Selecciona una campaña para gestionar el envío.</p>
                        <button
                            onClick={() => setShowCampaigns(true)}
                            className="mt-4 px-4 py-2 bg-[#bfff00]/10 text-[#bfff00] rounded-lg hover:bg-[#bfff00]/20 transition-colors"
                        >
                            Ver Campañas
                        </button>
                    </div>
                )}
            </div>

            {/* Email Preview Modal */}
            {showEmailPreview && (
                <EmailPreview
                    leads={previewLeads}
                    onClose={() => setShowEmailPreview(false)}
                    onSend={async (leadIds) => {
                        // TODO: Implementar envío de emails
                        console.log('Enviando emails a:', leadIds)
                    }}
                />
            )}
        </div>
    )
}
