'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'
import os from 'os'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic)
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Función interna para analizar el texto de la reunión con GPT-4o
 */
export async function analyzeMeetingText(transcriptionText: string) {
    const systemPrompt = `Eres un experto consultor de ventas y analista de reuniones.
Analiza la siguiente transcripción (que puede ser un diálogo con nombres de personas o un texto plano).

Debes generar un JSON con la siguiente estructura:
{
  "summary": "Resumen ejecutivo del acuerdo/reunión",
  "key_points": ["Punto 1", "Punto 2"],
  "conclusions": ["Acuerdo A", "Tarea B"],
  "feedback": {
    "seller_feedback": [
        { "name": "Nombre del vendedor", "improvements": ["Cosa a mejorar 1", "Cosa a mejorar 2"] }
    ],
    "general_feedback": "Feedback general del equipo de ventas",
    "customer_sentiment": "Breve análisis de cómo se sentía el cliente (interés, dudas, etc.)"
  }
}

REGLAS DE ANÁLISIS:
1. Si detectas nombres de personas (estilo guión: "Juan: Hola..." o "0:00 - Juan: Hola..."), identifica quiénes son vendedores y quiénes clientes.
2. Proporciona sugerencias de mejora PERSONALIZADAS para cada vendedor en "seller_feedback".
3. Si NO hay nombres (texto plano de Whisper), da un "general_feedback" analizando la estrategia de venta global.
4. "customer_sentiment" debe ser un feedback simple de lo que proyectaba el cliente.

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
    const title = formData.get('title') as string
    const date = formData.get('date') as string
    const contactId = formData.get('contactId') as string || null

    if (!filePath || !title || !date) {
        return { error: 'Faltan datos requeridos' }
    }

    const supabase = await createClient()
    const tempDir = os.tmpdir()
    const inputPath = path.join(tempDir, `input-${Date.now()}-${filePath}`)
    const outputPath = path.join(tempDir, `output-${Date.now()}.mp3`)

    try {
        console.log('1. Descargando archivo...')
        const { data: fileBlob, error: downloadError } = await supabase
            .storage
            .from('meetings-temp')
            .download(filePath)

        if (downloadError) throw new Error(`Error descargando archivo: ${downloadError.message}`)

        const buffer = Buffer.from(await fileBlob.arrayBuffer())
        fs.writeFileSync(inputPath, buffer)

        const isText = filePath.toLowerCase().endsWith('.txt')
        let transcriptionText = ''

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
                    await new Promise((resolve, reject) => {
                        ffmpeg(inputPath)
                            .toFormat('mp3')
                            .audioChannels(1)
                            .audioBitrate('32k')
                            .on('end', () => resolve(null))
                            .on('error', (err) => reject(err))
                            .save(outputPath)
                    })
                    finalAudioPath = outputPath
                } catch (ffmpegErr) {
                    console.warn('FFmpeg falló, intentando transcripción directa...')
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

        // Cleanup temp files
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        } catch (e) { }
        await supabase.storage.from('meetings-temp').remove([filePath]).catch(console.error)

        // 5. Analysis
        console.log('5. Analizando con GPT-4o...')
        const analysis = await analyzeMeetingText(transcriptionText)

        // 6. Save to DB
        const { error: dbError } = await (supabase.from('meetings') as any).insert({
            title,
            date,
            contact_id: contactId && contactId !== 'null' ? contactId : null,
            transcription: transcriptionText,
            summary: analysis.summary,
            key_points: analysis.key_points,
            conclusions: analysis.conclusions,
            feedback: analysis.feedback
        })

        if (dbError) throw new Error(`Error guardando en DB: ${dbError.message}`)

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
