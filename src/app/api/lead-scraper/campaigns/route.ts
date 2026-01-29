/**
 * API Route: GET/POST /api/lead-scraper/campaigns
 * 
 * Gestiona campañas de scraping
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('scraper_campaigns')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Mapear a formato Campaign
        const campaigns = (data || []).map((row: Record<string, unknown>) => ({
            id: row.id,
            name: row.name,
            status: row.status,
            searchConfig: row.search_config,
            leadsCount: row.leads_count || 0,
            emailsSent: row.emails_sent || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));

        return NextResponse.json({ campaigns });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, searchConfig } = body;

        if (!name || !searchConfig) {
            return NextResponse.json(
                { error: 'Nombre y configuración de búsqueda requeridos' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('scraper_campaigns')
            .insert({
                user_id: user.id,
                name,
                search_config: searchConfig,
                status: 'draft',
                leads_count: 0,
                emails_sent: 0,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        const campaign = {
            id: data.id,
            name: data.name,
            status: data.status,
            searchConfig: data.search_config,
            leadsCount: data.leads_count || 0,
            emailsSent: data.emails_sent || 0,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
