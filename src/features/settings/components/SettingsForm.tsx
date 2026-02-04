
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
        professional_description: '',
        default_irpf_rate: 7
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
                professional_description: profile.professional_description || '',
                default_irpf_rate: profile.default_irpf_rate ?? 7
            })
        }
    }, [profile])


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'next_invoice_number' || name === 'default_irpf_rate' ? parseInt(value) || 0 : value
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
                professional_description: formData.professional_description,
                default_irpf_rate: formData.default_irpf_rate
            })
            alert('Perfil de facturación guardado correctamente 💾')
        } catch (error) {
            console.error(error)
            alert('Error al guardar ajustes')
        }
    }

    if (loading) return <div className="text-white">Cargando perfil de facturación...</div>

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl animate-fade-in relative">

            {/* Background Glow for Form Area */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-amber-200 text-sm flex items-start gap-3 shadow-lg shadow-amber-900/10 backdrop-blur-sm">
                <span className="text-xl">⚠️</span>
                <div>
                    <strong className="block mb-1 text-amber-100 uppercase tracking-wider text-xs font-bold">Información Importante</strong>
                    <p className="opacity-80 leading-relaxed text-xs">Estos datos son <strong>personales e intransferibles</strong>. Se utilizarán para generar tus facturas oficiales como autónomo o empresa. Asegúrate de que coincidan con tu registro en Hacienda.</p>
                </div>
            </div>

            {/* Datos Personales (CRM) */}
            <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <h2 className="text-2xl font-display font-black text-white border-b border-white/5 pb-6 flex items-center gap-3">
                    <span className="text-brand text-lg">01.</span>
                    Perfil de Usuario (CRM)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Nombre Visible</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-white/20"
                            placeholder="Tu Nombre (Ej: Juan Pérez)"
                        />
                        <p className="text-[10px] text-gray-600 pl-1 font-medium">Nombre público en la plataforma.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-brand tracking-widest pl-1">Rol Profesional (IA)</label>
                        <input
                            type="text"
                            name="professional_role"
                            value={(formData as any).professional_role || ''}
                            onChange={handleChange}
                            className="w-full bg-brand/5 backdrop-blur-sm border border-brand/20 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-brand/40"
                            placeholder="Ej: Diseñador Senior, Trafficker, CEO..."
                        />
                        <p className="text-[10px] text-brand/60 pl-1 font-medium">Aura personaliza su estrategia según tu rol.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Foco / Descripción</label>
                    <textarea
                        name="professional_description"
                        value={(formData as any).professional_description || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none resize-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-white/20 leading-relaxed"
                        placeholder="Describe brevemente a qué te dedicas o en qué estás trabajando ahora mismo..."
                    />
                    <p className="text-[10px] text-gray-600 pl-1 font-medium">Contexto para recomendaciones proactivas.</p>
                </div>
            </div>

            {/* Datos Fiscales */}
            <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <h2 className="text-2xl font-display font-black text-white border-b border-white/5 pb-6 flex items-center gap-3">
                    <span className="text-brand text-lg">02.</span>
                    Datos Fiscales (Facturación)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Razón Social</label>
                        <input
                            type="text"
                            name="billing_name"
                            value={formData.billing_name}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-white/20"
                            placeholder="Nombre oficial en Hacienda"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">NIF / CIF</label>
                        <input
                            type="text"
                            name="billing_tax_id"
                            value={formData.billing_tax_id}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-white/20 font-mono tracking-wide"
                            placeholder="12345678Z"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Dirección Fiscal Completa</label>
                        <textarea
                            name="billing_address"
                            value={formData.billing_address}
                            onChange={handleChange}
                            rows={2}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none resize-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-white/20"
                            placeholder="Calle, Número, CP, Ciudad, País..."
                        />
                    </div>
                </div>
            </div>

            {/* Configuración de Facturación */}
            <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <h2 className="text-2xl font-display font-black text-white border-b border-white/5 pb-6 flex items-center gap-3">
                    <span className="text-brand text-lg">03.</span>
                    Secuencia y Configuración
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Prefijo Factura</label>
                        <input
                            type="text"
                            name="invoice_prefix"
                            value={formData.invoice_prefix}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-mono hover:border-white/20 text-center"
                            placeholder="INV-"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Próximo Número</label>
                        <input
                            type="number"
                            name="next_invoice_number"
                            value={formData.next_invoice_number}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-mono font-bold text-brand hover:border-white/20 text-center"
                            placeholder="101"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">IRPF Defecto (%)</label>
                        <input
                            type="number"
                            name="default_irpf_rate"
                            value={formData.default_irpf_rate}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-mono hover:border-white/20 text-center"
                            placeholder="7"
                        />
                    </div>
                </div>
            </div>

            {/* Datos de Contacto y Pago */}
            <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <h2 className="text-2xl font-display font-black text-white border-b border-white/5 pb-6 flex items-center gap-3">
                    <span className="text-brand text-lg">04.</span>
                    Información Bancaria y Contacto
                </h2>

                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">IBAN / Cuenta Bancaria</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="billing_iban"
                                value={formData.billing_iban}
                                onChange={handleChange}
                                className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-mono tracking-wider hover:border-white/20 pl-12"
                                placeholder="ES00 0000 0000 0000 0000 0000"
                            />
                            <div className="absolute left-4 top-4 text-gray-500 font-bold text-xs pointer-events-none">IBAN</div>
                        </div>
                        <p className="text-[10px] text-gray-600 pl-1 font-medium">Aparecerá en el pie de tus facturas para recibir pagos.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Email Facturación</label>
                        <input
                            type="email"
                            name="billing_email"
                            value={formData.billing_email}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-white/20"
                            placeholder="facturacion@empresa.com"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Teléfono Facturación</label>
                        <input
                            type="text"
                            name="billing_phone"
                            value={formData.billing_phone}
                            onChange={handleChange}
                            className="w-full bg-background-secondary/40 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-brand outline-none focus:ring-1 focus:ring-brand/20 transition-all font-medium placeholder-gray-700 hover:border-white/20"
                            placeholder="+34 600 000 000"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-8 pb-12 sticky bottom-0 z-50 pointer-events-none">
                <button
                    type="submit"
                    disabled={saving}
                    className="pointer-events-auto bg-brand text-white font-black uppercase tracking-wider px-10 py-4 rounded-full hover:bg-brand-purple hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] border-2 border-transparent hover:border-white/20"
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    )
}
