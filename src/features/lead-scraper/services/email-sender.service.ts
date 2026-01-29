/**
 * Servicio de Envío de Emails
 * 
 * Envía emails masivos con:
 * - Rate limiting configurable
 * - Guardado en carpeta Enviados (IMAP)
 * - Tracking de progreso
 */

import { createClient } from '@/lib/supabase/client';
import type { Lead, SendingProgress, SendingConfig } from '../types/lead-scraper.types';

export class EmailSenderService {
    private supabase = createClient();
    private progress: SendingProgress = { total: 0, sent: 0, failed: 0 };
    private onProgressCallback?: (progress: SendingProgress) => void;
    private aborted = false;

    /**
     * Configura callback de progreso
     */
    onProgress(callback: (progress: SendingProgress) => void) {
        this.onProgressCallback = callback;
    }

    /**
     * Aborta el envío
     */
    abort() {
        this.aborted = true;
    }

    /**
     * Envía emails a los leads de una campaña
     */
    async sendCampaign(
        campaignId: string,
        config: SendingConfig = { delayBetweenEmails: 5, dailyLimit: 800, testMode: false }
    ): Promise<SendingProgress> {
        this.aborted = false;

        // Obtener leads con email generado
        const { data: leads, error } = await this.supabase
            .from('scraper_leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('email_status', 'generated')
            .not('email', 'is', null);

        if (error) throw error;
        if (!leads || leads.length === 0) {
            throw new Error('No hay leads con emails generados para enviar');
        }

        this.progress = { total: leads.length, sent: 0, failed: 0 };
        this.notifyProgress();

        // Actualizar estado de campaña
        await this.supabase
            .from('scraper_campaigns')
            .update({ status: 'sending', updated_at: new Date().toISOString() })
            .eq('id', campaignId);

        // Procesar leads
        for (const lead of leads) {
            if (this.aborted) break;
            if (this.progress.sent >= config.dailyLimit) break;

            try {
                if (config.testMode) {
                    // Simular envío
                    await this.delay(100);
                    console.log(`[TEST] Simularía envío a: ${lead.email}`);
                } else {
                    await this.sendEmail(lead);
                }

                // Marcar como enviado
                await this.supabase
                    .from('scraper_leads')
                    .update({ email_status: 'sent', sent_at: new Date().toISOString() })
                    .eq('id', lead.id);

                this.progress.sent++;
            } catch (error) {
                console.error(`Error enviando a ${lead.email}:`, error);

                await this.supabase
                    .from('scraper_leads')
                    .update({ email_status: 'error' })
                    .eq('id', lead.id);

                this.progress.failed++;
            }

            this.progress.currentLead = lead.nombre;
            this.notifyProgress();

            // Delay entre emails
            if (!config.testMode) {
                await this.delay(config.delayBetweenEmails * 1000);
            }
        }

        // Actualizar conteo en campaña
        const newStatus = this.aborted ? 'ready' : 'completed';
        await this.supabase
            .from('scraper_campaigns')
            .update({
                status: newStatus,
                emails_sent: this.progress.sent,
                updated_at: new Date().toISOString(),
            })
            .eq('id', campaignId);

        return this.progress;
    }

    /**
     * Envía un email individual usando API Route
     */
    private async sendEmail(lead: Record<string, unknown>): Promise<void> {
        const response = await fetch('/api/lead-scraper/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: lead.email,
                subject: lead.email_subject,
                html: lead.email_html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
    }

    /**
     * Envía email de prueba
     */
    async sendTestEmail(
        testEmail: string,
        subject: string,
        html: string
    ): Promise<boolean> {
        try {
            const response = await fetch('/api/lead-scraper/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: testEmail, subject, html }),
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    private notifyProgress() {
        if (this.onProgressCallback) {
            this.onProgressCallback({ ...this.progress });
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export function createEmailSenderService(): EmailSenderService {
    return new EmailSenderService();
}
