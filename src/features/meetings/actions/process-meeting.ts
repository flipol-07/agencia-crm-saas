'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'
import os from 'os'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Función interna para analizar el texto de la reunión con GPT-4o
 */
export async function analyzeMeetingText(transcriptionText: string, profiles: { full_name: string | null, email: string }[] = []) {
    const profilesContext = profiles
        .filter(p => p.full_name)
        .map(p => `- ${p.full_name} (${p.email})`)
        .join('\n')

    const systemPrompt = `Eres un experto consultor de ventas y analista de reuniones.
Analiza la siguiente transcripción (que puede ser un diálogo con nombres de personas o un texto plano).

CONTEXTO DE USUARIOS DE LA APP (Equipo Interno):
${profilesContext}

Debes generar un JSON con la siguiente estructura:
{
  "title": "Título corto y descriptivo de la reunión (3-5 palabras)",
  "summary": "Resumen ejecutivo del acuerdo/reunión",
  "attendees": ["Juan Pérez (Vendedor)", "María López (Cliente)"],
  "key_points": ["Punto 1", "Punto 2"],
  "conclusions": ["Acuerdo A", "Tarea B"],
  "tasks": [
    { "title": "Nombre de la tarea", "description": "Descripción detallada", "priority": "low" | "medium" | "high" }
  ],
  "feedback": {
    "seller_feedback": [
      { "name": "Nombre del vendedor", "improvements": ["Cosa a mejorar 1", "Cosa a mejorar 2"] }
    ],
    "general_feedback": "Feedback general del equipo de ventas",
    "customer_sentiment": "Breve análisis de cómo se sentía el cliente (interés, dudas, etc.)"
  }
}

REGLAS DE ANÁLISIS:
1. IDENTIFICACIÓN DE ASISTENTES:
   - Extrae los nombres de los participantes del diálogo o del contexto.
   - Compara los nombres encontrados con la lista "CONTEXTO DE USUARIOS DE LA APP".
   - Si encuentras un nombre parcial (ej: "Antón", "Loredo") que coincida con un usuario de la lista, USA EL NOMBRE COMPLETO DEL USUARIO (ej: "Antón Loredo").
   - REGLA ESPECÍFICA: Si en la transcripción aparece "Aurie" o "Auri", DEBES mapearlo al usuario "Antón Loredo" (si existe en la lista) o al nombre más similar del equipo.
   - Si es un cliente externo (no está en la lista), mantén su nombre original y añade "(Cliente)" o "(Externo)" si es evidente.

2. Si detectas nombres de personas (estilo guión: "Juan: Hola..." o "0:00 - Juan: Hola..."), úsalos para populate "attendees" y "seller_feedback".
3. Proporciona sugerencias de mejora PERSONALIZADAS para cada vendedor en "seller_feedback".
4. Si NO hay nombres (texto plano de Whisper), da un "general_feedback" analizando la estrategia de venta global y deja "attendees" vacío o con "Desconocido".
5. "customer_sentiment" debe ser un feedback simple de lo que proyectaba el cliente.
6. EXTRACCIÓN DE TAREAS: Identifica tareas EXPLÍCITAS mencionadas en la reunión. Busca especialmente frases como "Crea una tarea...", "Recuérdame que...", "Te envío...", "Tengo que...". Crea objetos claros en el array "tasks". Si no hay tareas claras, devuelve un array vacío.

Responde ÚNICAMENTE con el objeto JSON.`

    const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcriptionText.substring(0, 100000) }
        ],
        response_format: { type: 'json_object' }
    })

    const content = summaryResponse.choices[0].message.content
    if (!content) throw new Error('No se generó análisis de IA')

    return JSON.parse(content)
}

