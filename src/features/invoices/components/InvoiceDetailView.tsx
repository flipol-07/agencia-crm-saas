'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PrintButton, SendInvoiceButton } from '@/features/invoices/components'
import { updateInvoiceWithItemsAction as updateInvoiceWithItems } from '@/features/invoices/actions/invoiceActions'
import type { Settings, InvoiceWithDetails, InvoiceTemplate, InvoiceElement } from '@/types/database'
import { TemplateSelector } from './builder/TemplateSelector'
import { TemplateEditor } from './builder/TemplateEditor'
import { InvoiceCanvas } from './InvoiceCanvas'
import { getOptimalTemplate } from '@/features/invoices/services/templateService'

interface Props {
    initialInvoice: InvoiceWithDetails
    settings: Settings | null
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

const DEFAULT_BLOCKS: InvoiceElement[] = [
    { id: '1', type: 'title', x: 20, y: 20, content: 'FACTURA', fontSize: 32, fontWeight: '900', color: '#8b5cf6' },
    { id: '2', type: 'invoice_number', x: 20, y: 35, fontSize: 10, color: '#9ca3af' },
    { id: '3', type: 'issuer', x: 20, y: 60 },
    { id: '4', type: 'recipient', x: 120, y: 60 },
    { id: '5', type: 'table', x: 20, y: 110, width: 170 },
    { id: '6', type: 'total', x: 120, y: 220, width: 70 }
]

export function InvoiceDetailView({ initialInvoice, settings: initialSettings }: Props) {
    const [invoice, setInvoice] = useState(initialInvoice)
    const [items, setItems] = useState(initialInvoice.invoice_items)
    const [hasChanges, setHasChanges] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Template System State
    const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)
    const [showEditor, setShowEditor] = useState(false)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [scale, setScale] = useState(1)


    // Load initial template logic (Same as before but with better defaults)
    useEffect(() => {
        async function loadTemplate() {
            try {
                // Priority 1: Config already snapshotted in the invoice
                if (invoice.config) {
                    setSelectedTemplate({
                        id: 'snapshotted',
                        name: 'Diseño Personalizado',
                        config: invoice.config as any,
                        max_items: 50,
                        background_url: (invoice.config as any).background_url || null,
                        is_default: false,
                        profile_id: invoice.created_by,
                        created_at: '',
                        updated_at: '',
                        description: 'Copia local guardada en la factura'
                    })
                    return
                }

                // Priority 2: Use template_id referenced in invoice
                if (invoice.template_id) {
                    const saved = await import('@/features/invoices/services/templateService').then(m => m.getTemplateById(invoice.template_id!))
                    if (saved) {
                        setSelectedTemplate(saved)
                        return
                    }
                }

                // Priority 3: Default optimal template
                const all = await import('@/features/invoices/services/templateService').then(m => m.fetchTemplatesClient())
                if (all.length > 0) {
                    const optimal = getOptimalTemplate(all, items.length)
                    setSelectedTemplate(optimal)
                }
            } catch (e) {
                console.error("Failed to load templates", e)
            }
        }
        loadTemplate()
    }, [])

    const handleTemplateSelect = (template: InvoiceTemplate) => {
        setSelectedTemplate(template)
        setShowTemplateSelector(false)
        // When selecting a new template, we update the invoice config too
        setInvoice(prev => ({ ...prev, config: template.config as any, template_id: template.id }))
        setHasChanges(true)
    }

