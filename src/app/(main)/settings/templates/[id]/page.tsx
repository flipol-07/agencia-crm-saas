'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InvoiceTemplate, InvoiceWithDetails } from '@/types/database'
import { InvoiceCanvas } from '@/features/invoices/components/InvoiceCanvas'
import { TemplateEditor } from '@/features/invoices/components/builder/TemplateEditor'

const MOCK_INVOICE: InvoiceWithDetails = {
    id: 'mock',
    invoice_number: 'INV-2026-001',
    issue_date: '01/01/2026',
    due_date: '31/01/2026',
    contact_id: 'mock-client',
    items: [],
    invoice_items: [
        { id: '1', description: 'Consultoría Estratégica', quantity: 1, unit_price: 500, total_price: 500, invoice_id: 'mock' },
        { id: '2', description: 'Desarrollo de Software', quantity: 2, unit_price: 250, total_price: 500, invoice_id: 'mock' },
        { id: '3', description: 'Mantenimiento Mensual', quantity: 1, unit_price: 150, total_price: 150, invoice_id: 'mock' },
    ],
    status: 'draft',
    subtotal: 1150,
    tax_rate: 21,
    tax_amount: 241.5,
    total: 1391.5,
    notes: 'Gracias por su confianza.',
    user_id: 'mock-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile_id: 'mock-profile',
    contacts: {
        id: 'mock-client',
        company_name: 'Empresa Cliente S.L.',
        tax_id: 'B-12345678',
        tax_address: 'Av. de la Innovación 42, Madrid',
        email: 'cliente@ejemplo.com',
        phone: '+34 600 000 000',
        name: 'Juan Pérez'
    } as any
} as unknown as InvoiceWithDetails

const MOCK_SETTINGS = {
    company_name: 'Mi Empresa S.A.',
    tax_id: 'A-87654321',
    address: 'Calle del Comercio 1, Barcelona',
    logo_url: null,
    payment_terms: '30 días',
    default_notes: ''
} as any

export default function TemplateEditorPage() {
    const { id } = useParams()
    const router = useRouter()
    const supabase = createClient()

    const [template, setTemplate] = useState<InvoiceTemplate | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [showMetadataModal, setShowMetadataModal] = useState(false)

    useEffect(() => {
        if (id) fetchTemplate()
    }, [id])

    async function fetchTemplate() {
        try {
            const { data, error } = await supabase
                .from('invoice_templates')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setTemplate(data)
        } catch (error) {
            console.error('Error fetching template:', error)
            alert('Error al cargar la plantilla')
            router.push('/settings/templates')
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!template) return
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const isOwner = template.profile_id === user.id
            const payload = {
                name: template.name,
                description: template.description,
                config: template.config,
                background_url: template.config.background_url,
                profile_id: user.id
            }

            if (isOwner) {
                // Update existing
                const { error } = await supabase
                    .from('invoice_templates')
                    .update(payload)
                    .eq('id', template.id)
                if (error) throw error
            } else {
                // Clone as new
                const { data, error } = await supabase
                    .from('invoice_templates')
                    .insert({ ...payload, is_default: false })
                    .select()
                    .single()
                if (error) throw error

                // Redirect to new template
                router.replace(`/settings/templates/${data.id}`)
            }

            setShowMetadataModal(false)
            alert('Plantilla guardada correctamente 🚀')
        } catch (error) {
            console.error('Error saving template:', error)
            alert('Error al guardar: ' + (error as any).message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="fixed inset-0 bg-black flex items-center justify-center text-gray-500 z-[100]">Cargando editor de precisión...</div>
    if (!template) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-[100]">Plantilla no encontrada</div>

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden text-white font-sans">
            {/* Header Area */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/settings/templates')}
                        className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/5"
                        title="Salir del editor"
                    >
                        ✕
                    </button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest text-white leading-none mb-1">{template.name || 'Sin nombre'}</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Editor de Precisión</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowMetadataModal(true)}
                        className="bg-lime-400 text-black px-8 py-2.5 rounded-full text-xs font-black hover:bg-lime-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-lime-400/20"
                    >
                        GUARDAR DISEÑO
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Workspace (Canvas) */}
                <div className="flex-1 bg-[#121212] overflow-auto flex justify-center items-start p-12 custom-scrollbar relative">
                    {/* Centered Document */}
                    <div className="scale-[0.85] origin-top shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 rounded-sm overflow-hidden mb-20">
                        <InvoiceCanvas
                            template={template}
                            invoice={MOCK_INVOICE}
                            settings={MOCK_SETTINGS}
                            items={MOCK_INVOICE.invoice_items}
                            editable={true}
                            selectedElementId={selectedElementId}
                            onSelectElement={setSelectedElementId}
                            onUpdateTemplate={(updates) => setTemplate({ ...template, ...updates })}
                        />
                    </div>

                    {/* Quick Hint */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] text-gray-400 font-bold pointer-events-none uppercase tracking-widest">
                        ARRASTRA ELEMENTOS • USA EL PANEL DERECHO
                    </div>
                </div>

                {/* Right Panel: Properties */}
                <div className="w-96 bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl overflow-y-auto">
                    <TemplateEditor
                        template={template}
                        selectedElementId={selectedElementId}
                        onChange={(updates) => setTemplate({ ...template, ...updates })}
                    />
                </div>
            </div>

            {/* Metadata / Save Modal */}
            {showMetadataModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMetadataModal(false)} />
                    <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-lime-400/5 to-transparent">
                            <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Finalizar y Guardar</h2>
                            <p className="text-xs text-gray-500 font-medium">Revisa el nombre y la descripción antes de guardar los cambios en la nube.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Nombre de la Plantilla</label>
                                <input
                                    type="text"
                                    value={template.name}
                                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-lime-400 outline-none transition-all font-bold"
                                    placeholder="Ej: Minimal Clean 2026"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Descripción (Opcional)</label>
                                <textarea
                                    value={template.description || ''}
                                    onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-lime-400 outline-none transition-all resize-none h-24 text-sm"
                                    placeholder="Describe para qué sirve este diseño..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowMetadataModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-xs font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-[2] bg-lime-400 text-black px-6 py-3 rounded-xl text-xs font-black hover:bg-lime-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-lime-400/20"
                                >
                                    {saving ? 'GUARDANDO...' : 'CONFIRMAR Y GUARDAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
