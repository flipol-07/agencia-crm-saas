import { NextRequest, NextResponse } from 'next/server'
import { AIEmailGeneratorService } from '@/features/lead-scraper/services/ai-email-generator.service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { prompt, config } = body

        if (!prompt) {
            return NextResponse.json(
                { error: 'Se requiere un prompt para generar el template' },
                { status: 400 }
            )
        }

        const aiService = new AIEmailGeneratorService()
        const html = await aiService.generateTemplateFromPrompt(prompt, config)

        return NextResponse.json({ html })
    } catch (error) {
        console.error('Error generando template:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al generar template' },
            { status: 500 }
        )
    }
}
