/**
 * Lead Scraper Store (Zustand)
 * 
 * Estado global para la feature de Lead Scraper
 */

import { create } from 'zustand';
import type { Campaign, Lead, SearchConfig, ScrapingProgress, SendingProgress } from '../types/lead-scraper.types';

interface LeadScraperState {
    // Campañas
    campaigns: Campaign[];
    currentCampaign: Campaign | null;

    // Leads
    leads: Lead[];
    selectedLeads: string[];

    // Progreso
    scrapingProgress: ScrapingProgress | null;
    sendingProgress: SendingProgress | null;

    // UI State
    isLoading: boolean;
    error: string | null;
    activeTab: 'search' | 'leads' | 'templates' | 'send';

    // Actions
    setCampaigns: (campaigns: Campaign[]) => void;
    setCurrentCampaign: (campaign: Campaign | null) => void;
    setLeads: (leads: Lead[]) => void;
    addLeads: (leads: Lead[]) => void;
    toggleLeadSelection: (leadId: string) => void;
    selectAllLeads: () => void;
    clearSelection: () => void;
    setScrapingProgress: (progress: ScrapingProgress | null) => void;
    setSendingProgress: (progress: SendingProgress | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setActiveTab: (tab: 'search' | 'leads' | 'templates' | 'send') => void;
    reset: () => void;
}

const initialState = {
    campaigns: [],
    currentCampaign: null,
    leads: [],
    selectedLeads: [],
    scrapingProgress: null,
    sendingProgress: null,
    isLoading: false,
    error: null,
    activeTab: 'search' as const,
};

export const useLeadScraperStore = create<LeadScraperState>((set, get) => ({
    ...initialState,

    setCampaigns: (campaigns) => set({ campaigns }),

    setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),

    setLeads: (leads) => set({ leads, selectedLeads: [] }),

    addLeads: (newLeads) => set((state) => ({
        leads: [...state.leads, ...newLeads]
    })),

    toggleLeadSelection: (leadId) => set((state) => {
        const isSelected = state.selectedLeads.includes(leadId);
        return {
            selectedLeads: isSelected
                ? state.selectedLeads.filter(id => id !== leadId)
                : [...state.selectedLeads, leadId]
        };
    }),

    selectAllLeads: () => set((state) => ({
        selectedLeads: state.leads.map(l => l.id).filter((id): id is string => !!id)
    })),

    clearSelection: () => set({ selectedLeads: [] }),

    setScrapingProgress: (progress) => set({ scrapingProgress: progress }),

    setSendingProgress: (progress) => set({ sendingProgress: progress }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    setActiveTab: (activeTab) => set({ activeTab }),

    reset: () => set(initialState),
}));
