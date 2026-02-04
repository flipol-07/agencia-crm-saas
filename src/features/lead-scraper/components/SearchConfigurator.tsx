'use client'

import { useState } from 'react'
import { useLeadScraper } from '../hooks/useLeadScraper'
import type { SearchConfig } from '../types/lead-scraper.types'

const SECTORES_POPULARES = [
    'Restaurantes',
    'Hoteles',
    'Clínicas dentales',
    'Gimnasios',
    'Inmobiliarias',
    'Talleres mecánicos',
    'Peluquerías',
    'Asesorías',
    'Constructoras',
    'Tiendas de moda',
]

const UBICACIONES_ESPANA = [
    'Madrid',
    'Barcelona',
    'Valencia',
    'Sevilla',
    'Bilbao',
    'Málaga',
    'Zaragoza',
    'Extremadura',
    'Cáceres',
    'Badajoz',
]

export function SearchConfigurator() {
    const { startScraping, isLoading, scrapingProgress } = useLeadScraper()

    const [campaignName, setCampaignName] = useState('')
    const [sector, setSector] = useState('')
    const [ubicacion, setUbicacion] = useState('')
    const [cantidad, setCantidad] = useState(50)
    const [requiereEmail, setRequiereEmail] = useState(true)
    const [requiereWebsite, setRequiereWebsite] = useState(true)
    const [ratingMinimo, setRatingMinimo] = useState(0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!sector || !ubicacion) {
            alert('Por favor, completa el sector y la ubicación')
            return
        }

        const config: SearchConfig = {
            sector,
            ubicacion,
            cantidad,
            filtros: {
                requiereEmail,
                requiereWebsite,
                ratingMinimo: ratingMinimo > 0 ? ratingMinimo : undefined,
            },
        }

        const name = campaignName || `${sector} - ${ubicacion}`

        try {
            await startScraping(name, config)
        } catch (error) {
            console.error('Error en scraping:', error)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                        </svg>
                        Configurar Búsqueda
                    </h2>

                    {/* Nombre de Campaña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre de Campaña (opcional)
                        </label>
                        <input
                            type="text"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            placeholder="Ej: Restaurantes Madrid Q1 2026"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50 focus:border-[#8b5cf6]"
                        />
                    </div>

                    {/* Sector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sector / Tipo de Negocio *
                        </label>
                        <input
                            type="text"
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            placeholder="Ej: Restaurantes, Clínicas dentales..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50 focus:border-[#8b5cf6]"
                            required
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {SECTORES_POPULARES.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSector(s)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${sector === s
                                        ? 'bg-[#8b5cf6] text-white font-medium shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ubicación / Ciudad *
                        </label>
                        <input
                            type="text"
                            value={ubicacion}
                            onChange={(e) => setUbicacion(e.target.value)}
                            placeholder="Ej: Madrid, Barcelona, Extremadura..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50 focus:border-[#8b5cf6]"
                            required
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {UBICACIONES_ESPANA.map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => setUbicacion(u)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${ubicacion === u
                                        ? 'bg-[#8b5cf6] text-white font-medium shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cantidad */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Cantidad de Leads a Buscar
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={500}
                                value={cantidad}
                                onChange={(e) => setCantidad(Math.max(1, Math.min(500, Number(e.target.value))))}
                                className="w-20 px-2 py-1 bg-black/40 border border-white/20 rounded text-right text-[#a78bfa] font-bold focus:outline-none focus:border-[#8b5cf6]"
                            />
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={200}
                            step={1}
                            value={Math.min(cantidad, 200)}
                            onChange={(e) => setCantidad(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1</span>
                            <span>50</span>
                            <span>100</span>
                            <span>150</span>
                            <span>200+</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            * El sistema buscará iterativamente hasta encontrar {cantidad} leads válidos o hasta agotar resultados.
                        </p>
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={requiereEmail}
                                onChange={(e) => setRequiereEmail(e.target.checked)}
                                className="w-5 h-5 rounded border-white/20 text-[#8b5cf6] focus:ring-[#8b5cf6]"
                            />
                            <div>
                                <p className="text-white text-sm font-medium">Solo con Email</p>
                                <p className="text-gray-500 text-xs">Filtrar sin email</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={requiereWebsite}
                                onChange={(e) => setRequiereWebsite(e.target.checked)}
                                className="w-5 h-5 rounded border-white/20 text-[#8b5cf6] focus:ring-[#8b5cf6]"
                            />
                            <div>
                                <p className="text-white text-sm font-medium">Solo con Web</p>
                                <p className="text-gray-500 text-xs">Necesario para email</p>
                            </div>
                        </label>

                        <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-white text-sm font-medium mb-1">Rating Mínimo</p>
                            <select
                                value={ratingMinimo}
                                onChange={(e) => setRatingMinimo(Number(e.target.value))}
                                className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-white"
                            >
                                <option value={0} className="bg-gray-900">Sin filtro</option>
                                <option value={3} className="bg-gray-900">⭐ 3+</option>
                                <option value={4} className="bg-gray-900">⭐ 4+</option>
                                <option value={4.5} className="bg-gray-900">⭐ 4.5+</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || !sector || !ubicacion}
                    className="w-full py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                    {isLoading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            <span>Buscando leads...</span>
                        </>
                    ) : (
                        <>
                            <span>🚀</span>
                            <span>Iniciar Scraping</span>
                        </>
                    )}
                </button>
            </form>

            {/* Info Panel */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#8b5cf6]/10 to-transparent border border-[#8b5cf6]/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">💡 ¿Cómo funciona?</h3>
                    <ol className="space-y-3 text-sm text-gray-300">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-[#8b5cf6]/20 text-[#a78bfa] rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <span>Buscamos negocios en Google Maps según tu sector y ubicación</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-[#8b5cf6]/20 text-[#a78bfa] rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            <span>Visitamos sus webs para encontrar emails corporativos</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-[#8b5cf6]/20 text-[#a78bfa] rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            <span>La IA genera emails personalizados para cada negocio</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-[#8b5cf6]/20 text-[#a78bfa] rounded-full flex items-center justify-center text-xs font-bold">4</span>
                            <span>Envías las campañas con rate limiting automático</span>
                        </li>
                    </ol>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">📊 Estadísticas</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Coste por lead</span>
                            <span className="text-white">~0.02€</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Tasa de emails encontrados</span>
                            <span className="text-white">~60%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Tiempo estimado</span>
                            <span className="text-white">~{Math.ceil(cantidad / 10)} min</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
