'use client'

import { useState, useEffect } from 'react'
import type { Campaign, Lead, SendingProgress, SendingConfig } from '../types/lead-scraper.types'
import { createEmailSenderService } from '../services/email-sender.service'
import { useLeadScraper } from '../hooks/useLeadScraper'

interface SendingPanelProps {
    campaign: Campaign
    leads: Lead[]
}

export function SendingPanel({ campaign, leads }: SendingPanelProps) {
    const { loadLeads } = useLeadScraper()
    const [isSending, setIsSending] = useState(false)
    const [progress, setProgress] = useState<SendingProgress | null>(null)
    const [config, setConfig] = useState<SendingConfig>({
        delayBetweenEmails: 30, // 30 segundos por defecto para seguridad
        dailyLimit: 200,
        testMode: false
    })

    const leadsReady = leads.filter(l => l.emailStatus === 'generated' && l.email).length
    const leadsSent = leads.filter(l => l.emailStatus === 'sent').length
    const leadsError = leads.filter(l => l.emailStatus === 'error').length

    const senderService = createEmailSenderService()

    const handleStartSending = async () => {
        if (!confirm(`¿Estás seguro de que quieres iniciar el envío a ${leadsReady} leads?`)) return

        setIsSending(true)
        senderService.onProgress((p) => {
            setProgress(p)
            if (p.sent + p.failed === p.total) {
                setIsSending(false)
                loadLeads(campaign.id) // Recargar leads al terminar
            }
        })

        try {
            await senderService.sendCampaign(campaign.id, config)
        } catch (error) {
            console.error('Error en el envío:', error)
            alert('Error iniciando el envío: ' + (error instanceof Error ? error.message : 'Error desconocido'))
            setIsSending(false)
        }
    }

    const handleAbort = () => {
        senderService.abort()
        setIsSending(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-400 text-sm">Leads Listos</p>
                    <p className="text-3xl font-bold text-[#bfff00] mt-1">{leadsReady}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-400 text-sm">Emails Enviados</p>
                    <p className="text-3xl font-bold text-white mt-1">{leadsSent}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-400 text-sm">Errores</p>
                    <p className="text-3xl font-bold text-red-400 mt-1">{leadsError}</p>
                </div>
            </div>

            {/* Config & Progress */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                    <h2 className="text-lg font-semibold text-white">Configuración de Envío</h2>
                    <p className="text-sm text-gray-400">Ajusta los parámetros para un envío seguro.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 block">
                                Delay entre emails (segundos)
                            </label>
                            <input
                                type="number"
                                value={config.delayBetweenEmails}
                                onChange={(e) => setConfig({ ...config, delayBetweenEmails: parseInt(e.target.value) })}
                                disabled={isSending}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#bfff00]/50 transition-colors"
                                min="1"
                                max="3600"
                            />
                            <p className="text-xs text-gray-500">
                                Recomendado: 30-60 segundos para evitar filtros de spam.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 block">
                                Límite Diario
                            </label>
                            <input
                                type="number"
                                value={config.dailyLimit}
                                onChange={(e) => setConfig({ ...config, dailyLimit: parseInt(e.target.value) })}
                                disabled={isSending}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#bfff00]/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <input
                                type="checkbox"
                                id="testMode"
                                checked={config.testMode}
                                onChange={(e) => setConfig({ ...config, testMode: e.target.checked })}
                                disabled={isSending}
                                className="w-4 h-4 rounded border-white/10 bg-black/20 text-[#bfff00] focus:ring-[#bfff00]/50"
                            />
                            <label htmlFor="testMode" className="text-sm text-yellow-200">
                                <strong>Modo de Prueba:</strong> Redirigir todos los emails a una dirección de prueba o solo simular.
                            </label>
                        </div>

                        {config.testMode && (
                            <div className="space-y-2 p-4 bg-white/5 border border-white/10 rounded-lg animate-in slide-in-from-top-1 duration-200">
                                <label className="text-sm font-medium text-gray-300 block">
                                    Email de Recepción (Pruebas)
                                </label>
                                <input
                                    type="email"
                                    placeholder="ejemplo@test.com"
                                    value={config.testEmail || ''}
                                    onChange={(e) => setConfig({ ...config, testEmail: e.target.value })}
                                    disabled={isSending}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#bfff00]/50 transition-colors"
                                />
                                <p className="text-xs text-gray-500">
                                    Si dejas esto vacío, el sistema solo simulará el envío sin mandar ningún email.
                                </p>
                            </div>
                        )}
                    </div>

                    {isSending && progress && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Progreso de envío</span>
                                <span className="text-white font-medium">
                                    {progress.sent + progress.failed} / {progress.total}
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#bfff00]/50 to-[#bfff00] transition-all duration-500"
                                    style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }}
                                />
                            </div>
                            {progress.currentLead && (
                                <p className="text-xs text-center text-gray-500">
                                    Enviando a: <span className="text-gray-300">{progress.currentLead}</span>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        {isSending ? (
                            <button
                                onClick={handleAbort}
                                className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-colors font-medium"
                            >
                                Detener Envío
                            </button>
                        ) : (
                            <button
                                onClick={handleStartSending}
                                disabled={leadsReady === 0}
                                className="px-8 py-2 bg-[#bfff00] hover:bg-[#a6e600] disabled:bg-gray-800 disabled:text-gray-500 text-black rounded-lg transition-all font-bold tracking-tight shadow-[0_0_20px_rgba(191,255,0,0.2)]"
                            >
                                Iniciar Campaña Masiva
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
