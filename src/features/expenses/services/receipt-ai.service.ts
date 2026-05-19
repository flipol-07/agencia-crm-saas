import { PDFParse } from 'pdf-parse'
import { ExpenseCategory, Sector } from '../types'

export interface ReceiptAnalysisResult {
    supplier_name: string | null
    supplier_tax_id: string | null
    invoice_number: string | null
    date: string | null
    amount: number | null
    tax_rate: number | null
    tax_amount: number | null
    base_amount: number | null
    category_id: string | null
    sector_id: string | null
    tax_deductible: boolean
    confidence: number
    summary: string
}

interface AnalyzeReceiptParams {
    file: File
    sectors: Sector[]
    categories: ExpenseCategory[]
    type: 'expense' | 'income'
}

export async function analyzeReceiptAI({
    file,
    sectors,
    categories,
    type
}: AnalyzeReceiptParams): Promise<ReceiptAnalysisResult> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type || 'application/octet-stream'
    const extractedText = mimeType === 'application/pdf'
        ? await extractPdfText(fileBuffer)
        : null

    const systemPrompt = `Eres un experto contable español especializado en leer facturas, tickets y justificantes.

Devuelve SOLO JSON válido con estos campos:
{
  "supplier_name": string | null,
  "supplier_tax_id": string | null,
  "invoice_number": string | null,
  "date": "YYYY-MM-DD" | null,
  "amount": number | null,
  "tax_rate": number | null,
  "tax_amount": number | null,
  "base_amount": number | null,
  "category_id": string | null,
  "sector_id": string | null,
  "tax_deductible": boolean,
  "confidence": number,
  "summary": string
}

Contexto:
- Tipo de transacción: ${type === 'expense' ? 'gasto' : 'ingreso'}.
- Sectores disponibles: ${sectors.map(s => `${s.name} (${s.id})`).join(', ') || 'ninguno'}.
- Categorías disponibles: ${categories.map(c => `${c.name} (${c.id}, ${c.type})`).join(', ') || 'ninguna'}.

Reglas:
- amount es el total final pagado/cobrado.
- tax_amount es el IVA total si aparece; si no aparece, usa null.
- tax_rate solo puede ser 21, 10, 4, 0 o null.
- Devuelve IDs exactos de sector/categoría si encajan; si no, null.
- tax_deductible debe ser true si parece una factura empresarial deducible con IVA recuperable.
- confidence va de 0 a 1.
- summary debe ser una frase breve en español con lo importante para revisar el gasto.`

    const userContent = extractedText
        ? [
            {
                type: 'text',
                text: `Texto extraído del PDF "${file.name}":\n\n${extractedText.slice(0, 12000)}`
            }
        ]
        : [
            {
                type: 'text',
                text: `Analiza este comprobante "${file.name}".`
            },
            {
                type: 'image_url',
                image_url: {
                    url: `data:${mimeType};base64,${fileBuffer.toString('base64')}`
                }
            }
        ]

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
                { role: 'user', content: userContent }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        }),
    })

    if (!response.ok) {
        throw new Error(`AI API error: ${await response.text()}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) throw new Error('No content from AI')

    return normalizeReceiptAnalysis(JSON.parse(content))
}

async function extractPdfText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer })

    try {
        const result = await parser.getText({ first: 4 })
        return result.text || ''
    } finally {
        await parser.destroy()
    }
}

function normalizeReceiptAnalysis(raw: Partial<ReceiptAnalysisResult>): ReceiptAnalysisResult {
    return {
        supplier_name: raw.supplier_name || null,
        supplier_tax_id: raw.supplier_tax_id || null,
        invoice_number: raw.invoice_number || null,
        date: normalizeDate(raw.date),
        amount: normalizeNumber(raw.amount),
        tax_rate: normalizeTaxRate(raw.tax_rate),
        tax_amount: normalizeNumber(raw.tax_amount),
        base_amount: normalizeNumber(raw.base_amount),
        category_id: raw.category_id || null,
        sector_id: raw.sector_id || null,
        tax_deductible: Boolean(raw.tax_deductible),
        confidence: clampConfidence(raw.confidence),
        summary: raw.summary || 'Comprobante analizado por IA.'
    }
}

function normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return Number(value.toFixed(2))
    if (typeof value === 'string') {
        const parsed = Number(value.replace(',', '.'))
        if (Number.isFinite(parsed)) return Number(parsed.toFixed(2))
    }
    return null
}

function normalizeTaxRate(value: unknown): number | null {
    const parsed = normalizeNumber(value)
    if (parsed === null) return null
    return [21, 10, 4, 0].includes(parsed) ? parsed : null
}

function normalizeDate(value: unknown): string | null {
    if (typeof value !== 'string') return null
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function clampConfidence(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(parsed)) return 0.5
    return Math.min(1, Math.max(0, parsed))
}
