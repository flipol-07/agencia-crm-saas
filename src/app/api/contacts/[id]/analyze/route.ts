import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeContact } from '@/features/contacts/services/contact-ai.service';
import { z } from 'zod';

const ANALYSIS_COOLDOWN_MS = 60_000; // 1 análisis por contacto por minuto.

const idSchema = z.string().uuid('ID de contacto inválido');

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: rawId } = await params;
        const parsedId = idSchema.safeParse(rawId);
        if (!parsedId.success) {
            return NextResponse.json({ error: parsedId.error.issues[0].message }, { status: 400 });
        }
        const id = parsedId.data;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ownership: el usuario debe ser created_by o assigned_to.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: contactRow, error: ownerError } = await (supabase.from('contacts') as any)
            .select('id, last_analyzed_at')
            .eq('id', id)
            .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
            .maybeSingle();

        if (ownerError || !contactRow) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Rate limit per-contact basado en last_analyzed_at.
        const last = contactRow.last_analyzed_at ? Date.parse(contactRow.last_analyzed_at) : 0;
        const elapsed = Date.now() - last;
        if (elapsed > 0 && elapsed < ANALYSIS_COOLDOWN_MS) {
            const retryIn = Math.ceil((ANALYSIS_COOLDOWN_MS - elapsed) / 1000);
            return NextResponse.json(
                { error: `Espera ${retryIn}s antes de reanalizar este contacto.` },
                { status: 429, headers: { 'Retry-After': String(retryIn) } }
            );
        }

        const result = await analyzeContact(id);
        return NextResponse.json(result);

    } catch (error) {
        console.error('Analysis Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
