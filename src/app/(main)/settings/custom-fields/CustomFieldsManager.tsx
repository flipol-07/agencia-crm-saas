'use client'

import { useState, useTransition } from 'react'
import {
    createCustomFieldDefinitionAction,
    updateCustomFieldDefinitionAction,
    deleteCustomFieldDefinitionAction,
    listCustomFieldDefinitionsAction,
} from '@/features/contacts/actions/customFieldActions'
import type { CustomFieldDefinition, CustomFieldType } from '@/types/database'

interface Props {
    initialFields: CustomFieldDefinition[]
}

const TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
    { value: 'text', label: 'Texto corto' },
    { value: 'textarea', label: 'Texto largo' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'select', label: 'Selección' },
    { value: 'checkbox', label: 'Sí / No' },
]

export function CustomFieldsManager({ initialFields }: Props) {
    const [fields, setFields] = useState<CustomFieldDefinition[]>(initialFields)
    const [label, setLabel] = useState('')
    const [type, setType] = useState<CustomFieldType>('text')
    const [optionsText, setOptionsText] = useState('')
    const [required, setRequired] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const refresh = async () => {
        const res = await listCustomFieldDefinitionsAction()
        if (res.success && res.data) setFields(res.data)
    }

    const handleCreate = () => {
        setError(null)
        if (!label.trim()) {
            setError('El nombre del campo es obligatorio')
            return
        }
        const opts = type === 'select'
            ? optionsText.split(',').map(s => s.trim()).filter(Boolean)
            : undefined
        if (type === 'select' && (!opts || opts.length === 0)) {
            setError('Indica al menos una opción separada por comas')
            return
        }

        startTransition(async () => {
            const res = await createCustomFieldDefinitionAction({
                label: label.trim(),
                type,
                options: opts,
                required,
                position: fields.length,
            })
            if (!res.success) { setError(res.error || 'Error'); return }
            setLabel(''); setOptionsText(''); setRequired(false); setType('text')
            refresh()
        })
    }

    const handleDelete = (field: CustomFieldDefinition) => {
        if (!confirm(`¿Eliminar el campo "${field.label}"? Los valores ya guardados en contactos se conservan en la columna jsonb.`)) return
        startTransition(async () => {
            const res = await deleteCustomFieldDefinitionAction({ id: field.id })
            if (res.success) setFields(fs => fs.filter(f => f.id !== field.id))
        })
    }

    const toggleRequired = (field: CustomFieldDefinition) => {
        startTransition(async () => {
            const res = await updateCustomFieldDefinitionAction({ id: field.id, required: !field.required })
            if (res.success) refresh()
        })
    }

    return (
        <div className="space-y-8">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Nuevo campo</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">Etiqueta</label>
                        <input
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]/50"
                            placeholder="Ej: Sector, NIF intracomunitario..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">Tipo</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as CustomFieldType)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]/50"
                        >
                            {TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {type === 'select' && (
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-semibold">Opciones (separadas por coma)</label>
                        <input
                            value={optionsText}
                            onChange={e => setOptionsText(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]/50"
                            placeholder="Bronce, Plata, Oro"
                        />
                    </div>
                )}

                <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
                    Obligatorio
                </label>

                {error && (
                    <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        onClick={handleCreate}
                        disabled={pending}
                        className="text-sm font-bold px-4 py-2 rounded-lg bg-[#8b5cf6] text-white hover:bg-[#7c3aed] disabled:opacity-50"
                    >
                        {pending ? 'Guardando...' : 'Añadir campo'}
                    </button>
                </div>
            </div>

            <div className="glass rounded-xl border border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white">Campos definidos ({fields.length})</h3>
                </div>
                {fields.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        Aún no has creado campos personalizados.
                    </div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {fields.map(f => (
                            <li key={f.id} className="px-6 py-4 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-white">{f.label}</span>
                                        <code className="text-[10px] text-gray-500 font-mono">{f.name}</code>
                                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                                            {TYPE_OPTIONS.find(o => o.value === f.type)?.label || f.type}
                                        </span>
                                        {f.required && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300">
                                                Obligatorio
                                            </span>
                                        )}
                                    </div>
                                    {f.options && f.options.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-400">
                                            Opciones: {f.options.join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => toggleRequired(f)}
                                        className="text-xs px-2 py-1 rounded-md text-gray-300 hover:bg-white/5 border border-white/10"
                                    >
                                        {f.required ? 'Quitar obligatorio' : 'Marcar obligatorio'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(f)}
                                        className="text-xs px-2 py-1 rounded-md text-red-400 hover:bg-red-500/10 border border-red-500/20"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
