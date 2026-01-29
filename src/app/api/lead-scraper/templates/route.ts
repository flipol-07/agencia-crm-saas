import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateService } from '@/features/lead-scraper/services/template.service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, htmlContent, description, isDefault } = body

        if (!name || !htmlContent) {
            return NextResponse.json(
                { error: 'Nombre y contenido HTML son requeridos' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const templateService = new TemplateService(supabase as any)
        const template = await templateService.create({
            name,
            htmlContent,
            description: description || '',
            isDefault: isDefault || false
        })

        return NextResponse.json({ template })
    } catch (error) {
        console.error('Error guardando template:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al guardar template' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const supabase = await createClient()
        const templateService = new TemplateService(supabase as any)
        const templates = await templateService.getAll()

        return NextResponse.json({ templates })
    } catch (error) {
        console.error('Error obteniendo templates:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al obtener templates' },
            { status: 500 }
        )
    }
}
