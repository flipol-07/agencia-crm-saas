'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InvoiceTemplate } from '@/types/database'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { InvoiceCanvas } from '@/features/invoices/components/InvoiceCanvas'
import { InvoiceWithDetails } from '@/types/database'

const MOCK_INVOICE: InvoiceWithDetails = {
    id: 'mock',
    invoice_number: 'INV-2026-001',
    issue_date: '01/01/2026',
    due_date: '31/01/2026',
    contact_id: 'mock-client',
    items: [],
    invoice_items: [
        { id: '1', description: 'Servicios de Diseño', quantity: 1, unit_price: 300, total_price: 300, invoice_id: 'mock' },
        { id: '2', description: 'Consultoría Especializada', quantity: 1, unit_price: 200, total_price: 200, invoice_id: 'mock' },
    ],
    status: 'draft',
    subtotal: 500,
    tax_rate: 21,
    tax_amount: 105,
    total: 605,
    notes: 'Gracias por su confianza.',
    user_id: 'mock-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile_id: 'mock-profile',
    contacts: {
        company_name: 'Empresa Cliente',
        tax_address: 'Calle Ejemplo 123, Madrid'
    } as any
} as unknown as InvoiceWithDetails

const MOCK_SETTINGS = {
    company_name: 'Tu Empresa S.L.',
    address: 'Tu Dirección, Ciudad',
    tax_id: 'B-12345678'
} as any

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchTemplates()
    }, [])

    async function fetchTemplates() {
        try {
            const { data, error } = await supabase
                .from('invoice_templates')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Error fetching templates:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDuplicate(template: InvoiceTemplate) {
        if (!confirm('¿Duplicar esta plantilla?')) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('Debes iniciar sesión para duplicar plantillas')
                return
            }

            const { data, error } = await supabase
                .from('invoice_templates')
                .insert({
                    name: `${template.name} (Copia)`,
                    description: template.description,
                    config: template.config,
                    max_items: template.max_items,
                    background_url: template.background_url,
                    profile_id: user.id,
                    is_default: false
                })
                .select()
                .single()

            if (error) throw error
            router.push(`/settings/templates/${data.id}`)
        } catch (error) {
            console.error('Error duplicating template:', error)
            alert('Error al duplicar la plantilla')
        }
    }

    async function handleCreateNew() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('Debes iniciar sesión para crear plantillas')
                return
            }

            const { data, error } = await supabase
                .from('invoice_templates')
                .insert({
                    name: 'Nueva Plantilla',
                    description: 'Descripción de la nueva plantilla',
                    profile_id: user.id,
                    config: {
                        elements: [
                            { id: 't1', type: 'title', x: 20, y: 20, content: 'FACTURA', fontSize: 40, fontWeight: '900', color: '#000000', fontFamily: 'Inter' },
                            { id: 'i1', type: 'issuer', x: 20, y: 50 },
                            { id: 'r1', type: 'recipient', x: 20, y: 100 },
                            { id: 'n1', type: 'invoice_number', x: 140, y: 20 },
                            { id: 'd1', type: 'date', x: 140, y: 30 },
                            { id: 'tb1', type: 'table', x: 20, y: 150, width: 170 },
                            { id: 'tot1', type: 'total', x: 120, y: 230 }
                        ],
                        global_font: 'Inter'
                    },
                    max_items: 15,
                    is_default: false
                })
                .select()
                .single()

            if (error) throw error
            router.push(`/settings/templates/${data.id}`)
        } catch (error) {
            console.error('Error creating template:', error)
            alert('Error al crear la plantilla')
        }
    }

    async function handleSetDefault(id: string) {
        try {
            const { error } = await supabase.rpc('set_default_template', {
                p_template_id: id
            })

            if (error) throw error

            // Update local state: only the selected one is default now
            setTemplates(prev => prev.map(t => ({
                ...t,
                is_default: t.id === id
            })))
        } catch (error: any) {
            console.error('Error setting default template:', JSON.stringify(error, null, 2))
            console.error('Error object:', error)
            alert('Error al establecer como predeterminada: ' + (error?.message || error?.error_description || 'Error desconocido'))
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Seguro que quieres eliminar esta plantilla? Esta acción no se puede deshacer.')) return

        try {
            const { error } = await supabase
                .from('invoice_templates')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Update local state instead of refetching everything
            setTemplates(prev => prev.filter(t => t.id !== id))
        } catch (error: any) {
            console.error('Error deleting template:', JSON.stringify(error, null, 2))
            console.error('Error object:', error)
            alert('Error al eliminar: ' + (error?.message || error?.error_description || 'Asegúrate de que no existan restricciones de integridad'))
        }
    }

    if (loading) return <div className="p-8 text-center">Cargando plantillas...</div>

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-white">Plantillas de Factura</h1>
                    <p className="text-gray-400">Gestiona los diseños de tus facturas.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-purple transition-colors shadow-lg shadow-brand/20"
                >
                    + Crear Nueva Plantilla
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map(template => (
                    <div key={template.id} className="bg-white/5 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:border-brand/30 transition-all overflow-hidden group flex flex-col">
                        <div className="aspect-[210/297] bg-white relative overflow-hidden flex justify-center p-4">
                            {/* Real Preview using InvoiceCanvas */}
                            <div className="scale-[0.25] origin-top shadow-2xl pointer-events-none">
                                <InvoiceCanvas
                                    template={template}
                                    invoice={MOCK_INVOICE}
                                    settings={MOCK_SETTINGS}
                                    items={MOCK_INVOICE.invoice_items}
                                    editable={false}
                                />
                            </div>

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Link
                                    href={`/settings/templates/${template.id}`}
                                    className="bg-brand text-white px-6 py-2 rounded-full text-sm font-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                                >
                                    EDITAR DISEÑO
                                </Link>
                            </div>
                        </div>
                        <div className="p-5 bg-black/40 backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white text-lg">{template.name}</h3>
                                {template.is_default && (
                                    <span className="bg-brand text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-[0_0_10px_rgba(139,92,246,0.2)]">Default</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2 h-8 mb-6">{template.description || 'Sin descripción'}</p>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <button
                                    onClick={() => handleDuplicate(template)}
                                    className="text-xs text-gray-400 hover:text-white font-bold transition-colors"
                                >
                                    Duplicar
                                </button>
                                <button
                                    onClick={() => handleDelete(template.id)}
                                    className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                                >
                                    Eliminar
                                </button>
                                {!template.is_default && (
                                    <button
                                        onClick={() => handleSetDefault(template.id)}
                                        className="text-xs text-brand hover:text-brand-purple font-bold transition-colors"
                                    >
                                        Usar por defecto
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
