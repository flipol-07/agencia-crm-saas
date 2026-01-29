/**
 * API Route: Generar Emails con IA
 * POST /api/lead-scraper/generate-emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIEmailGenerator, TemplateService } from '@/features/lead-scraper';

export async function POST(request: NextRequest) {
    console.log('🎯 [GENERATE-EMAILS] Iniciando generación de emails');

    try {
        const { campaignId, templateId, leadIds } = await request.json();
        console.log('📥 [GENERATE-EMAILS] Payload recibido:', { campaignId, templateId, leadIds });

        if (!campaignId) {
            return NextResponse.json(
                { error: 'campaignId es requerido' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const aiGenerator = createAIEmailGenerator();
        const templateService = new TemplateService(supabase as any);

        // Obtener template
        console.log('📄 [GENERATE-EMAILS] Obteniendo template...');
        let template;
        if (templateId) {
            template = await templateService.getById(templateId);
        } else {
            template = await templateService.getDefault();
        }

        if (!template) {
            console.error('❌ [GENERATE-EMAILS] Template no encontrado');
            return NextResponse.json(
                { error: 'Template no encontrado' },
                { status: 404 }
            );
        }
        console.log('✅ [GENERATE-EMAILS] Template obtenido:', template.name);

        // Obtener leads
        console.log('🔍 [GENERATE-EMAILS] Consultando leads...');
        const { data: allLeads, error } = await supabase
            .from('scraper_leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('email_status', 'pending')
            .not('email', 'is', null)
            .returns<any[]>();

        if (error) {
            console.error('❌ [GENERATE-EMAILS] Error consultando leads:', error);
            throw error;
        }

        console.log(`📊 [GENERATE-EMAILS] Leads encontrados: ${allLeads?.length || 0}`);

        if (!allLeads || allLeads.length === 0) {
            return NextResponse.json(
                { error: 'No hay leads pendientes para generar' },
                { status: 404 }
            );
        }

        let leadsToProcess = allLeads;

        // Filtrar por IDs seleccionados si se proporcionan
        if (leadIds && leadIds.length > 0) {
            leadsToProcess = allLeads.filter(l => leadIds.includes(l.id));
            console.log(`🎯 [GENERATE-EMAILS] Filtrando por IDs seleccionados: ${leadIds.length} → ${leadsToProcess.length}`);

            if (leadsToProcess.length === 0) {
                return NextResponse.json(
                    { error: 'Los leads seleccionados no están pendientes o no tienen email' },
                    { status: 404 }
                );
            }
        }

        // Actualizar estado de campaña
        console.log('📝 [GENERATE-EMAILS] Actualizando estado de campaña a "generating"');
        await supabase
            .from('scraper_campaigns')
            .update({ status: 'generating', updated_at: new Date().toISOString() } as any)
            .eq('id', campaignId);

        // Generar emails
        console.log(`🤖 [GENERATE-EMAILS] Iniciando generación de ${leadsToProcess.length} emails...`);
        let generated = 0;
        let failed = 0;

        for (const lead of leadsToProcess) {
            try {
                console.log(`  ⏳ Generando email para: ${lead.nombre}`);

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

                console.log(`  ✅ Email generado para ${lead.nombre}:`, {
                    subject: email.subject,
                    htmlLength: email.htmlContent.length
                });

                const { error: updateError } = await supabase
                    .from('scraper_leads')
                    .update({
                        email_subject: email.subject,
                        email_html: email.htmlContent,
                        email_status: 'generated',
                    } as any)
                    .eq('id', lead.id);

                if (updateError) {
                    console.error(`  ❌ Error actualizando lead ${lead.nombre}:`, updateError);
                    failed++;
                } else {
                    console.log(`  💾 Lead ${lead.nombre} actualizado en DB`);
                    generated++;
                }
            } catch (error) {
                console.error(`❌ [GENERATE-EMAILS] Error generando email para ${lead.nombre}:`, error);
                failed++;
            }
        }

        // Actualizar estado final
        console.log('📝 [GENERATE-EMAILS] Actualizando estado de campaña a "ready"');
        await supabase
            .from('scraper_campaigns')
            .update({ status: 'ready', updated_at: new Date().toISOString() } as any)
            .eq('id', campaignId);

        console.log(`✅ [GENERATE-EMAILS] Proceso completado: ${generated} generados, ${failed} fallidos`);

        return NextResponse.json({
            success: true,
            generated,
            failed,
            total: leadsToProcess.length, // FIX: era leads.length (variable no definida)
        });

    } catch (error) {
        console.error('❌ [GENERATE-EMAILS] Error crítico:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
