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
                    description: 'Obtiene los últimos gastos. Útil para "¿Cuánto gasté?".',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_recent_invoices',
                    description: 'Obtiene las últimas facturas.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_recent_leads',
                    description: 'Obtiene los últimos leads.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_contacts',
                    description: 'Busca contactos por nombre, empresa o email.',
                    parameters: { type: 'object', properties: { query: { type: 'string' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_projects',
                    description: 'Obtiene proyectos.',
                    parameters: { type: 'object', properties: { status: { type: 'string' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_tasks',
                    description: 'Obtiene tareas.',
                    parameters: { type: 'object', properties: { is_completed: { type: 'boolean' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_documents',
                    description: 'Lista documentos.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'get_recent_messages',
                    description: 'Historial de mensajes/emails.',
                    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_knowledge_base',
                    description: 'Busca en la biblioteca experta de Aura. Útil para consejos de marketing, diseño, gestión de proyectos B2B y trato al cliente.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'La consulta o duda conceptual.' },
                            category: { type: 'string', enum: ['marketing', 'design', 'business'], description: 'Opcional: filtrar por categoría.' }
                        },
                        required: ['query']
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'search_meetings',
                    description: 'Busca en las transcripciones, resúmenes y puntos clave de las reuniones. Útil para recordar qué se habló con un cliente.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Término de búsqueda o tema' },
                            contact_name: { type: 'string', description: 'Nombre de la empresa/contacto para filtrar' }
                        },
                        required: ['query']
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'learn_from_user',
                    description: 'Aprende nueva información proporcionada por el usuario y la guarda en la base de conocimientos para el futuro.',
                    parameters: {
                        type: 'object',
                        properties: {
                            fact: { type: 'string', description: 'La información o hecho a aprender.' },
                            category: { type: 'string', description: 'Categoría opcional (ej: preferencia_usuario, regla_negocio, correccion).' }
                        },
                        required: ['fact']
                    },
                },
            },
        ];

        const systemPrompt = `Eres Aura AI, la Consultora Experta Senior de esta agencia. 
        No eres solo una interfaz de datos; eres una estratega experta en Marketing B2B, Diseño Web Premium (UX/UI), Gestión de Proyectos y Éxito del Cliente.

        CAPACIDADES ESPECIALES:
        1. Base de Conocimientos: Tienes acceso a una biblioteca de formación avanzada vía 'search_knowledge_base'. Úsala SIEMPRE que el usuario pida consejos, estrategias o mejores prácticas.
        2. Datos en Tiempo Real: Tienes acceso a los datos del CRM (Leads, Gastos, Proyectos, etc.).
        3. Aprendizaje Continuo: Si el usuario te corrige o te enseña algo nuevo, USA la herramienta 'learn_from_user' para guardarlo. Dile explícitamente "He guardado esta nueva información en mi memoria".
        4. Acceso a Reuniones: Tienes acceso completo a las transcripciones de reuniones. Si te preguntan algo específico (ej: "¿Quién asistió?"), lee la transcripción para encontrar la respuesta.
        
        TONO Y ESTILO:
        - Profesional, proactiva y orientada a resultados.
        - Usa Markdown para estructuras claras (encabezados, listas, negritas).
        - Si el usuario pregunta algo general, busca en tu base de conocimientos para dar una respuesta basada en principios expertos, no solo en conocimiento general de GPT.
        - Siempre menciona en qué te basas (ej: "Basándome en los principios de diseño 2024..." o "Siguiendo estrategias de marketing B2B...").
        
        El usuario actual tiene ID: ${user.id}.
        Zona horaria: ${timezone || 'UTC'}.`;

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
            } else if (functionName === 'get_documents') {
                const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(functionArgs.limit || 10);
                toolResult = JSON.stringify(data);
            } else if (functionName === 'get_recent_messages') {
                const { data } = await supabase.from('contact_emails').select('*').order('received_at', { ascending: false }).limit(functionArgs.limit || 10);
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
