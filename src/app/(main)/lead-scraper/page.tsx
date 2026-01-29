'use client'

import { useEffect, useState } from 'react'
import { useLeadScraper } from '@/features/lead-scraper/hooks/useLeadScraper'
import { SearchConfigurator } from '@/features/lead-scraper/components/SearchConfigurator'
import { LeadsTable } from '@/features/lead-scraper/components/LeadsTable'
import { CampaignsList } from '@/features/lead-scraper/components/CampaignsList'
import { ScrapingProgress } from '@/features/lead-scraper/components/ScrapingProgress'
import { TemplateEditor } from '@/features/lead-scraper/components/TemplateEditor'
import { EmailPreview } from '@/features/lead-scraper/components/EmailPreview'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Lead Scraper</h1>
                    <p className="text-gray-400 mt-1">
                        Genera leads, encuentra emails y envía campañas personalizadas.
                    </p>
                </div>
                <button
                    onClick={() => setShowCampaigns(!showCampaigns)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
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
                    onClose={() => setShowCampaigns(false)}
                />
            )}

            {/* Scraping Progress */}
            {scrapingProgress && (
                <ScrapingProgress progress={scrapingProgress} />
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id
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
                            console.log('🕹️ Page handler triggered for leads:', leadIds);
                            console.log('📊 Current campaign:', currentCampaign);

                            if (currentCampaign) {
                                try {
                                    console.log('🎯 Starting email generation for:', leadIds)
                                    await generateEmails(currentCampaign.id, leadIds)

                                    // Marcar estos IDs como pendientes de preview
                                    // El useEffect se encargará de mostrar el modal cuando los leads se actualicen
                                    setPendingPreviewLeadIds(leadIds)
                                } catch (error) {
                                    console.error('Error generando emails:', error)
                                }
                            }
                        }}
                    />
                )}

                {activeTab === 'templates' && (
                    <TemplateEditor />
                )}

                {activeTab === 'send' && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
                        <span className="text-4xl mb-4 block">🚧</span>
                        <p>Panel de Envío - Próximamente</p>
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
