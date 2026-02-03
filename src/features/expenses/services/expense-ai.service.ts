import { Sector, ExpenseCategory } from '../types'

interface ClassifyExpenseParams {
    description: string
    sectors: Sector[]
    categories: ExpenseCategory[]
    type: 'expense' | 'income'
}

interface ClassifyExpenseResult {
    sector_id: string | null
    category_id: string | null
    tax_rate: number
    tax_deductible: boolean
    reason: string
}

export async function classifyExpenseAI({
    description,
    sectors,
    categories,
    type
}: ClassifyExpenseParams): Promise<ClassifyExpenseResult> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    const systemPrompt = `Eres un experto contable y analista financiero.
Tu objetivo es clasificar una transacción económica basada en su descripción.

CONTEXTO:
- Sectores disponibles: ${sectors.map(s => `${s.name} (ID: ${s.id})`).join(', ')}
- Categorías disponibles: ${categories.map(c => `${c.name} (ID: ${c.id})`).join(', ')}
- Tipo de transacción: ${type === 'expense' ? 'GASTO' : 'INGRESO'}

REGLAS:
1. Basándote en la descripción, elige el SECTOR y la CATEGORÍA más adecuados.
2. Si es un GASTO, estima si es deducible de impuestos (tax_deductible) y el tipo de IVA (tax_rate) común en España (21, 10, 4 o 0).
3. Devuelve los IDs exactos proporcionados.
4. Si no estás seguro, devuelve null en los IDs.
5. El campo 'reason' debe ser una breve explicación en español del porqué de esa clasificación.

FORMATO DE SALIDA (JSON):
{
    "sector_id": "uuid-or-null",
    "category_id": "uuid-or-null",
    "tax_rate": number,
    "tax_deductible": boolean,
    "reason": "string"
}
`

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Descripción de la transacción: "${description}"` }
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            }),
        })

        if (!response.ok) {
            throw new Error(`AI API error: ${await response.text()}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content
        if (!content) throw new Error('No content from AI')

        return JSON.parse(content) as ClassifyExpenseResult
    } catch (error) {
        console.error('Error in classifyExpenseAI:', error)
        throw error
    }
}
