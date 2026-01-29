/**
 * API Route: GET /api/lead-scraper/campaigns/[id]/leads
 * 
 * Obtiene los leads de una campaña específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Verificar que la campaña pertenece al usuario
        const { data: campaign, error: campaignError } = await supabase
            .from('scraper_campaigns')
            .select('id')
            .eq('id', campaignId)
            .eq('user_id', user.id)
            .single();

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
        }

        // Obtener leads
        const { data, error } = await supabase
            .from('scraper_leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Mapear a formato Lead
        const leads = (data || []).map((row: Record<string, unknown>) => ({
            id: row.id,
            nombre: row.nombre,
            direccion: row.direccion,
            telefono: row.telefono,
            email: row.email,
            website: row.website,
            categoria: row.categoria,
            rating: row.rating,
            totalReviews: row.total_reviews,
            placeId: row.place_id,
            emailStatus: row.email_status || 'pending',
            generatedSubject: row.generated_subject,
            generatedHtml: row.generated_html,
            sentAt: row.sent_at,
        }));

        return NextResponse.json({ leads });
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
