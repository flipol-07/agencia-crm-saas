'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact, ContactUpdate } from '@/types/database'
import { PIPELINE_STAGES } from '@/types/database'
import { ProjectTasksPanel } from '@/features/projects/components'
import { InvoiceList } from '@/features/invoices/components'
import { analyzeWebsite } from '@/features/contacts/actions/analyze-website'
import { EmailList } from '@/features/emails/components'
import { useContactEmails, useContacts } from '@/features/contacts/hooks/useContacts'
import { ServiceTagSelector, FileSection } from '@/features/contacts/components'

interface ContactDetail360Props {
    contact: Contact
    onUpdate: (updates: ContactUpdate) => Promise<void>
}

export function ContactDetail360({ contact, onUpdate }: ContactDetail360Props) {
    const router = useRouter()
    const { deleteContact } = useContacts()
    const { emails, refetch, lastSync } = useContactEmails(contact.id, true, contact.email)

    // Notes Edit State
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [notesData, setNotesData] = useState(contact.notes || '')

    // Details Edit State
    const [isEditingDetails, setIsEditingDetails] = useState(false)
    const [detailsData, setDetailsData] = useState({
        company_name: contact.company_name,
        contact_name: contact.contact_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        tax_id: contact.tax_id || '',
        tax_address: contact.tax_address || '',
        website: contact.website || '',
        services: contact.services || [],
        estimated_value: contact.estimated_value || 0,
    })

    const [saving, setSaving] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const handleAnalyze = async () => {
        if (!contact.website) return

        setIsAnalyzing(true)
        try {
            await analyzeWebsite(contact.website, contact.id)
            router.refresh()
        } catch (error) {
            console.error('Error analizando:', error)
            alert('Falló el análisis. Revisa la URL.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleSaveNotes = async () => {
        setSaving(true)
        await onUpdate({ notes: notesData })
        setSaving(false)
        setIsEditingNotes(false)
    }

    const handleSaveDetails = async () => {
        setSaving(true)
        await onUpdate({
            company_name: detailsData.company_name,
            contact_name: detailsData.contact_name || null,
            email: detailsData.email || null,
            phone: detailsData.phone || null,
            tax_id: detailsData.tax_id || null,
            tax_address: detailsData.tax_address || null,
            services: detailsData.services || null,
            estimated_value: Number(detailsData.estimated_value) || 0,
        })
        setSaving(false)
        setIsEditingDetails(false)
    }

    const handleDelete = async () => {
        if (!window.confirm('¿Estás SEGURO de eliminar este contacto? Esta acción no se puede deshacer.')) return

        try {
            // Nota: deleteContact de useContacts normalmente necesita el ID.
            // Si useContacts no expone delete, deberíamos verificar el hook.
            // Asumiendo que useContacts() devuelve { deleteContact: (id) => Promise<void> }
            await deleteContact(contact.id)
            router.push('/contacts')
        } catch (error) {
            console.error('Error eliminando:', error)
            alert('Error al eliminar contacto.')
        }
    }

    const handleStageChange = async (newStage: string) => {
        await onUpdate({ pipeline_stage: newStage })
    }

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            prospect: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Prospecto' },
            qualified: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Cualificado' },
            proposal: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Propuesta' },
            won: { bg: 'bg-lime-500/20', text: 'text-lime-400', label: 'Ganado' },
            active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Activo' },
            maintenance: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Mantenimiento' },
            lost: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Perdido' },
        }
        return badges[status] || badges.prospect
    }

    const statusBadge = getStatusBadge(contact.status)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ====== COLUMNA IZQUIERDA: Datos + Pipeline + Notas ====== */}
            <div className="space-y-6">
                {/* Datos del cliente */}
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-white">Datos del cliente</h2>
                            {!isEditingDetails && (
                                <button
                                    onClick={() => setIsEditingDetails(true)}
                                    className="text-xs text-lime-400 hover:text-lime-300 border border-lime-400/30 rounded px-2 py-0.5"
                                >
                                    Editar
                                </button>
                            )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                        </span>
                    </div>

                    {isEditingDetails ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Empresa *</label>
                                <input
                                    type="text"
                                    value={detailsData.company_name}
                                    onChange={e => setDetailsData(prev => ({ ...prev, company_name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Valor Estimado (Pipeline) €</label>
                                <input
                                    type="number"
                                    value={detailsData.estimated_value}
                                    onChange={e => setDetailsData(prev => ({ ...prev, estimated_value: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                    placeholder="0.00"
                                />
                            </div>


                            <div>
                                <label className="text-xs text-gray-500">Servicios (Tags)</label>
                                <div className="mt-1">
                                    <ServiceTagSelector
                                        selectedTags={detailsData.services}
                                        onChange={tags => setDetailsData(prev => ({ ...prev, services: tags }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Contacto</label>
                                    <input
                                        type="text"
                                        value={detailsData.contact_name}
                                        onChange={e => setDetailsData(prev => ({ ...prev, contact_name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">NIF</label>
                                    <input
                                        type="text"
                                        value={detailsData.tax_id}
                                        onChange={e => setDetailsData(prev => ({ ...prev, tax_id: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                        placeholder="NIF / CIF"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Dirección Fiscal</label>
                                    <input
                                        type="text"
                                        value={detailsData.tax_address}
                                        onChange={e => setDetailsData(prev => ({ ...prev, tax_address: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                        placeholder="Calle, Ciudad, CP..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Web</label>
                                <input
                                    type="text"
                                    value={detailsData.website}
                                    onChange={e => setDetailsData(prev => ({ ...prev, website: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Email</label>
                                    <input
                                        type="email"
                                        value={detailsData.email}
                                        onChange={e => setDetailsData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Teléfono</label>
                                    <input
                                        type="text"
                                        value={detailsData.phone}
                                        onChange={e => setDetailsData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-lime-400 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                                <button
                                    onClick={handleDelete}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                                >
                                    Eliminar
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditingDetails(false)}
                                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveDetails}
                                        disabled={saving}
                                        className="px-4 py-1.5 text-sm bg-lime-400 text-black rounded hover:bg-lime-300 disabled:opacity-50"
                                    >
                                        {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-gray-500">Empresa</span>
                                <p className="text-white font-medium">{contact.company_name}</p>

                                {contact.services && contact.services.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {contact.services.map(tag => (
                                            <span key={tag} className="text-xs bg-lime-400/10 text-lime-400 border border-lime-400/20 px-2 py-0.5 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {contact.estimated_value != null && contact.estimated_value > 0 && (
                                <div>
                                    <span className="text-sm text-gray-500">Valor Estimado</span>
                                    <p className="text-white font-semibold text-lime-400">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(contact.estimated_value)}
                                    </p>
                                </div>
                            )}

                            {contact.website && (
                                <div>
                                    <span className="text-sm text-gray-500">Sitio Web</span>
                                    <a
                                        href={contact.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-lime-400 hover:text-lime-300 block truncate flex items-center gap-1"
                                    >
                                        {contact.website}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            )}

                            {contact.contact_name && (
                                <div>
                                    <span className="text-sm text-gray-500">Contacto</span>
                                    <p className="text-white">{contact.contact_name}</p>
                                </div>
                            )}

                            {contact.email && (
                                <div>
                                    <span className="text-sm text-gray-500">Email</span>
                                    <a href={`mailto:${contact.email}`} className="text-lime-400 hover:text-lime-300 block">
                                        {contact.email}
                                    </a>
                                </div>
                            )}

                            {contact.phone && (
                                <div>
                                    <span className="text-sm text-gray-500">Teléfono</span>
                                    <a href={`tel:${contact.phone}`} className="text-lime-400 hover:text-lime-300 block">
                                        {contact.phone}
                                    </a>
                                </div>
                            )}

                            {contact.tax_id && (
                                <div>
                                    <span className="text-sm text-gray-500">NIF/CIF</span>
                                    <p className="text-white">{contact.tax_id}</p>
                                </div>
                            )}

                            {contact.tax_address && (
                                <div>
                                    <span className="text-sm text-gray-500">Dirección Fiscal</span>
                                    <p className="text-white">{contact.tax_address}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aviso de datos faltantes para facturación */}
                    {(!contact.tax_id || !contact.tax_address || !contact.email) && !isEditingDetails && (
                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-sm text-amber-400 font-medium">Datos insuficientes para facturar</p>
                                <p className="text-xs text-amber-500/80">Falta: {[
                                    !contact.tax_id && "NIF",
                                    !contact.tax_address && "Dirección Fiscal",
                                    !contact.email && "Email"
                                ].filter(Boolean).join(", ")}.</p>
                                <button
                                    onClick={() => setIsEditingDetails(true)}
                                    className="text-xs text-amber-500 underline mt-1 hover:text-amber-400"
                                >
                                    Rellenar ahora
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Análisis de Negocio (IA) */}
                <div className="glass rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-24 h-24 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 6a1 1 0 0 0-1 1v4.59l-3.29-3.3a1 1 0 0 0-1.42 1.42l5 5a1 1 0 0 0 1.42 0l5-5a1 1 0 0 0-1.42-1.42l-3.29 3.3V7a1 1 0 0 0-1-1z" />
                        </svg>
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span>🤖 Análisis de Negocio</span>
                        </h2>
                        {contact.website && !contact.ai_description && (
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="text-xs bg-lime-400 text-black px-2 py-1 rounded font-medium hover:bg-lime-300 transition-colors disabled:opacity-50"
                            >
                                {isAnalyzing ? 'Analizando...' : 'Generar Análisis'}
                            </button>
                        )}
                    </div>

                    <div className="relative z-10">
                        {contact.ai_description ? (
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-lime-400 pl-3">
                                {contact.ai_description}
                            </p>
                        ) : (
                            <div className="text-center py-4 bg-white/5 rounded-lg border border-white/5 border-dashed">
                                <p className="text-gray-500 text-sm">
                                    {contact.website
                                        ? "Haz clic arriba para analizar el sitio web con IA."
                                        : "Añade un sitio web para generar un análisis automático."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estado del Pipeline */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Estado Pipeline</h2>
                    <div className="space-y-2">
                        {PIPELINE_STAGES.map(stage => (
                            <button
                                key={stage.id}
                                onClick={() => handleStageChange(stage.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${contact.pipeline_stage === stage.id
                                    ? `bg-${stage.color}-400/20 border border-${stage.color}-400/50 text-white`
                                    : 'bg-white/5 border border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {stage.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notas */}
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Notas</h2>
                        {!isEditingNotes && (
                            <button
                                onClick={() => setIsEditingNotes(true)}
                                className="text-sm text-lime-400 hover:text-lime-300"
                            >
                                Editar
                            </button>
                        )}
                    </div>

                    {isEditingNotes ? (
                        <div className="space-y-3">
                            <textarea
                                value={notesData}
                                onChange={e => setNotesData(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 resize-none"
                                placeholder="Añade notas sobre este cliente..."
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsEditingNotes(false)}
                                    className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={saving}
                                    className="px-4 py-1 text-sm bg-lime-400 text-black rounded-lg hover:bg-lime-300 disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 whitespace-pre-wrap">
                            {contact.notes || 'Sin notas'}
                        </p>
                    )}
                </div>
            </div>

            {/* ====== COLUMNA DERECHA: Proyectos, Emails, Facturas ====== */}
            <div className="space-y-6">

                {/* Emails y Comunicaciones */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span>💬 Comunicaciones</span>
                    </h2>

                    {/* Sector Gmail */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-medium">Gmail</h3>
                        </div>

                        <EmailList
                            contactId={contact.id}
                            contactEmail={contact.email}
                            emails={emails}
                            onRefresh={refetch as any}
                        />
                        {lastSync && (
                            <p className="text-[10px] text-gray-500 text-right mt-2 px-1">
                                Sincronizado: {lastSync.toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    {/* Sector WhatsApp */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                </div>
                                <h3 className="text-white font-medium">WhatsApp</h3>
                            </div>
                            <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full border border-white/5">
                                Próximamente
                            </span>
                        </div>

                        <div className="bg-white/5 border border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                            <p className="text-gray-400 text-sm mb-2">Integración de WhatsApp en desarrollo</p>
                            <p className="text-xs text-gray-600">Pronto podrás ver y responder mensajes directamente desde aquí.</p>
                        </div>
                    </div>
                </div>

                {/* Proyectos y Tareas */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">📋 Proyectos y Tareas</h2>
                    <ProjectTasksPanel contactId={contact.id} />
                </div>

                {/* Facturas */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">📄 Facturas</h2>
                    <InvoiceList contactId={contact.id} />
                </div>

                {/* Archivos */}
                <div className="glass rounded-xl p-6">
                    <FileSection contactId={contact.id} />
                </div>
            </div>
        </div>
    )
}
