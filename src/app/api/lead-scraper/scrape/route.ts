import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLeadScraperService } from '@/features/lead-scraper';

export async function POST(request: NextRequest) {
    try {
        const { campaignId } = await request.json();

        if (!campaignId) {
            return NextResponse.json(
                { error: 'campaignId es requerido' },
                { status: 400 }
            );
        }

        // Crear cliente de servidor con cookies (para tener la sesión del usuario)
        const supabase = await createClient();
        
        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('Error de autenticación en scrape:', authError);
            return NextResponse.json(
                { error: 'No autorizado - Sesión inválida' },
                { status: 401 }
            );
        }

        // Inyectar cliente autenticado al servicio
        const scraperService = createLeadScraperService(supabase);
        
        console.log(`Iniciando scraping para campaña ${campaignId} usuario ${user.id}`);
        
        const leads = await scraperService.runScraping(campaignId);

        console.log(`Scraping completado. ${leads.length} leads encontrados.`);

        return NextResponse.json({
            success: true,
            leadsCount: leads.length,
            leadsWithEmail: leads.filter(l => l.email).length,
        });

    } catch (error) {
        console.error('Error CRÍTICO en scraping route:', error);
        // Mostrar stack trace en logs del servidor
        if (error instanceof Error) {
            console.error(error.stack);
        }
        
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido en servidor' },
            { status: 500 }
        );
    }
}
