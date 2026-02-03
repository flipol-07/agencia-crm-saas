import { createAdminClient } from '@/lib/supabase/admin';
import { AiMemoryService } from '@/shared/services/ai-memory.service';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function syncEmbeddings() {
    console.log('🚀 Iniciando sincronización masiva de embeddings...');
    const supabase = createAdminClient();

    // 1. Sincronizar Emails
    console.log('📬 Procesando emails de contactos...');
    const { data: emails, error: emailError } = await (supabase.from('contact_emails') as any)
        .select('id, subject, body_text, snippet')
        .order('received_at', { ascending: false });

    if (emailError) {
        console.error('Error fetching emails:', emailError);
    } else {
        for (const email of (emails as any[]) || []) {
            const content = `Asunto: ${email.subject}\n\nContenido: ${email.body_text || email.snippet}`;
            try {
                // Verificar si ya existe
                const { data: existing } = await (supabase
                    .from('embeddings') as any)
                    .select('id')
                    .eq('entity_id', email.id)
                    .eq('entity_type', 'email')
                    .maybeSingle();

                if (!existing) {
                    await AiMemoryService.storeMemory({
                        content,
                        entity_type: 'email',
                        entity_id: email.id,
                        metadata: { subject: email.subject }
                    }, supabase);
                    console.log(`✅ Embedding generado para email: ${email.subject}`);
                }
            } catch (err) {
                console.error(`❌ Error con email ${email.id}:`, err);
            }
        }
    }

    // 2. Sincronizar Reuniones
    console.log('🤝 Procesando reuniones...');
    const { data: meetings, error: meetingError } = await (supabase.from('meetings') as any)
        .select('id, title, summary, transcription');

    if (meetingError) {
        console.error('Error fetching meetings:', meetingError);
    } else {
        for (const meeting of (meetings as any[]) || []) {
            const content = `Reunión: ${meeting.title}\n\nResumen: ${meeting.summary}\n\nTranscripción: ${meeting.transcription}`;
            try {
                // Verificar si ya existe
                const { data: existing } = await (supabase
                    .from('embeddings') as any)
                    .select('id')
                    .eq('entity_id', meeting.id)
                    .eq('entity_type', 'meeting')
                    .maybeSingle();

                if (!existing) {
                    await AiMemoryService.storeMemory({
                        content,
                        entity_type: 'meeting',
                        entity_id: meeting.id,
                        metadata: { title: meeting.title }
                    }, supabase);
                    console.log(`✅ Embedding generado para reunión: ${meeting.title}`);
                }
            } catch (err) {
                console.error(`❌ Error con reunión ${meeting.id}:`, err);
            }
        }
    }

    console.log('🏁 Sincronización completada.');
}

syncEmbeddings().catch(console.error);
