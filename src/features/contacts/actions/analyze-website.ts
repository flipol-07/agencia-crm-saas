'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface AnalysisResult {
    description: string
    error?: string
}

export async function analyzeWebsite(url: string, contactId: string): Promise<AnalysisResult> {
    try {
        if (!url) throw new Error('URL requerida')

        const apiKey = process.env.PERPLEXITY_API_KEY
        if (!apiKey) throw new Error('API Key de Perplexity no configurada')

        // Asegurar que la URL tenga protocolo
        const safeUrl = url.startsWith('http') ? url : `https://${url}`

        const prompt = `Analiza el sitio web ${safeUrl}. 
        Genera una descripción breve (máximo 3 líneas) explicando:
        1. Qué hace la empresa (modelo de negocio).
        2. Qué servicios principales ofrecen.
        3. A qué público se dirigen.
        
        Responde DIRECTAMENTE con la descripción, sin introducciones tipo "Aquí tienes el análisis". 
        Usa un tono profesional y directo de analista de negocios.`

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'sonar', // Modelo rápido con búsqueda online
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un analista de negocios experto. Tu trabajo es extraer la esencia comercial de sitios web para un CRM.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Perplexity Error:', errorText)
            throw new Error('Error al conectar con el servicio de análisis')
        }

        const data = await response.json()
        const aiDescription = data.choices[0]?.message?.content?.trim()

        if (!aiDescription) throw new Error('No se pudo generar el análisis')

        // Guardar en base de datos
        const supabase = await createClient()
        const { error: dbError } = await (supabase.from('contacts') as any)
            .update({ ai_description: aiDescription })
            .eq('id', contactId)

        if (dbError) throw new Error(dbError.message)

        revalidatePath('/contacts')
        revalidatePath(`/contacts/${contactId}`)

        return { description: aiDescription }

    } catch (error) {
        console.error('Analyze Website Error:', error)
        return {
            description: '',
            error: error instanceof Error ? error.message : 'Error desconocido'
        }
    }
}
