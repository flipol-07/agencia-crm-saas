import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import type {
    InvoiceElement,
    InvoiceTemplate,
    InvoiceTemplateConfig,
    InvoiceWithDetails,
    Settings,
} from '@/types/database'

interface Props {
    invoice: InvoiceWithDetails
    settings: Settings | null
    template: InvoiceTemplate | null
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const MM_TO_PT = 72 / 25.4

const FALLBACK_CONFIG: InvoiceTemplateConfig = {
    elements: [
        { id: 'title', type: 'title', x: 135, y: 20, width: 55, content: 'FACTURA', fontSize: 32, fontWeight: '900', color: '#3B82F6', align: 'right' },
        { id: 'number', type: 'invoice_number', x: 135, y: 36, width: 55, fontSize: 9, color: '#1E40AF', align: 'right' },
        { id: 'issuer', type: 'issuer', x: 20, y: 20, width: 70, color: '#111827' },
        { id: 'recipient', type: 'recipient', x: 20, y: 70, width: 70, color: '#374151' },
        { id: 'table', type: 'table', x: 20, y: 120, width: 170, color: '#3B82F6' },
        { id: 'total', type: 'total', x: 120, y: 240, width: 70, color: '#1E3A8A', align: 'right' },
    ],
    global_font: 'Helvetica',
}

function mm(value: number): number {
    return value * MM_TO_PT
}

function elementWidth(el: InvoiceElement): number {
    if (el.width) return mm(el.width)
    if (el.type === 'table') return mm(170)
    if (el.type === 'total') return mm(70)
    if (el.type === 'issuer' || el.type === 'recipient') return mm(72)
    if (el.type === 'title') return mm(65)
    if (el.type === 'image') return mm(40)
    if (el.type === 'line') return mm(170)
    return mm(80)
}

function elementHeight(el: InvoiceElement): number | undefined {
    if (el.height) return mm(el.height)
    if (el.type === 'line') return mm(0.5)
    if (el.type === 'square') return mm(20)
    if (el.type === 'image') return mm(30)
    return undefined
}

function fontWeight(value: string | undefined): 'normal' | 'bold' {
    if (!value) return 'normal'
    return ['600', '700', '800', '900', 'bold', 'black'].includes(value) ? 'bold' : 'normal'
}

function baseElementStyle(el: InvoiceElement) {
    return {
        position: 'absolute' as const,
        left: mm(el.x),
        top: mm(el.y),
        width: elementWidth(el),
        height: elementHeight(el),
        color: el.color || '#000000',
        fontFamily: 'Helvetica',
        fontSize: el.fontSize || 10,
        fontWeight: fontWeight(el.fontWeight),
        textAlign: el.align || 'left',
        opacity: el.opacity ?? 1,
        backgroundColor: el.backgroundColor || 'transparent',
        borderColor: el.borderColor || el.color || '#000000',
        borderWidth: el.borderWidth ? mm(el.borderWidth) : 0,
    }
}

function euro(value: number | null | undefined): string {
    const safe = Number.isFinite(value) ? Number(value) : 0
    return `${safe.toFixed(2)}EUR`.replace('EUR', '€')
}

function text(value: string | null | undefined, fallback = ''): string {
    return value?.trim() || fallback
}

function renderMultiline(value: string): React.ReactNode[] {
    const lines = value.split('\n')
    return lines.map((line, index) => (
        <Text key={`${line}-${index}`} style={{ marginBottom: index === lines.length - 1 ? 0 : 1 }}>
            {line}
        </Text>
    ))
}

function renderIssuer(settings: Settings | null, color: string) {
    return (
        <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color, marginBottom: 1 }}>
                {text(settings?.company_name, 'Mi Empresa')}
            </Text>
            <Text style={{ fontSize: 9, color, opacity: 0.7, lineHeight: 1.15 }}>
                {renderMultiline(text(settings?.address))}
            </Text>
            <Text style={{ fontSize: 9, color, opacity: 0.7, lineHeight: 1.15 }}>
                {text(settings?.tax_id)}
            </Text>
        </View>
    )
}

function renderRecipient(invoice: InvoiceWithDetails, color: string) {
    const client = invoice.contacts

    return (
        <View>
            <Text style={{ fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.2, color, opacity: 0.5, marginBottom: 3 }}>
                Cliente
            </Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color, marginBottom: 1 }}>
                {text(client?.company_name, 'Cliente')}
            </Text>
            <Text style={{ fontSize: 9, color, opacity: 0.7, lineHeight: 1.15 }}>
                {text(client?.tax_address)}
            </Text>
        </View>
    )
}

