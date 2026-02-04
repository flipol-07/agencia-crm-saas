'use client'

import { useState } from 'react'
import type { ContactSource } from '@/types/database'
import { ServiceTagSelector } from './ServiceTagSelector'

interface ContactFormProps {
    onSubmit: (data: ContactFormData) => Promise<void>
    onCancel?: () => void
    isLoading?: boolean
}

export interface ContactFormData {
    company_name: string
    contact_name: string
    email: string
    phone: string
    website: string
    tax_id: string
    tax_address: string
    services: string[]
    source: ContactSource
    notes: string
    estimated_value: string
}

export function ContactForm({ onSubmit, onCancel, isLoading }: ContactFormProps) {
    const [formData, setFormData] = useState<ContactFormData>({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        tax_id: '',
        tax_address: '',
        services: [],
        source: 'outbound',
        notes: '',
        estimated_value: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-2">
                        Empresa *
                    </label>
                    <input
                        id="company_name"
                        name="company_name"
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="Nombre de la empresa"
                    />
                </div>

                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                        Sitio Web
                    </label>
                    <input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="https://ejemplo.com"
                    />
                </div>

                <div>
                    <label htmlFor="contact_name" className="block text-sm font-medium text-gray-300 mb-2">
                        Contacto
                    </label>
                    <input
                        id="contact_name"
                        name="contact_name"
                        type="text"
                        value={formData.contact_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="Nombre del contacto"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="email@empresa.com"
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                        Teléfono
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="+34 XXX XXX XXX"
                    />
                </div>

                <div>
                    <label htmlFor="tax_id" className="block text-sm font-medium text-gray-300 mb-2">
                        NIF
                    </label>
                    <input
                        id="tax_id"
                        name="tax_id"
                        type="text"
                        value={formData.tax_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="NIF / CIF"
                    />
                </div>

                <div>
                    <label htmlFor="tax_address" className="block text-sm font-medium text-gray-300 mb-2">
                        Dirección Fiscal
                    </label>
                    <input
                        id="tax_address"
                        name="tax_address"
                        type="text"
                        value={formData.tax_address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="Calle, Ciudad, CP..."
                    />
                </div>

                <div>
                    <label htmlFor="source" className="block text-sm font-medium text-gray-300 mb-2">
                        Origen
                    </label>
                    <select
                        id="source"
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                    >
                        <option value="outbound" className="bg-gray-900">Outbound (Prospección)</option>
                        <option value="inbound_whatsapp" className="bg-gray-900">Inbound Mensajería</option>
                        <option value="inbound_email" className="bg-gray-900">Inbound Email</option>
                        <option value="referral" className="bg-gray-900">Referido</option>
                        <option value="website" className="bg-gray-900">Website</option>
                        <option value="other" className="bg-gray-900">Otro</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-300 mb-2">
                        Valor Estimado (€)
                    </label>
                    <input
                        id="estimated_value"
                        name="estimated_value"
                        type="number"
                        value={formData.estimated_value}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                        placeholder="0.00"
                    />
                </div>

                <div className="md:col-span-2">
                    <ServiceTagSelector
                        selectedTags={formData.services}
                        onChange={(tags) => setFormData(prev => ({ ...prev, services: tags }))}
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                        Notas iniciales
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all resize-none"
                        placeholder="Contexto inicial del lead..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-300 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-[#8b5cf6] text-white font-medium rounded-lg hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? 'Guardando...' : 'Crear Contacto'}
                </button>
            </div>
        </form>
    )
}
