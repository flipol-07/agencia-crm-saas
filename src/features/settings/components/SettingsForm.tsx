
'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '../hooks/useSettings'

export function SettingsForm() {
    const { settings, loading, saving, saveSettings } = useSettings()

    const [formData, setFormData] = useState({
        company_name: '',
        tax_id: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        logo_url: '',
        default_tax_rate: 21,
        currency: 'EUR'
    })

    useEffect(() => {
        if (settings) {
            setFormData({
                company_name: settings.company_name || '',
                tax_id: settings.tax_id || '',
                address: settings.address || '',
                email: settings.email || '',
                phone: settings.phone || '',
                website: settings.website || '',
                logo_url: settings.logo_url || '',
                default_tax_rate: settings.default_tax_rate || 21,
                currency: settings.currency || 'EUR'
            })
        }
    }, [settings])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'default_tax_rate' ? parseFloat(value) : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await saveSettings(formData)
            alert('Ajustes guardados correctamente')
        } catch (error) {
            console.error(error)
            alert('Error al guardar ajustes')
        }
    }

    if (loading) return <div className="text-white">Cargando ajustes...</div>

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Información General */}
            <div className="glass p-6 rounded-xl space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Información de Empresa</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Nombre Empresa / Razón Social</label>
                        <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none"
                            placeholder="Ej: Mi Agencia SL"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">NIF / CIF</label>
                        <input
                            type="text"
                            name="tax_id"
                            value={formData.tax_id}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none"
                            placeholder="Ej: B12345678"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm text-gray-400 block mb-1">Dirección Fiscal</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none resize-none"
                        placeholder="Calle Principal 123, 28001 Madrid"
                    />
                </div>
            </div>

            {/* Contacto Público */}
            <div className="glass p-6 rounded-xl space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Datos de Contacto (para Facturas)</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none"
                            placeholder="facturacion@miempresa.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Teléfono</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none"
                            placeholder="+34 600 000 000"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Web</label>
                        <input
                            type="text"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none"
                            placeholder="https://miempresa.com"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Logo URL</label>
                    <input
                        type="text"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none"
                        placeholder="https://..."
                    />
                    {formData.logo_url && (
                        <div className="mt-2 p-2 bg-white/5 rounded inline-block">
                            <img src={formData.logo_url} alt="Logo preview" className="h-12 object-contain" />
                        </div>
                    )}
                </div>
            </div>

            {/* Configuración Facturación */}
            <div className="glass p-6 rounded-xl space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Valores por Defecto</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">IVA por defecto (%)</label>
                        <input
                            type="number"
                            name="default_tax_rate"
                            value={formData.default_tax_rate}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Moneda</label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-lime-400 outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
                        >
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>

                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-lime-400 text-black font-semibold px-6 py-2 rounded-lg hover:bg-lime-300 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Guardando...' : 'Guardar Ajustes'}
                </button>
            </div>
        </form>
    )
}
