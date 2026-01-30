/**
 * Hook para Lead Scraper
 * 
 * Encapsula la lógica de negocio del Lead Scraper
 * usando llamadas a API Routes (no imports de servidor)
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useLeadScraperStore } from '../store/leadScraperStore';
import type { SearchConfig } from '../types/lead-scraper.types';

export function useLeadScraper() {
    // Selector individual para evitar re-renders innecesarios
    const campaigns = useLeadScraperStore((state) => state.campaigns);
    const currentCampaign = useLeadScraperStore((state) => state.currentCampaign);
    const leads = useLeadScraperStore((state) => state.leads);
    const selectedLeads = useLeadScraperStore((state) => state.selectedLeads);
    const scrapingProgress = useLeadScraperStore((state) => state.scrapingProgress);
    const sendingProgress = useLeadScraperStore((state) => state.sendingProgress);
    const isLoading = useLeadScraperStore((state) => state.isLoading);
    const error = useLeadScraperStore((state) => state.error);
    const activeTab = useLeadScraperStore((state) => state.activeTab);

    // Actions estables del store
    const setCampaigns = useLeadScraperStore((state) => state.setCampaigns);
    const setCurrentCampaign = useLeadScraperStore((state) => state.setCurrentCampaign);
    const setLeads = useLeadScraperStore((state) => state.setLeads);
    const setLoading = useLeadScraperStore((state) => state.setLoading);
    const setError = useLeadScraperStore((state) => state.setError);
    const setActiveTab = useLeadScraperStore((state) => state.setActiveTab);
    const setScrapingProgress = useLeadScraperStore((state) => state.setScrapingProgress);
    const setSendingProgress = useLeadScraperStore((state) => state.setSendingProgress);
    const toggleLeadSelection = useLeadScraperStore((state) => state.toggleLeadSelection);
    const selectAllLeads = useLeadScraperStore((state) => state.selectAllLeads);
    const clearSelection = useLeadScraperStore((state) => state.clearSelection);

    // Ref para evitar múltiples llamadas
    const loadingRef = useRef(false);

    /**
     * Carga las campañas del usuario
     */
    const loadCampaigns = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/lead-scraper/campaigns');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error cargando campañas');
            }

            setCampaigns(result.campaigns || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error cargando campañas');
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [setLoading, setError, setCampaigns]);

    /**
     * Crea una nueva campaña y ejecuta el scraping
     */
    const startScraping = useCallback(async (name: string, config: SearchConfig) => {
        setLoading(true);
        setError(null);

        try {
            // Crear campaña via API
            const createResponse = await fetch('/api/lead-scraper/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, searchConfig: config }),
            });

            const createResult = await createResponse.json();

            if (!createResponse.ok) {
                throw new Error(createResult.error || 'Error creando campaña');
            }

            const campaign = createResult.campaign;
            setCurrentCampaign(campaign);

            // Ejecutar scraping via API
            setScrapingProgress({
                phase: 'places',
                current: 0,
                total: config.cantidad,
                message: 'Iniciando búsqueda...',
                startedAt: new Date().toISOString(),
            });

            const scrapeResponse = await fetch('/api/lead-scraper/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: campaign.id }),
            });

            const scrapeResult = await scrapeResponse.json();

            if (!scrapeResponse.ok) {
                throw new Error(scrapeResult.error || 'Error en scraping');
            }

            setLeads(scrapeResult.leads || []);
            setActiveTab('leads');

            // Recargar campañas
            await loadCampaigns();

            return scrapeResult.leads;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error en scraping');
            throw err;
        } finally {
            setLoading(false);
            setScrapingProgress(null);
        }
    }, [setLoading, setError, setCurrentCampaign, setScrapingProgress, setLeads, setActiveTab, loadCampaigns]);

    /**
     * Carga leads de una campaña
     */
    const loadLeads = useCallback(async (campaignId: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/lead-scraper/campaigns/${campaignId}/leads`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error cargando leads');
            }

            setLeads(result.leads || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error cargando leads');
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, setLeads]);

    /**
     * Genera emails para leads seleccionados
     */
    const generateEmails = useCallback(async (campaignId: string, leadIds?: string[], templateId?: string) => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                campaignId,
                templateId,
                leadIds: leadIds || (selectedLeads.length > 0 ? selectedLeads : undefined),
            };

            const response = await fetch('/api/lead-scraper/generate-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            console.log('📥 [useLeadScraper] Response status:', response.status);
            const result = await response.json();
            console.log('📥 [useLeadScraper] Response data:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Error generando emails');
            }

            // Recargar leads
            console.log('🔄 [useLeadScraper] Recargando leads...');
            await loadLeads(campaignId);

            return result;
        } catch (err) {
            console.error('❌ [useLeadScraper] Error:', err);
            setError(err instanceof Error ? err.message : 'Error generando emails');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError, selectedLeads, loadLeads]);

    /**
     * Envía emails de la campaña
     */
    const sendEmails = useCallback(async (campaignId: string, testMode = false) => {
        setLoading(true);
        setError(null);

        try {
            setSendingProgress({
                sent: 0,
                failed: 0,
                total: selectedLeads.length || leads.length,
                currentLead: '',
            });

            const response = await fetch('/api/lead-scraper/send-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    leadIds: selectedLeads.length > 0 ? selectedLeads : undefined,
                    testMode,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error enviando emails');
            }

            // Recargar leads
            await loadLeads(campaignId);

            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error enviando emails');
            throw err;
        } finally {
            setLoading(false);
            setSendingProgress(null);
        }
    }, [setLoading, setError, setSendingProgress, selectedLeads, leads.length, loadLeads]);

    return {
        // State
        campaigns,
        currentCampaign,
        leads,
        selectedLeads,
        scrapingProgress,
        sendingProgress,
        isLoading,
        error,
        activeTab,

        // Actions from store
        setCurrentCampaign,
        setActiveTab,
        toggleLeadSelection,
        selectAllLeads,
        clearSelection,

        // API Actions
        loadCampaigns,
        startScraping,
        loadLeads,
        generateEmails,
        sendEmails,
    };
}
