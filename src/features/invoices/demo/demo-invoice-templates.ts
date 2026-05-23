import type { InvoiceTemplateConfig } from '@/types/database'

export type DemoInvoiceTemplate = {
    key: 'executive' | 'blue' | 'nordic'
    name: string
    description: string
    max_items: number
    is_default: boolean
    config: InvoiceTemplateConfig
}

export const DEMO_INVOICE_TEMPLATES: DemoInvoiceTemplate[] = [
    {
        key: 'executive',
        name: 'Aurie Executive',
        description: 'Cabecera premium oscura, acento lima y bloques muy legibles para propuestas de alto valor.',
        max_items: 18,
        is_default: true,
        config: {
            global_font: 'Inter',
            elements: [
                { id: 'hero-band', type: 'square', x: 0, y: 0, width: 210, height: 46, backgroundColor: '#0B1220', zIndex: 0 },
                { id: 'accent-line', type: 'line', x: 0, y: 46, width: 210, height: 1.2, color: '#A3E635', zIndex: 1 },
                { id: 'issuer', type: 'issuer', x: 16, y: 15, width: 76, fontSize: 9, color: '#FFFFFF', fontFamily: 'Inter', zIndex: 2 },
                { id: 'title', type: 'title', x: 126, y: 15, width: 68, content: 'FACTURA', fontSize: 31, fontWeight: '900', color: '#FFFFFF', align: 'right', fontFamily: 'Inter', zIndex: 2 },
                { id: 'invoice-number', type: 'invoice_number', x: 135, y: 31, width: 59, fontSize: 9, color: '#C7D2FE', align: 'right', fontFamily: 'Inter', zIndex: 2 },
                { id: 'date', type: 'date', x: 135, y: 36, width: 59, fontSize: 8, color: '#CBD5E1', align: 'right', fontFamily: 'Inter', zIndex: 2 },
                { id: 'recipient', type: 'recipient', x: 16, y: 67, width: 78, fontSize: 10, color: '#111827', fontFamily: 'Inter', zIndex: 2 },
                { id: 'table', type: 'table', x: 16, y: 113, width: 178, fontSize: 10, color: '#2563EB', fontFamily: 'Inter', zIndex: 2 },
                { id: 'total', type: 'total', x: 117, y: 229, width: 77, fontSize: 10, color: '#0F172A', align: 'right', fontFamily: 'Inter', zIndex: 2 },
                { id: 'footer-line', type: 'line', x: 16, y: 276, width: 178, height: 0.4, color: '#E5E7EB', zIndex: 1 },
                { id: 'footer-text', type: 'text', x: 16, y: 281, width: 70, content: 'Aurie Demo SL', fontSize: 7, color: '#64748B', fontFamily: 'Inter', zIndex: 2 },
            ],
        },
    },
    {
        key: 'blue',
        name: 'Corporate Blue Pro',
        description: 'Diseño corporativo claro con jerarquía azul, ideal para consultoría, clínicas y servicios B2B.',
        max_items: 22,
        is_default: false,
        config: {
            global_font: 'Roboto',
            elements: [
                { id: 'top-rule', type: 'line', x: 14, y: 16, width: 182, height: 0.7, color: '#DBEAFE', zIndex: 0 },
                { id: 'issuer', type: 'issuer', x: 16, y: 25, width: 82, fontSize: 10, color: '#111827', fontFamily: 'Roboto', zIndex: 2 },
                { id: 'title', type: 'title', x: 128, y: 23, width: 68, content: 'FACTURA', fontSize: 34, fontWeight: '900', color: '#3B82F6', align: 'right', fontFamily: 'Roboto', zIndex: 2 },
                { id: 'invoice-number', type: 'invoice_number', x: 140, y: 40, width: 56, fontSize: 9, color: '#1D4ED8', align: 'right', fontFamily: 'Roboto', zIndex: 2 },
                { id: 'date', type: 'date', x: 140, y: 46, width: 56, fontSize: 8, color: '#64748B', align: 'right', fontFamily: 'Roboto', zIndex: 2 },
                { id: 'recipient', type: 'recipient', x: 16, y: 74, width: 82, fontSize: 10, color: '#111827', fontFamily: 'Roboto', zIndex: 2 },
                { id: 'client-box', type: 'square', x: 111, y: 70, width: 85, height: 28, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 0.2, zIndex: 0 },
                { id: 'table', type: 'table', x: 16, y: 118, width: 180, fontSize: 10, color: '#3B82F6', fontFamily: 'Roboto', zIndex: 2 },
                { id: 'total', type: 'total', x: 116, y: 232, width: 80, fontSize: 10, color: '#1E3A8A', align: 'right', fontFamily: 'Roboto', zIndex: 2 },
                { id: 'footer-line', type: 'line', x: 16, y: 276, width: 180, height: 0.4, color: '#E5E7EB', zIndex: 1 },
            ],
        },
    },
    {
        key: 'nordic',
        name: 'Nordic Ledger',
        description: 'Minimalista editorial con banda verde petróleo y mucho aire para facturas limpias y premium.',
        max_items: 16,
        is_default: false,
        config: {
            global_font: 'Inter',
            elements: [
                { id: 'side-band', type: 'square', x: 0, y: 0, width: 10, height: 297, backgroundColor: '#0F766E', zIndex: 0 },
                { id: 'side-accent', type: 'square', x: 10, y: 0, width: 2, height: 297, backgroundColor: '#CCFBF1', zIndex: 0 },
                { id: 'title', type: 'title', x: 24, y: 21, width: 74, content: 'FACTURA', fontSize: 38, fontWeight: '900', color: '#0F766E', fontFamily: 'Inter', zIndex: 2 },
                { id: 'invoice-number', type: 'invoice_number', x: 25, y: 41, width: 70, fontSize: 9, color: '#134E4A', fontFamily: 'Inter', zIndex: 2 },
                { id: 'date', type: 'date', x: 25, y: 47, width: 70, fontSize: 8, color: '#64748B', fontFamily: 'Inter', zIndex: 2 },
                { id: 'issuer', type: 'issuer', x: 117, y: 24, width: 76, fontSize: 9, color: '#111827', align: 'right', fontFamily: 'Inter', zIndex: 2 },
                { id: 'recipient', type: 'recipient', x: 25, y: 78, width: 86, fontSize: 10, color: '#111827', fontFamily: 'Inter', zIndex: 2 },
                { id: 'table', type: 'table', x: 25, y: 120, width: 168, fontSize: 10, color: '#0F766E', fontFamily: 'Inter', zIndex: 2 },
                { id: 'total', type: 'total', x: 113, y: 233, width: 80, fontSize: 10, color: '#134E4A', align: 'right', fontFamily: 'Inter', zIndex: 2 },
                { id: 'footer-text', type: 'text', x: 25, y: 279, width: 84, content: 'Gracias por confiar en Aurie.', fontSize: 8, color: '#64748B', fontFamily: 'Inter', zIndex: 2 },
            ],
        },
    },
]
