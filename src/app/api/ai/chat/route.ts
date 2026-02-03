import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { messages, timezone } = body;

        // Definición de Herramientas
        const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
            {
                type: 'function',
                function: {
                    name: 'get_recent_expenses',
                    description: 'Gastos recientes (¿Cuánto hemos gastado?)',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_recent_invoices',
                    description: 'Facturas recientes y su estado.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_recent_leads',
                    description: 'Leads capturados por el scraper.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_scraper_campaigns',
                    description: 'Campañas de prospección activas.',
                    parameters: { type: 'object', properties: {} },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_contacts',
                    description: 'Buscar clientes/contactos en el CRM.',
                    parameters: { type: 'object', properties: { query: { type: 'string' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_projects',
                    description: 'Proyectos actuales y su progreso.',
                    parameters: { type: 'object', properties: { status: { type: 'string' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_tasks',
                    description: 'Tareas pendientes o completadas.',
                    parameters: { type: 'object', properties: { is_completed: { type: 'boolean' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_team',
                    description: 'Miembros del equipo de la agencia.',
                    parameters: { type: 'object', properties: {} },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_recent_messages',
                    description: 'Emails con clientes y mensajes de chat.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_team_messages',
                    description: 'Mensajes de chat interno del equipo.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_knowledge_base',
                    description: 'Consultar biblioteca experta (Marketing, UX, Negocios).',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string' },
                            category: { type: 'string', enum: ['marketing', 'design', 'business'] }
                        },
                        required: ['query']
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_meetings',
                    description: 'Buscar en transcripciones y resúmenes de reuniones.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string' },
                            contact_name: { type: 'string' }
                        },
                        required: ['query']
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'learn_from_user',
                    description: 'Guardar nuevos datos o preferencias en memoria a largo plazo.',
                    parameters: {
                        type: 'object',
                        properties: {
                            fact: { type: 'string' },
                            category: { type: 'string' }
                        },
                        required: ['fact']
                    },
                },
            },
        ];

        // Contexto del usuario
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, professional_role, professional_description')
            .eq('id', user.id)
            .single();

        const userProfile = profile as any;

        const systemPrompt = `Eres Aura AI, la Consultora Senior de Aurie CRM. 
        Eres experta en Marketing B2B, UX/UI y Estrategia de Negocio.

        USUARIO:
        - Nombre: ${userProfile?.full_name || 'Usuario'}
        - Rol: ${userProfile?.professional_role || 'No especificado'}
        - Contexto: ${userProfile?.professional_description || 'No definido'}

        TIENES ACCESO TOTAL (vía herramientas) A:
        1. CRM: Contactos, Proyectos, Tareas, Gastos e Invoices.
        2. Comunicación: Emails con clientes, chat interno y reuniones (transcripciones).
        3. Prospección: Campañas de scraping y leads capturados.
        4. Equipo: Miembros de la agencia.
        5. Conocimiento: Base experta y memoria compartida.

        REGLAS DE ORO:
        - Adapta siempre tus consejos al ROL e INTERESES del usuario (Marketing vs Diseño vs Gestión).
        - Sé proactiva: Si ves algo relevante en los datos (gastos altos, tareas atrasadas, un lead caliente), menciónalo.
        - Usa Markdown para respuestas escaneables.
        - Si algo no lo sabes o no tienes la herramienta, dilo con honestidad.
        - Timezone: ${timezone || 'UTC'}. User ID: ${user.id}.`;

        // Primera llamada (para detectar tool_calls)
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            tools,
            tool_choice: 'auto',
        });

        const responseMessage = response.choices[0].message;

        // Si NO hay tool_calls, podemos hacer un streaming de una nueva llamada o simplemente retornar
        // Pero para ser consistentes, si no hay tools, volvemos a llamar con stream: true
        if (!responseMessage.tool_calls) {
            const stream = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                stream: true,
            });
            return new Response(createOpenAIStream(stream));
        }

        // Si HAY tool_calls, los procesamos y luego streameamos el final
        const toolCalls = responseMessage.tool_calls;
        messages.push(responseMessage);

        for (const toolCall of toolCalls) {
            const tc = toolCall as any;
            const functionName = tc.function.name;
            const functionArgs = JSON.parse(tc.function.arguments);
            let toolResult = '';

            if (functionName === 'get_recent_expenses') {
                const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(functionArgs.limit || 10);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_recent_invoices') {
                const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(functionArgs.limit || 5);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_recent_leads') {
                const { data } = await supabase.from('scraper_leads').select('*').order('created_at', { ascending: false }).limit(functionArgs.limit || 5);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'search_contacts') {
                const q = functionArgs.query || '';
                let query = supabase.from('contacts').select('*');
                if (q) query = query.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%`);
                const { data } = await query.limit(20);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_projects') {
                let query = supabase.from('projects').select('*');
                if (functionArgs.status) query = query.eq('status', functionArgs.status);
                const { data } = await query.order('updated_at', { ascending: false });
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_tasks') {
                let query = supabase.from('tasks').select('*, projects(name)');
                if (functionArgs.is_completed !== undefined) query = query.eq('is_completed', functionArgs.is_completed);
                const { data } = await query.order('due_date', { ascending: true }).limit(20);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_scraper_campaigns') {
                const { data } = await supabase.from('scraper_campaigns').select('*').order('created_at', { ascending: false });
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_team') {
                const { data } = await supabase.from('profiles').select('id, full_name, professional_role, email, avatar_url');
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_recent_messages') {
                const { data } = await supabase.from('contact_emails').select('*').order('received_at', { ascending: false }).limit(functionArgs.limit || 10);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_team_messages') {
                const { data } = await supabase.from('team_messages').select('content, created_at, sender_id').order('created_at', { ascending: false }).limit(functionArgs.limit || 20);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'search_knowledge_base') {
                const queryText = functionArgs.query;

                // 1. Generate embedding for the search
                const embeddingResponse = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: queryText,
                });
                const embedding = embeddingResponse.data[0].embedding;

                // 2. Call the RPC function in Supabase
                const { data: searchResults, error: searchError } = await (supabase.rpc as any)('match_ai_knowledge', {
                    query_embedding: embedding,
                    match_threshold: 0.5,
                    match_count: 5,
                    category_filter: functionArgs.category || null
                });

                if (searchError) {
                    console.error('Search error:', searchError);
                    toolResult = 'Error consultando la base de conocimientos.';
                } else {
                    toolResult = JSON.stringify(searchResults);
                }
            } else if (functionName === 'search_meetings') {
                const q = functionArgs.query || '';
                // Changed: Added transcription to the selection list
                let query = supabase.from('meetings').select('title, date, summary, transcription, key_points, conclusions, contacts(company_name)');

                if (functionArgs.contact_name) {
                    // First find contact IDs matching name
                    const { data: contacts } = await supabase.from('contacts').select('id').ilike('company_name', `%${functionArgs.contact_name}%`);
                    if (contacts && contacts.length > 0) {
                        const ids = contacts.map((c: any) => c.id);
                        query = query.in('contact_id', ids);
                    }
                }

                if (q) {
                    // Use plain text search on text fields
                    query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,transcription.ilike.%${q}%`);
                }
                const { data } = await query.order('date', { ascending: false }).limit(3); // Helper to limit context size since transcription is heavy
                toolResult = JSON.stringify(data);
            } else if (functionName === 'learn_from_user') {
                const { fact, category = 'user_learning' } = functionArgs;

                try {
                    // 1. Create a document for this fact
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data: doc, error: docError } = await (supabase.from('ai_knowledge_documents') as any)
                        .insert({
                            title: `Aprendizaje: ${fact.substring(0, 30)}...`,
                            source_url: 'user_chat',
                            category: category
                        })
                        .select()
                        .single();

                    if (docError) throw docError;

                    // 2. Generate embedding
                    const embeddingResponse = await openai.embeddings.create({
                        model: 'text-embedding-3-small',
                        input: fact,
                    });
                    const embedding = embeddingResponse.data[0].embedding;

                    // 3. Store chunk
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error: chunkError } = await (supabase.from('ai_knowledge_chunks') as any)
                        .insert({
                            document_id: doc.id,
                            content: fact,
                            embedding: embedding,
                            metadata: { source: 'user_interaction', date: new Date().toISOString() }
                        });

                    if (chunkError) throw chunkError;

                    toolResult = JSON.stringify({ success: true, message: 'Información aprendida y guardada correctamente.' });
                } catch (error: any) {
                    console.error('Learning error:', error);
                    toolResult = JSON.stringify({ success: false, error: error.message });
                }
            }

            messages.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: toolResult || '[]',
            });
        }

        // Ahora streameamos la respuesta final después de los tools
        const finalStream = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            stream: true,
        });

        return new Response(createOpenAIStream(finalStream));

    } catch (error) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// Helper para convertir el stream de OpenAI en un ReadableStream de browser
function createOpenAIStream(openAiStream: any) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            for await (const chunk of openAiStream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    controller.enqueue(encoder.encode(content));
                }
            }
            controller.close();
        },
    });
}
