
'use client'

import { useEffect, useState } from 'react'
import { useBillingProfile } from '../hooks/useBillingProfile'

export function SettingsForm() {
    const { profile, loading, saving, saveBillingProfile } = useBillingProfile()

    const [formData, setFormData] = useState({
        full_name: '',
        billing_name: '',
        billing_tax_id: '',
        billing_address: '',
        billing_email: '',
        billing_phone: '',
        billing_iban: '',
        invoice_prefix: 'INV-',
        next_invoice_number: 1,
        logo_url: '',
        professional_role: '',
        professional_description: ''
    })

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                billing_name: profile.billing_name || '',
                billing_tax_id: profile.billing_tax_id || '',
                billing_address: profile.billing_address || '',
                billing_email: profile.billing_email || '',
                billing_phone: profile.billing_phone || '',
                billing_iban: profile.billing_iban || '',
                invoice_prefix: profile.invoice_prefix || 'INV-',
                next_invoice_number: profile.next_invoice_number || 1,
                logo_url: '', // Placeholder
                professional_role: profile.professional_role || '',
                professional_description: profile.professional_description || ''
            })
        }
    }, [profile])


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'next_invoice_number' ? parseInt(value) || 0 : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await saveBillingProfile({
                full_name: formData.full_name,
                billing_name: formData.billing_name,
                billing_tax_id: formData.billing_tax_id,
                billing_address: formData.billing_address,
                billing_email: formData.billing_email,
                billing_phone: formData.billing_phone,
                billing_iban: formData.billing_iban,
                invoice_prefix: formData.invoice_prefix,
                next_invoice_number: formData.next_invoice_number,
                professional_role: formData.professional_role,
                professional_description: formData.professional_description
            })
            alert('Perfil de facturación guardado correctamente 💾')
        } catch (error) {
            console.error(error)
            alert('Error al guardar ajustes')
        }
    }

    if (loading) return <div className="text-white">Cargando perfil de facturación...</div>

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-amber-200 text-sm">
                <p>⚠️ <strong>Nota:</strong> Estos datos son <strong>personales y intransferibles</strong>. Se usarán para generar <strong>tus</strong> facturas como autónomo.</p>
            </div>

            {/* Datos Personales (CRM) */}
            <div className="glass p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">
                    👤 Datos del Perfil (CRM)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Nombre Visible (CRM)</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="Tu Nombre (Ej: Juan Pérez)"
                        />
                        <p className="text-xs text-gray-500">Este nombre aparecerá en la barra lateral.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Rol Profesional (IA)</label>
                        <input
                            type="text"
                            name="professional_role"
                            value={(formData as any).professional_role || ''}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="Ej: Diseñador Senior, Trafficker, CEO..."
                        />
                        <p className="text-xs text-gray-500">Aura AI usará esto para personalizar sus consejos.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Descripción Profesional / Foco actual</label>
                    <textarea
                        name="professional_description"
                        value={(formData as any).professional_description || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none resize-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                        placeholder="Describe brevemente a qué te dedicas o en qué estás trabajando ahora mismo..."
                    />
                    <p className="text-xs text-gray-500">Proporciona contexto a Aura sobre tus responsabilidades diarias.</p>
                </div>
            </div>

            {/* Datos Fiscales */}
            <div className="glass p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">
                    📝 Datos Fiscales (Facturación)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Nombre Fiscal / Razón Social</label>
                        <input
                            type="text"
                            name="billing_name"
                            value={formData.billing_name}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="Nombre Completo en Hacienda"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">NIF / CIF</label>
                        <input
                            type="text"
                            name="billing_tax_id"
                            value={formData.billing_tax_id}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="Ej: 12345678Z"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-300">Dirección Fiscal / Domicilio</label>
                        <textarea
                            name="billing_address"
                            value={formData.billing_address}
                            onChange={handleChange}
                            rows={2}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none resize-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="Calle, Número, CP, Ciudad..."
                        />
                    </div>
                </div>
            </div>

            {/* Configuración de Facturación */}
            <div className="glass p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">
                    🔢 Secuencia de Facturas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Prefijo de Factura</label>
                        <input
                            type="text"
                            name="invoice_prefix"
                            value={formData.invoice_prefix}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="Ej: 2024- o INV-"
                        />
                        <p className="text-xs text-gray-500">Opcional. Se pondrá antes del número.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Próximo Número de Factura</label>
                        <input
                            type="number"
                            name="next_invoice_number"
                            value={formData.next_invoice_number}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="Ej: 101"
                        />
                        <p className="text-xs text-gray-500">El número que se asignará a la siguiente factura que generes.</p>
                    </div>
                </div>
            </div>

            {/* Datos de Contacto y Pago */}
            <div className="glass p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">
                    💳 Datos de Pago y Contacto
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">IBAN / Cuenta Bancaria</label>
                        <input
                            type="text"
                            name="billing_iban"
                            value={formData.billing_iban}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="ES..."
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email Facturación</label>
                        <input
                            type="email"
                            name="billing_email"
                            value={formData.billing_email}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="email@ejemplo.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Teléfono Facturación</label>
                        <input
                            type="text"
                            name="billing_phone"
                            value={formData.billing_phone}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-lime-400 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                            placeholder="+34..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-lime-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-lime-400 disabled:opacity-50 transition-all shadow-lg hover:shadow-lime-500/20 transform hover:-translate-y-0.5"
                >
                    {saving ? 'Guardando...' : 'Guardar Mis Datos Fiscales'}
                </button>
            </div>
        </form>
    )
}
