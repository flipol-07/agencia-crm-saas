'use server'

import { createClient } from '@/lib/supabase/server'

export interface ContactBrief {
    health: 'hot' | 'warm' | 'cold' | 'risk'
    headline: string
    contextSummary: string
    nextBestAction: string
    suggestedMessage: string
    risks: string[]
    opportunities: string[]
}

export async function generateContactBriefAction(contactId: string): Promise<ContactBrief> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('No autorizado')
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    const { data: contact, error: contactError } = await (supabase.from('contacts') as any)
        .select('*')
        .eq('id', contactId)
        .single()

    if (contactError || !contact) {
        throw new Error('Contacto no encontrado')
    }

    const [emailsResult, meetingsResult, tasksResult, invoicesResult] = await Promise.all([
        (supabase.from('contact_emails') as any)
            .select('subject, snippet, direction, received_at, created_at')
            .eq('contact_id', contactId)
            .order('received_at', { ascending: false })
            .limit(8),
        (supabase.from('meetings') as any)
            .select('title, date, summary, key_points, conclusions')
            .eq('contact_id', contactId)
            .order('date', { ascending: false })
            .limit(5),
        (supabase.from('tasks') as any)
            .select('title, description, priority, status, is_completed, due_date')
            .eq('contact_id', contactId)
            .order('due_date', { ascending: true })
            .limit(8),
        (supabase.from('invoices') as any)
            .select('invoice_number, status, total, issue_date, due_date')
            .eq('contact_id', contactId)
            .order('issue_date', { ascending: false })
            .limit(5),
    ])

    const systemPrompt = `Eres un director comercial y consultor senior usando un CRM.
Analiza el contexto de un cliente y devuelve SOLO JSON válido:
{
  "health": "hot" | "warm" | "cold" | "risk",
  "headline": "máximo 90 caracteres",
  "contextSummary": "resumen ejecutivo de 2 frases",
  "nextBestAction": "acción concreta para hoy",
  "suggestedMessage": "mensaje breve listo para enviar al cliente",
  "risks": ["máximo 3 riesgos"],
  "opportunities": ["máximo 3 oportunidades"]
}

Criterios:
- hot: alta probabilidad, respuesta reciente o venta cercana.
- warm: oportunidad activa pero necesita seguimiento.
- cold: poco contexto o sin movimiento.
- risk: factura vencida, bloqueo, cliente parado o señal negativa.
- Sé directo, útil y orientado a empresa. No inventes datos.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: JSON.stringify({
                        contact,
                        recentEmails: emailsResult.data || [],
                        meetings: meetingsResult.data || [],
                        tasks: tasksResult.data || [],
                        invoices: invoicesResult.data || [],
                    })
                }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
        }),
    })

    if (!response.ok) {
        throw new Error(`AI API error: ${await response.text()}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) throw new Error('No content from AI')

    return normalizeBrief(JSON.parse(content))
}

function normalizeBrief(raw: Partial<ContactBrief>): ContactBrief {
    const allowedHealth = ['hot', 'warm', 'cold', 'risk'] as const
    const health = allowedHealth.includes(raw.health as any) ? raw.health as ContactBrief['health'] : 'warm'

    return {
        health,
        headline: raw.headline || 'Cliente pendiente de revisión',
        contextSummary: raw.contextSummary || 'No hay suficiente contexto para una síntesis completa.',
        nextBestAction: raw.nextBestAction || 'Revisar el historial y definir el siguiente paso comercial.',
        suggestedMessage: raw.suggestedMessage || 'Hola, quería hacer seguimiento y ver cómo podemos avanzar.',
        risks: Array.isArray(raw.risks) ? raw.risks.slice(0, 3) : [],
        opportunities: Array.isArray(raw.opportunities) ? raw.opportunities.slice(0, 3) : [],
    }
}
