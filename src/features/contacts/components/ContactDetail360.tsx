'use client'

import { useState } from 'react'
import type { Contact, ContactUpdate } from '@/types/database'
import { PIPELINE_STAGES } from '@/types/database'
import { ProjectTasksPanel } from '@/features/projects/components'

import { InvoiceList } from '@/features/invoices/components'

interface ContactDetail360Props {
    contact: Contact
    onUpdate: (updates: ContactUpdate) => Promise<void>
}

export function ContactDetail360({ contact, onUpdate }: ContactDetail360Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({
        notes: contact.notes || '',
        pipeline_stage: contact.pipeline_stage,
    })
    const [saving, setSaving] = useState(false)

    const handleSaveNotes = async () => {
        setSaving(true)
        await onUpdate({ notes: editData.notes })
        setSaving(false)
        setIsEditing(false)
    }

    const handleStageChange = async (newStage: string) => {
        setEditData(prev => ({ ...prev, pipeline_stage: newStage }))
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
                        <h2 className="text-lg font-semibold text-white">Datos del cliente</h2>
                        <span className={`px-3 py-1 rounded-full text-sm ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-sm text-gray-500">Empresa</span>
                            <p className="text-white font-medium">{contact.company_name}</p>
                        </div>

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
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${editData.pipeline_stage === stage.id
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
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-sm text-lime-400 hover:text-lime-300"
                            >
                                Editar
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-3">
                            <textarea
                                value={editData.notes}
                                onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={6}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 resize-none"
                                placeholder="Añade notas sobre este cliente..."
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
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



            {/* ====== COLUMNA DERECHA: Proyectos, Tareas y Facturas ====== */}
            <div className="space-y-6">
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">📁 Archivos</h2>
                        <button disabled className="text-sm text-gray-500 cursor-not-allowed">
                            + Subir
                        </button>
                    </div>

                    <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">Sin archivos</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
