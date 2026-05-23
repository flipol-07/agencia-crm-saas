import type { InvoiceTemplateConfig, InvoiceElement } from '@/types/database'

export interface ResolvedTemplate {
    /** Color principal de acento (header, totales, líneas) */
    accentColor: string
    /** Color de texto principal */
    textColor: string
    /** Color de texto secundario / etiquetas */
    secondaryColor: string
    /** Familia tipográfica (web). En PDF se mapea a Helvetica si no está embebida. */
    fontFamily: string
    /** URL del logo (puede ser vacía) */
    logoUrl: string | null
    /** URL del background (puede ser vacía) */
    backgroundUrl: string | null
}

const DEFAULT_TEMPLATE: ResolvedTemplate = {
    accentColor: '#1f1f1f',
    textColor: '#0f0f0f',
    secondaryColor: '#6b6b6b',
    fontFamily: 'Helvetica',
    logoUrl: null,
    backgroundUrl: null,
}

/**
 * Extrae los rasgos visuales clave de un template canvas para usarlos tanto
 * en el preview HTML como en el PDF servidor.
 *
 * Heurística: del array de elementos del template tomamos el color/font
 * dominante del primer 'title' o 'text' encontrado, y el src del primer 'image'
 * como logo.
 */
export function resolveTemplate(config: InvoiceTemplateConfig | null | undefined): ResolvedTemplate {
    if (!config) return DEFAULT_TEMPLATE

    const elements: InvoiceElement[] = Array.isArray(config.elements) ? config.elements : []

    const title = elements.find(e => e.type === 'title')
    const text = elements.find(e => e.type === 'text')
    const logo = elements.find(e => e.type === 'image' && e.src)

    return {
        accentColor: title?.color || DEFAULT_TEMPLATE.accentColor,
        textColor: text?.color || DEFAULT_TEMPLATE.textColor,
        secondaryColor: DEFAULT_TEMPLATE.secondaryColor,
        fontFamily: config.global_font || title?.fontFamily || DEFAULT_TEMPLATE.fontFamily,
        logoUrl: logo?.src || null,
        backgroundUrl: config.background_url || DEFAULT_TEMPLATE.backgroundUrl,
    }
}
