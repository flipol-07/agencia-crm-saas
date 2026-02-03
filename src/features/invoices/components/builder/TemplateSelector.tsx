'use client'

import { useState, useEffect } from 'react'
import { InvoiceTemplate } from '@/types/database'
import { fetchTemplatesClient, getOptimalTemplate } from '@/features/invoices/services/templateService'
import Link from 'next/link'

interface Props {
    itemCount: number
    selectedTemplateId?: string
    onSelect: (template: InvoiceTemplate) => void
}

export function TemplateSelector({ itemCount, selectedTemplateId, onSelect }: Props) {
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTemplatesClient().then(data => {
            setTemplates(data)
            setLoading(false)
        })
    }, [])

    // Suggest optimal template on load or item change if no manual selection yet?
    // For now, allow user to click.

    // Auto-selection logic could be here, but let's keep it simple: highlight recommendation.
    const optimal = templates.length > 0 ? getOptimalTemplate(templates, itemCount) : null

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">Selecciona un diseño:</p>
                <Link href="/settings/templates" target="_blank" className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1 font-bold">
                    ⚙️ Gestionar Mis Plantillas
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="text-gray-500 animate-pulse">Cargando plantillas...</div>
                ) : templates.map(template => (
                    <div
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className={`
                        cursor-pointer border-2 rounded-xl p-4 transition-all relative overflow-hidden group
                        ${selectedTemplateId === template.id
                                ? 'border-lime-400 bg-lime-400/10'
                                : 'border-white/10 hover:border-white/30 bg-white/5'}
                    `}
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">
                                    {template.name}
                                </h3>
                                {template.is_default && (
                                    <span className="bg-white/10 text-xs px-2 py-0.5 rounded text-gray-300">
                                        Default
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                {template.description}
                            </p>

                            <div className="flex items-center gap-2 text-xs">
                                <div
                                    className={`px-2 py-1 rounded-full border ${itemCount > template.max_items
                                        ? 'border-red-500/50 text-red-400 bg-red-500/10'
                                        : 'border-lime-500/30 text-lime-400 bg-lime-500/10'
                                        }`}
                                >
                                    Capacidad: {template.max_items} items
                                </div>
                                {optimal?.id === template.id && (
                                    <div className="px-2 py-1 rounded-full bg-lime-400 text-black font-bold animate-pulse">
                                        Recomendada
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview visual hints (abstract) */}
                        <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-24 h-24 bg-gradient-to-br from-white to-transparent rounded-tl-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