function renderTable(el: InvoiceElement, invoice: InvoiceWithDetails) {
    const items = invoice.invoice_items || []
    const color = el.color || '#000000'
    const baseFont = el.fontSize || 10

    return (
        <View style={{ width: elementWidth(el), fontSize: baseFont, color }}>
            <View style={{ flexDirection: 'row', borderBottomColor: color, borderBottomWidth: 1, paddingBottom: 7 }}>
                <Text style={{ flex: 4, fontSize: baseFont * 0.7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.7, opacity: 0.6 }}>
                    Descripción
                </Text>
                <Text style={{ flex: 1, fontSize: baseFont * 0.7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.7, opacity: 0.6, textAlign: 'center' }}>
                    Cant.
                </Text>
                <Text style={{ flex: 1.6, fontSize: baseFont * 0.7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.7, opacity: 0.6, textAlign: 'right' }}>
                    Total
                </Text>
            </View>

            {items.length === 0 ? (
                <View style={{ paddingTop: 8, paddingBottom: 8, borderBottomColor: '#f3f4f6', borderBottomWidth: 1 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: baseFont * 0.9 }}>Sin líneas</Text>
                </View>
            ) : (
                items.slice(0, 15).map((item, index) => (
                    <View
                        key={item.id}
                        wrap={false}
                        style={{
                            flexDirection: 'row',
                            paddingTop: 8,
                            paddingBottom: 8,
                            paddingLeft: 2,
                            paddingRight: 2,
                            borderBottomColor: '#F3F4F6',
                            borderBottomWidth: 0.5,
                            backgroundColor: index % 2 === 0 ? 'transparent' : '#FAFAFA',
                        }}
                    >
                        <Text style={{ flex: 4, fontSize: baseFont * 0.9, fontWeight: 'bold' }}>
                            {item.description}
                        </Text>
                        <Text style={{ flex: 1, fontSize: baseFont * 0.9, textAlign: 'center', opacity: 0.8 }}>
                            {item.quantity}
                        </Text>
                        <Text style={{ flex: 1.6, fontSize: baseFont * 0.9, textAlign: 'right', fontWeight: 'bold' }}>
                            {euro(item.total_price)}
                        </Text>
                    </View>
                ))
            )}
        </View>
    )
}

function renderTotal(el: InvoiceElement, invoice: InvoiceWithDetails) {
    const color = el.color || '#000000'
    const baseFont = el.fontSize || 10
    const width = elementWidth(el)
    const alignItems = el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'
    const finalTotal = invoice.subtotal + invoice.tax_amount - (invoice.irpf_amount || 0)

    return (
        <View style={{ width, alignItems }}>
            <View style={{ width }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, opacity: 0.5 }}>
                    <Text style={{ fontSize: baseFont * 0.8, color }}>SUBTOTAL</Text>
                    <Text style={{ fontSize: baseFont * 0.8, color }}>{euro(invoice.subtotal)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, opacity: 0.5 }}>
                    <Text style={{ fontSize: baseFont * 0.8, color }}>IVA ({invoice.tax_rate}%)</Text>
                    <Text style={{ fontSize: baseFont * 0.8, color }}>{euro(invoice.tax_amount)}</Text>
                </View>
                {invoice.irpf_rate > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, opacity: 0.5 }}>
                        <Text style={{ fontSize: baseFont * 0.8, color }}>IRPF (-{invoice.irpf_rate}%)</Text>
                        <Text style={{ fontSize: baseFont * 0.8, color }}>-{euro(invoice.irpf_amount)}</Text>
                    </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopColor: color, borderTopWidth: 0.75 }}>
                    <Text style={{ fontSize: baseFont * 1.8, color, fontWeight: 'bold' }}>TOTAL</Text>
                    <Text style={{ fontSize: baseFont * 1.8, color, fontWeight: 'bold' }}>{euro(finalTotal)}</Text>
                </View>
            </View>
        </View>
    )
}

function renderElement(el: InvoiceElement, invoice: InvoiceWithDetails, settings: Settings | null) {
    const style = baseElementStyle(el)
    const color = el.color || '#000000'

    if (el.type === 'line') {
        return <View key={el.id} style={[style, { backgroundColor: color, borderWidth: 0 }]} />
    }

    if (el.type === 'square') {
        return <View key={el.id} style={style} />
    }

    if (el.type === 'image' && el.src) {
        return <Image key={el.id} src={el.src} style={[style, { objectFit: 'contain' }]} />
    }

    if (el.type === 'table') {
        return <View key={el.id} style={style}>{renderTable(el, invoice)}</View>
    }

    if (el.type === 'total') {
        return <View key={el.id} style={style}>{renderTotal(el, invoice)}</View>
    }

    if (el.type === 'issuer') {
        return <View key={el.id} style={style}>{renderIssuer(settings, color)}</View>
    }

    if (el.type === 'recipient') {
        return <View key={el.id} style={style}>{renderRecipient(invoice, color)}</View>
    }

    if (el.type === 'invoice_number') {
        return <Text key={el.id} style={style}>#{invoice.invoice_number || ''}</Text>
    }

    if (el.type === 'date') {
        return <Text key={el.id} style={style}>{invoice.issue_date}</Text>
    }

    return (
        <Text key={el.id} style={style}>
            {el.content || (el.type === 'title' ? 'FACTURA' : '')}
        </Text>
    )
}

export function InvoicePDFDocument({ invoice, settings, template }: Props) {
    const config = invoice.config || template?.config || FALLBACK_CONFIG
    const backgroundUrl = config.background_url || template?.background_url
    const elements = [...(config.elements || FALLBACK_CONFIG.elements)].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))

    return (
        <Document>
            <Page
                size="A4"
                style={{
                    position: 'relative',
                    width: mm(A4_WIDTH_MM),
                    height: mm(A4_HEIGHT_MM),
                    backgroundColor: '#ffffff',
                    overflow: 'hidden',
                    fontFamily: 'Helvetica',
                }}
            >
                {backgroundUrl && (
                    <Image
                        src={backgroundUrl}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: mm(A4_WIDTH_MM),
                            height: mm(A4_HEIGHT_MM),
                            objectFit: 'cover',
                        }}
                    />
                )}
                {elements.map(element => renderElement(element, invoice, settings))}
            </Page>
        </Document>
    )
}
