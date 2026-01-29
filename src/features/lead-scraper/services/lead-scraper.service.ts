/**
 * Lead Scraper Service - Orquestador Principal
 * 
 * Coordina el flujo completo:
 * 1. Google Places API → Obtener negocios
 * 2. Email Finder → Buscar emails
 * 3. Guardar en Supabase
 */

import { createClient } from '@/lib/supabase/client';
import { GooglePlacesService, createGooglePlacesService } from './google-places.service';
import { EmailFinderService, createEmailFinder } from './email-finder.service';
import type {
    Lead,
    Campaign,
    SearchConfig,
    ScrapingProgress,
    PlaceResult
} from '../types/lead-scraper.types';

export class LeadScraperService {
    private supabase = createClient();
    private placesService: GooglePlacesService;
    private emailFinder: EmailFinderService;
    private progress: ScrapingProgress | null = null;
    private onProgressCallback?: (progress: ScrapingProgress) => void;

    constructor() {
        this.placesService = createGooglePlacesService();
        this.emailFinder = createEmailFinder();
    }

    /**
     * Establece callback para progreso
     */
    onProgress(callback: (progress: ScrapingProgress) => void) {
        this.onProgressCallback = callback;
    }

    /**
     * Actualiza y notifica progreso
     */
    private updateProgress(phase: ScrapingProgress['phase'], current: number, total: number, message: string) {
        this.progress = {
            phase,
            current,
            total,
            message,
            startedAt: this.progress?.startedAt || new Date().toISOString(),
        };

        if (this.onProgressCallback) {
            this.onProgressCallback(this.progress);
        }
    }

    /**
     * Crea una nueva campaña
     */
    async createCampaign(name: string, searchConfig: SearchConfig): Promise<Campaign> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await this.supabase
            .from('scraper_campaigns')
            .insert({
                user_id: user.id,
                name,
                status: 'draft',
                search_config: searchConfig,
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapCampaign(data);
    }

    /**
     * Ejecuta el scraping completo
     */
    async runScraping(campaignId: string): Promise<Lead[]> {
        // Obtener campaña
        const { data: campaignData, error } = await this.supabase
            .from('scraper_campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error) throw error;
        const campaign = this.mapCampaign(campaignData);

        // Actualizar estado a "scraping"
        await this.updateCampaignStatus(campaignId, 'scraping');

        try {
            // FASE 1: Google Places API
            this.updateProgress('places', 0, campaign.searchConfig.cantidad, 'Buscando negocios...');

            const placeResults = await this.placesService.searchByConfig(campaign.searchConfig);

            // Convertir a leads
            const leads: Lead[] = placeResults.map(result =>
                GooglePlacesService.resultToLead(result, campaign.searchConfig.sector, campaign.searchConfig.ubicacion)
            );

            this.updateProgress('places', leads.length, leads.length, `Encontrados ${leads.length} negocios`);

            // FASE 2: Email Finder (si está habilitado)
            let enrichedLeads = leads;
            if (!campaign.searchConfig.filtros.requiereEmail || campaign.searchConfig.filtros.requiereEmail) {
                await this.updateCampaignStatus(campaignId, 'finding_emails');
                this.updateProgress('emails', 0, leads.length, 'Buscando emails...');

                enrichedLeads = await this.emailFinder.enrichLeadsWithEmails(
                    leads,
                    (current, total, lead) => {
                        this.updateProgress('emails', current, total, `Buscando email de ${lead.nombre}...`);
                    }
                );
            }

            // Filtrar si requiere email
            if (campaign.searchConfig.filtros.requiereEmail) {
                enrichedLeads = enrichedLeads.filter(lead => lead.email);
            }

            // FASE 3: Guardar en Supabase
            const savedLeads = await this.saveLeads(campaignId, enrichedLeads);

            // Actualizar campaña
            await this.supabase
                .from('scraper_campaigns')
                .update({
                    status: 'ready',
                    leads_count: savedLeads.length,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', campaignId);

            return savedLeads;

        } catch (error) {
            await this.updateCampaignStatus(campaignId, 'draft');
            throw error;
        }
    }

    /**
     * Guarda leads en Supabase
     */
    private async saveLeads(campaignId: string, leads: Lead[]): Promise<Lead[]> {
        const leadsToInsert = leads.map(lead => ({
            campaign_id: campaignId,
            nombre: lead.nombre,
            categoria: lead.categoria,
            direccion: lead.direccion,
            ubicacion: lead.ubicacion,
            telefono: lead.telefono,
            email: lead.email,
            website: lead.website,
            rating: lead.rating,
            total_reviews: lead.totalReviews,
            place_id: lead.placeId,
            email_status: 'pending',
        }));

        const { data, error } = await this.supabase
            .from('scraper_leads')
            .insert(leadsToInsert)
            .select();

        if (error) throw error;
        return this.mapLeads(data);
    }

    /**
     * Obtiene leads de una campaña
     */
    async getLeads(campaignId: string): Promise<Lead[]> {
        const { data, error } = await this.supabase
            .from('scraper_leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return this.mapLeads(data || []);
    }

    /**
     * Obtiene campañas del usuario
     */
    async getCampaigns(): Promise<Campaign[]> {
        const { data, error } = await this.supabase
            .from('scraper_campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapCampaign);
    }

    /**
     * Actualiza estado de campaña
     */
    private async updateCampaignStatus(campaignId: string, status: Campaign['status']) {
        await this.supabase
            .from('scraper_campaigns')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', campaignId);
    }

    /**
     * Mapea datos de DB a Campaign
     */
    private mapCampaign(row: Record<string, unknown>): Campaign {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            name: row.name as string,
            status: row.status as Campaign['status'],
            searchConfig: row.search_config as SearchConfig,
            templateId: row.template_id as string | undefined,
            leadsCount: row.leads_count as number,
            emailsSent: row.emails_sent as number,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
        };
    }

    /**
     * Mapea datos de DB a Lead[]
     */
    private mapLeads(rows: Record<string, unknown>[]): Lead[] {
        return rows.map(row => ({
            id: row.id as string,
            campaignId: row.campaign_id as string,
            nombre: row.nombre as string,
            categoria: row.categoria as string,
            direccion: row.direccion as string,
            ubicacion: row.ubicacion as string,
            telefono: row.telefono as string | undefined,
            email: row.email as string | undefined,
            website: row.website as string | undefined,
            rating: row.rating as number | undefined,
            totalReviews: row.total_reviews as number | undefined,
            placeId: row.place_id as string | undefined,
            emailSubject: row.email_subject as string | undefined,
            emailHtml: row.email_html as string | undefined,
            emailStatus: row.email_status as Lead['emailStatus'],
            sentAt: row.sent_at as string | undefined,
            createdAt: row.created_at as string,
        }));
    }
}

export function createLeadScraperService(): LeadScraperService {
    return new LeadScraperService();
}
