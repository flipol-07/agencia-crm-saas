/**
 * API Route: Generar Emails con IA
 * POST /api/lead-scraper/generate-emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIEmailGenerator, createTemplateService } from '@/features/lead-scraper';

export async function POST(request: NextRequest) {
    try {
        const { campaignId, templateId, leadIds } = await request.json();

        if (!campaignId) {
            return NextResponse.json(
                { error: 'campaignId es requerido' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const aiGenerator = createAIEmailGenerator();
        const templateService = createTemplateService();

        // Obtener template
        let template;
        if (templateId) {
            template = await templateService.getById(templateId);
        } else {
            template = await templateService.getDefault();
        }

        if (!template) {
            return NextResponse.json(
                { error: 'Template no encontrado' },
                { status: 404 }
            );
        }

        // Obtener leads
        let query = supabase
            .from('scraper_leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('email_status', 'pending')
            .not('email', 'is', null);

        if (leadIds?.length > 0) {
            query = query.in('id', leadIds);
        }

        const { data: leads, error } = await query;

        if (error) throw error;
        if (!leads || leads.length === 0) {
            return NextResponse.json(
                { error: 'No hay leads pendientes para generar' },
                { status: 404 }
            );
        }

        // Actualizar estado de campaña
        await supabase
            .from('scraper_campaigns')
            .update({ status: 'generating', updated_at: new Date().toISOString() })
            .eq('id', campaignId);

        // Generar emails
        let generated = 0;
        let failed = 0;

        for (const lead of leads) {
            try {
                const email = await aiGenerator.generatePersonalizedEmail(
                    {
                        id: lead.id,
                        nombre: lead.nombre,
                        categoria: lead.categoria || '',
                        direccion: lead.direccion || '',
                        ubicacion: lead.ubicacion || '',
                        email: lead.email,
                        website: lead.website,
                        emailStatus: 'pending',
                        createdAt: lead.created_at,
                    },
                    template
                );

                await supabase
                    .from('scraper_leads')
                    .update({
                        email_subject: email.subject,
                        email_html: email.htmlContent,
                        email_status: 'generated',
                    })
                    .eq('id', lead.id);

                generated++;
            } catch (error) {
                console.error(`Error generando email para ${lead.nombre}:`, error);
                failed++;
            }
        }

        // Actualizar estado final
        await supabase
            .from('scraper_campaigns')
            .update({ status: 'ready', updated_at: new Date().toISOString() })
            .eq('id', campaignId);

        return NextResponse.json({
            success: true,
            generated,
            failed,
            total: leads.length,
        });

    } catch (error) {
        console.error('Error generando emails:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
