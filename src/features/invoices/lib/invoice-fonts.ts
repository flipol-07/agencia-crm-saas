export interface InvoiceFontOption {
    name: string
    cssFamily: string
    category: 'Sans' | 'Serif' | 'Condensed'
}

export const INVOICE_FONTS: InvoiceFontOption[] = [
    { name: 'Inter', cssFamily: '"Inter", Arial, sans-serif', category: 'Sans' },
    { name: 'Roboto', cssFamily: '"Roboto", Arial, sans-serif', category: 'Sans' },
    { name: 'Open Sans', cssFamily: '"Open Sans", Arial, sans-serif', category: 'Sans' },
    { name: 'Montserrat', cssFamily: '"Montserrat", Arial, sans-serif', category: 'Sans' },
    { name: 'Lato', cssFamily: '"Lato", Arial, sans-serif', category: 'Sans' },
    { name: 'Poppins', cssFamily: '"Poppins", Arial, sans-serif', category: 'Sans' },
    { name: 'Raleway', cssFamily: '"Raleway", Arial, sans-serif', category: 'Sans' },
    { name: 'Oswald', cssFamily: '"Oswald", Arial Narrow, sans-serif', category: 'Condensed' },
    { name: 'Playfair Display', cssFamily: '"Playfair Display", Georgia, serif', category: 'Serif' },
    { name: 'Merriweather', cssFamily: '"Merriweather", Georgia, serif', category: 'Serif' },
]

export const DEFAULT_INVOICE_FONT = 'Inter'

export function fontFamilyForCss(fontName?: string | null): string {
    const normalized = fontName?.trim()
    if (!normalized) return INVOICE_FONTS[0].cssFamily

    const match = INVOICE_FONTS.find(font => font.name === normalized)
    if (match) return match.cssFamily

    return `"${normalized}", Arial, sans-serif`
}
