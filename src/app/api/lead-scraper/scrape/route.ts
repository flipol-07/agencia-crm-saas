/**
 * API Route: Scraping de Leads
 * POST /api/lead-scraper/scrape
 */

import { NextRequest, NextResponse } from 'next/server';
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

        const scraperService = createLeadScraperService();
        const leads = await scraperService.runScraping(campaignId);

        return NextResponse.json({
            success: true,
            leadsCount: leads.length,
            leadsWithEmail: leads.filter(l => l.email).length,
        });

    } catch (error) {
        console.error('Error en scraping:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