    // Cálculos
    useEffect(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
        const taxAmount = (subtotal * invoice.tax_rate) / 100
        const total = subtotal + taxAmount
        setInvoice(prev => ({ ...prev, subtotal, tax_amount: taxAmount, total }))
        setHasChanges(true)
    }, [items, invoice.tax_rate])

    // Handlers
    const handleUpdateInvoiceField = (field: string, value: any) => {
        setInvoice(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)
    }

    const handleUpdateItem = (id: string, field: string, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item
            const updatedItem = { ...item, [field]: value }
            const q = field === 'quantity' ? value : item.quantity
            const p = field === 'unit_price' ? value : item.unit_price
            updatedItem.total_price = (isNaN(q) || isNaN(p)) ? 0 : q * p
            return updatedItem
        }))
    }

    const handleSave = async () => {
        setLoading(true)
        setIsSaving(true)
        try {
            // We save the latest design config into the invoice
            const latestConfig = selectedTemplate?.config

            // Clean invoice object to remove joined relations before updating
            const { contacts, invoice_items, ...invoiceToSave } = invoice as any

            await updateInvoiceWithItems(
                invoice.id,
                {
                    ...invoiceToSave,
                    template_id: (selectedTemplate?.id !== 'snapshotted' ? selectedTemplate?.id : invoice.template_id) || null,
                    config: latestConfig as any
                },
                items.map(i => ({
                    ...i,
                    invoice_id: invoice.id
                }))
            )

            setInvoice(prev => ({
                ...prev,
                template_id: (selectedTemplate?.id !== 'snapshotted' ? selectedTemplate?.id : invoice.template_id) || null,
                config: latestConfig as any
            }))
            setHasChanges(false)
            alert('¡Factura y diseño guardados correctamente! 🚀')
        } catch (error) {
            console.error(error)
            alert('Error al guardar')
        } finally {
            setLoading(false)
            setIsSaving(false)
        }
    }

    const client = invoice.contacts

    return (
        <div id="invoice-root" className="min-h-screen bg-[#0b141a] text-white p-4 md:p-8 pb-32 overflow-hidden flex flex-col">

            {/* Toolbar */}
            <div className="max-w-screen-2xl mx-auto w-full mb-8 flex flex-wrap justify-between items-center gap-4 print:hidden border-b border-white/10 pb-4">
                <Link href={`/contacts/${client?.id}`} className="text-gray-400 hover:text-white flex items-center gap-2">
                    ← Volver
                </Link>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-sm font-bold flex items-center gap-2"
                    >
                        🎨 Plantillas
                    </button>
                    <button
                        onClick={() => setShowEditor(!showEditor)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${showEditor ? 'bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/20' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'}`}
                    >
                        ✨ {showEditor ? 'Modo Editor Activo' : 'Editor de Bloques'}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || loading}
                        className={`px-4 py-2 rounded-lg font-bold ${hasChanges ? 'bg-[#8b5cf6] text-white' : 'bg-white/5 text-gray-500'}`}
                    >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <SendInvoiceButton invoice={invoice} settings={initialSettings} />
                    <PrintButton />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden gap-0 relative">
                {/* A4 Canvas */}
                <div className="flex-1 bg-[#121212] p-8 overflow-auto flex justify-center items-start min-h-0 custom-scrollbar">
                    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} className="transition-transform duration-200 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        {selectedTemplate && (
                            <InvoiceCanvas
                                template={selectedTemplate}
                                invoice={invoice}
                                settings={initialSettings}
                                items={items}
                                editable={showEditor}
                                selectedElementId={selectedElementId}
                                onSelectElement={setSelectedElementId}
                                onUpdateTemplate={(updates) => setSelectedTemplate({ ...selectedTemplate, ...updates })}
                                onUpdateItem={(itemId, updates) => {
                                    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item))
                                    setHasChanges(true)
                                }}
                                onUpdateInvoice={(updates) => {
                                    setInvoice(prev => ({ ...prev, ...updates }))
                                    setHasChanges(true)
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Editor Sidebar */}
                {showEditor && selectedTemplate && (
                    <div className="w-96 bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                        <TemplateEditor
                            template={selectedTemplate}
                            selectedElementId={selectedElementId}
                            onChange={(updates) => {
                                setSelectedTemplate({ ...selectedTemplate, ...updates })
                                setHasChanges(true)
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Template Selector */}
            {showTemplateSelector && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-2xl p-8 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowTemplateSelector(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">✕</button>
                        <h2 className="text-2xl font-bold mb-8">Elegir Plantilla</h2>
                        <TemplateSelector itemCount={items.length} selectedTemplateId={selectedTemplate?.id} onSelect={handleTemplateSelect} />
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                     @page { margin: 0; size: A4; }
                     body { background: white !important; margin: 0 !important; }
                     #invoice-root { padding: 0 !important; background: white !important; min-height: 0 !important; }
                     #invoice-root > div:not(.flex-1) { display: none !important; }
                     .flex-1 { padding: 0 !important; margin: 0 !important; display: block !important; }
                     .invoice-print-container { 
                         transform: none !important; 
                         box-shadow: none !important; 
                         width: 210mm !important; 
                         height: 297mm !important; 
                         border: none !important;
                     }
                     .print\\:hidden, .ring-2, button { display: none !important; }
                }

                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    )
}
