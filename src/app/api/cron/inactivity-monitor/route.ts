import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeContact } from '@/features/contacts/services/contact-ai.service';
import { WhatsAppService } from '@/shared/lib/whatsapp';
import { Contact } from '@/types/database';



export async function GET(request: NextRequest) {
    // 1. Simple Security Guard
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Allow if secret matches env var OR if authorized user (for manual trigger)
    // For this implementation, we rely on a CRON_SECRET env var or a hardcoded fallback for dev
    const CRON_SECRET = process.env.CRON_SECRET || 'aurie-maquina-2026';

    if (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    try {
        // 2. Find Candidates
        // Logic: No interaction in > 14 days AND (Never analyzed OR Analyzed > 7 days ago)

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Supabase doesn't support complex OR logic easily on joined filters
        // Fetching potential candidates first
        const { data: candidates, error } = await supabase
            .from('contacts')
            .select('*')
            .lt('last_interaction', fourteenDaysAgo.toISOString())
            .or(`last_analyzed_at.is.null,last_analyzed_at.lt.${sevenDaysAgo.toISOString()}`)
            .limit(5); // Process in batches to avoid timeouts

        if (error) throw error;
        if (!candidates || candidates.length === 0) {
            return NextResponse.json({ message: 'No candidates found for analysis', processed: 0 });
        }

        const results = [];

        // 3. Process Candidates
        for (const contactData of candidates) {
            const contact = contactData as Contact;
            console.log(`Analyzing contact: ${contact.company_name} (${contact.id})`);

            try {
                // Run AI Analysis
                const analysis = await analyzeContact(contact.id);

                // 4. Alerting Logic
                if (analysis.inactivity_status === 'warning' || analysis.inactivity_status === 'inactive') {

                    const emoji = analysis.inactivity_status === 'inactive' ? '💤' : '⚠️';
                    const message = `${emoji} *Alerta de Inactividad: ${contact.company_name}*\n` +
                        `📅 Último contacto: ${new Date(contact.last_interaction!).toLocaleDateString()}\n` +
                        `🤖 *Motivo IA:* ${analysis.analysis_summary}\n\n` +
                        `💡 *Sugerencia:* ${analysis.ai_suggestions[0]?.action}\n` +
                        `👉 Ver ficha: https://agencia-crm-saas.vercel.app/contacts/${contact.id}`;

                    // Send WhatsApp
                    await WhatsAppService.sendMessage(message);

                    results.push({
                        contact: contact.company_name,
                        status: 'alerted',
                        risk: analysis.inactivity_status
                    });
                } else {
                    results.push({
                        contact: contact.company_name,
                        status: 'analyzed_safe'
                    });
                }

            } catch (err) {
                console.error(`Failed to analyze contact ${contact.id}`, err);
                results.push({ contact: contact.company_name, status: 'error', error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            processed: candidates.length,
            details: results
        });

    } catch (error) {
        console.error('Cron Job Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