export async function processMeeting(formData: FormData) {
    const filePath = formData.get('filePath') as string
    const transcriptTextDirect = formData.get('transcriptText') as string
    const title = formData.get('title') as string
    const date = formData.get('date') as string
    const contactId = formData.get('contactId') as string || null

    if ((!filePath && !transcriptTextDirect) || !title || !date) {
        return { error: 'Faltan datos requeridos (archivo o texto)' }
    }

    const supabase = await createClient()
    const tempDir = os.tmpdir()
    const inputPath = path.join(tempDir, `input-${Date.now()}-${filePath || 'direct-text.txt'}`)
    const outputPath = path.join(tempDir, `output-${Date.now()}.mp3`)

    try {
        let transcriptionText = ''
        if (transcriptTextDirect) {
            console.log('2. Usando texto enviado directamente.')
            transcriptionText = transcriptTextDirect
        } else {
            console.log('1. Descargando archivo...')
            const { data: fileBlob, error: downloadError } = await supabase
                .storage
                .from('meetings-temp')
                .download(filePath)

            if (downloadError) throw new Error(`Error descargando archivo: ${downloadError.message}`)

            const buffer = Buffer.from(await fileBlob.arrayBuffer())
            fs.writeFileSync(inputPath, buffer)

            const isText = filePath.toLowerCase().endsWith('.txt')

            if (isText) {
                console.log('2. El archivo es de texto (Transcripción directa).')
                transcriptionText = fs.readFileSync(inputPath, 'utf8')
            } else {
                // Lógica para Video/Audio
                const isAudio = fileBlob.type.startsWith('audio/') || filePath.endsWith('.mp3')
                let finalAudioPath = inputPath

                if (!isAudio) {
                    console.log('2. Extrayendo audio con FFmpeg...')
                    try {
                        // Dynamic import to avoid build-side static analysis issues
                        const ffmpeg = (await import('fluent-ffmpeg')).default
                        const ffmpegStatic = (await import('ffmpeg-static')).default

                        if (ffmpegStatic) {
                            ffmpeg.setFfmpegPath(ffmpegStatic)
                        }

                        await new Promise((resolve, reject) => {
                            ffmpeg(inputPath)
                                .toFormat('mp3')
                                .audioChannels(1)
                                .audioBitrate('32k')
                                .on('end', () => resolve(null))
                                .on('error', (err: any) => reject(err))
                                .save(outputPath)
                        })
                        finalAudioPath = outputPath
                    } catch (ffmpegErr) {
                        console.warn('FFmpeg falló, intentando transcripción directa...', ffmpegErr)
                    }
                }

                console.log(`3. Enviando a Whisper...`)
                const audioStream = fs.createReadStream(finalAudioPath)
                const transcriptionResponse = await openai.audio.transcriptions.create({
                    file: audioStream,
                    model: 'whisper-1',
                    response_format: 'text',
                })
                transcriptionText = typeof transcriptionResponse === 'string'
                    ? transcriptionResponse
                    : (transcriptionResponse as any).text || JSON.stringify(transcriptionResponse)
            }
        }

        // Cleanup temp files
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        } catch (e) { }
        await supabase.storage.from('meetings-temp').remove([filePath]).catch(console.error)

        // 5. Analysis
        console.log('5. Analizando con GPT-4o...')
        const { data: profiles } = await supabase.from('profiles').select('full_name, email')
        const analysis = await analyzeMeetingText(transcriptionText, profiles || [])

        // 6. Formatear título con fecha
        const meetingDate = new Date(date)
        const formattedDate = meetingDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const finalTitle = analysis.title ? `${analysis.title} (${formattedDate})` : `${title} (${formattedDate})`

        // 7. Evitar duplicados manuales
        const { data: existing } = await supabase
            .from('meetings')
            .select('id')
            .eq('title', finalTitle)
            .eq('date', date)
            .maybeSingle()

        if (existing) {
            console.log('Reunión manual ya existe, saltando:', finalTitle)
            return { success: true, message: 'Reunión ya existente' }
        }

        // 6. Save to DB
        const { data: meetingData, error: dbError } = await (supabase.from('meetings') as any).insert({
            title: finalTitle,
            date,
            contact_id: contactId && contactId !== 'null' ? contactId : null,
            transcription: transcriptionText,
            summary: analysis.summary,
            key_points: analysis.key_points,
            conclusions: analysis.conclusions,
            feedback: { ...analysis.feedback, attendees: analysis.attendees },
            status: 'completed'
        }).select().single()

        if (dbError) throw new Error(`Error guardando en DB: ${dbError.message}`)

        // 7. Extract and Save Tasks
        if (analysis.tasks && Array.isArray(analysis.tasks) && analysis.tasks.length > 0) {
            console.log(`7. Creando ${analysis.tasks.length} tareas extraídas...`)
            const tasksToInsert = analysis.tasks.map((t: any) => ({
                title: `${t.title} (R)`,
                description: t.description,
                priority: t.priority || 'medium',
                status: 'todo',
                contact_id: contactId && contactId !== 'null' ? contactId : null,
                meeting_id: meetingData.id,
                is_completed: false
            }))

            const { error: tasksError } = await (supabase.from('tasks') as any).insert(tasksToInsert)
            if (tasksError) {
                console.error('Error creando tareas automáticas:', tasksError)
                // No lanzamos error global para no fallar el procesamiento de la reunión
            }
        }

        revalidatePath('/meetings')
        return { success: true }

    } catch (error: any) {
        console.error('Processing error:', error)
        try {
            await supabase.storage.from('meetings-temp').remove([filePath])
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        } catch { }
        return { error: error.message || 'Error desconocido' }
    }
}
