'use client'

import { Meeting } from '../types'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { EditMeetingModal } from './EditMeetingModal'

interface MeetingDetailModalProps {
    meeting: Meeting
    isOpen: boolean
    onClose: () => void
    onDelete?: (id: string) => Promise<void>
    onUpdate?: (id: string, updates: any) => Promise<any>
}

export function MeetingDetailModal({ meeting, isOpen, onClose, onDelete, onUpdate }: MeetingDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'transcription'>('summary')
    const [showEditModal, setShowEditModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start bg-zinc-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{meeting.title}</h2>
                        <div className="flex gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">📅 {new Date(meeting.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                            {meeting.contacts && (
                                <span className="flex items-center gap-1 text-blue-300">🏢 {meeting.contacts.company_name}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {onUpdate && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                title="Editar reunión"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={async () => {
                                    if (confirm('¿Estás seguro de que quieres eliminar esta reunión?')) {
                                        setIsDeleting(true)
                                        await onDelete(meeting.id)
                                        onClose()
                                    }
                                }}
                                disabled={isDeleting}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                title="Eliminar reunión"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'text-lime-400 border-b-2 border-lime-400 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Resumen y Puntos Clave
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'text-lime-400 border-b-2 border-lime-400 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Análisis de Venta 🚀
                    </button>
                    <button
                        onClick={() => setActiveTab('transcription')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'transcription' ? 'text-lime-400 border-b-2 border-lime-400 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Transcripción
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'summary' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <section>
                                <h3 className="text-lg font-bold text-lime-400 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Resumen Ejecutivo
                                </h3>
                                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed bg-white/5 p-6 rounded-xl border border-white/5">
                                    {meeting.summary ? (
                                        <ReactMarkdown>{meeting.summary}</ReactMarkdown>
                                    ) : (
                                        <p className="italic text-gray-500">No hay resumen disponible.</p>
                                    )}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section>
                                    <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Puntos Clave
                                    </h3>
                                    <ul className="space-y-3">
                                        {meeting.key_points && meeting.key_points.length > 0 ? (
                                            meeting.key_points.map((point, i) => (
                                                <li key={i} className="flex gap-3 text-gray-300 text-sm bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                                    <span className="text-blue-400 mt-0.5">•</span>
                                                    {point}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-gray-500 italic">No hay puntos clave.</li>
                                        )}
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        Conclusiones
                                    </h3>
                                    <ul className="space-y-3">
                                        {meeting.conclusions && meeting.conclusions.length > 0 ? (
                                            meeting.conclusions.map((point, i) => (
                                                <li key={i} className="flex gap-3 text-gray-300 text-sm bg-purple-500/5 p-3 rounded-lg border border-purple-500/10">
                                                    <span className="text-purple-400 mt-0.5">→</span>
                                                    {point}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-gray-500 italic">No hay conclusiones.</li>
                                        )}
                                    </ul>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Sentiment */}
                            <section className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Sentimiento del Cliente</h3>
                                <p className="text-xl text-white font-medium">
                                    {meeting.feedback?.customer_sentiment || 'Análisis no disponible.'}
                                </p>
                            </section>

                            {/* Seller Feedback */}
                            <section>
                                <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21V12" />
                                    </svg>
                                    Mejoras por Vendedor
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(meeting.feedback?.seller_feedback && meeting.feedback.seller_feedback.length > 0) ? (
                                        meeting.feedback.seller_feedback.map((seller, i) => (
                                            <div key={i} className="bg-zinc-800/50 p-5 rounded-xl border border-white/5">
                                                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center text-xs">
                                                        {seller.name.charAt(0)}
                                                    </div>
                                                    {seller.name}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {seller.improvements.map((imp, j) => (
                                                        <li key={j} className="text-sm text-gray-400 flex gap-2">
                                                            <span className="text-lime-500">✓</span>
                                                            {imp}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full bg-white/5 p-6 rounded-xl border border-dashed border-white/10 text-center text-gray-500">
                                            No se identificaron hablantes individuales para feedback personalizado.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* General Team Feedback */}
                            <section className="bg-lime-500/5 p-6 rounded-xl border border-lime-500/20">
                                <h3 className="text-lg font-bold text-lime-400 mb-3">Feedback General del Equipo</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {meeting.feedback?.general_feedback || 'No hay feedback general disponible.'}
                                </p>
                            </section>
                        </div>
                    )}

                    {activeTab === 'transcription' && (
                        <div className="bg-black/20 p-6 rounded-xl border border-white/5 font-mono text-sm text-gray-300 leading-relaxed max-h-full overflow-y-auto animate-in fade-in duration-300">
                            {meeting.transcription || 'No hay transcripción disponible.'}
                        </div>
                    )}
                </div>

                {onUpdate && (
                    <EditMeetingModal
                        meeting={meeting}
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        onUpdate={onUpdate}
                    />
                )}
            </div>
        </div>
    )
}
