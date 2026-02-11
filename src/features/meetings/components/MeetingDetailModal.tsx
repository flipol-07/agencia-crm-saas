'use client'

import { Meeting } from '../types'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { EditMeetingModal } from './EditMeetingModal'
import { useTeamMembers } from '@/features/tasks/hooks'

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
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'text-[#a78bfa] border-b-2 border-[#a78bfa] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Resumen y Puntos Clave
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'text-[#a78bfa] border-b-2 border-[#a78bfa] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Análisis de Venta 🚀
                    </button>
                    <button
                        onClick={() => setActiveTab('transcription')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'transcription' ? 'text-[#a78bfa] border-b-2 border-[#a78bfa] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Transcripción
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'summary' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <section>
                                <h3 className="text-lg font-bold text-[#a78bfa] mb-4 flex items-center gap-2">
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

                            {/* Asistentes Section */}
                            <section>
                                <MeetingAttendees
                                    attendeeNames={meeting.attendees || []}
                                />
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
                                <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
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
                                                    <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 text-[#a78bfa] flex items-center justify-center text-xs">
                                                        {seller.name.charAt(0)}
                                                    </div>
                                                    {seller.name}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {seller.improvements.map((imp, j) => (
                                                        <li key={j} className="text-sm text-gray-400 flex gap-2">
                                                            <span className="text-[#8b5cf6]">✓</span>
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
                            <section className="bg-[#8b5cf6]/5 p-6 rounded-xl border border-[#8b5cf6]/20">
                                <h3 className="text-lg font-bold text-[#a78bfa] mb-3">Feedback General del Equipo</h3>
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

function MeetingAttendees({ attendeeNames }: { attendeeNames: any[] }) {
    const { members } = useTeamMembers()
    const [expanded, setExpanded] = useState(false)

    if (!attendeeNames || attendeeNames.length === 0) return null

    // Normalize input to strings
    const names = attendeeNames.map(n => typeof n === 'string' ? n : JSON.stringify(n))

    // Match attendees
    const attendees = names.map(name => {
        // Try strict match first
        let member = members.find(m => m.full_name?.toLowerCase() === name.toLowerCase())

        // If not found, try fuzzy match (e.g. contains part of name)
        if (!member) {
            member = members.find(m => m.full_name?.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m.full_name?.toLowerCase() || ''))
        }

        // Special case: "Aurie" -> "Antón Loredo" (Hardcoded explicitly as requested just in case)
        if (!member && (name.toLowerCase().includes('aurie') || name.toLowerCase().includes('auri'))) {
            member = members.find(m => m.full_name === 'Antón Loredo')
        }

        // Special case: "Fran" -> "Francisco"
        if (!member && name.toLowerCase().includes('fran')) {
            member = members.find(m => m.full_name?.includes('Francisco'))
        }

        return { name, member }
    })

    // Sort: Members first
    const sortedAttendees = [...attendees].sort((a, b) => {
        if (a.member && !b.member) return -1
        if (!a.member && b.member) return 1
        return 0
    })

    return (
        <div
            className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all cursor-pointer select-none"
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Asistentes
                    </h3>

                    <div className="flex -space-x-3 items-center">
                        {sortedAttendees.slice(0, 5).map((attendee, i) => (
                            <div
                                key={i}
                                className={`
                                    w-8 h-8 rounded-full border-2 border-zinc-900 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 group-hover:z-10 relative
                                    ${attendee.member ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-zinc-700'}
                                `}
                                title={attendee.member?.full_name || attendee.name}
                                style={{ zIndex: 10 - i }}
                            >
                                {attendee.member?.avatar_url ? (
                                    <img src={attendee.member.avatar_url} alt={attendee.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                                        {(attendee.member?.full_name || attendee.name).charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        ))}
                        {sortedAttendees.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-400 relative z-0">
                                +{sortedAttendees.length - 5}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {expanded && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {sortedAttendees.map((attendee, i) => (
                        <div
                            key={i}
                            className={`
                                flex items-center gap-3 p-3 rounded-xl border transition-all
                                ${attendee.member
                                    ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'}
                            `}
                        >
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/10
                                ${attendee.member ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-zinc-700'}
                            `}>
                                {attendee.member?.avatar_url ? (
                                    <img src={attendee.member.avatar_url} alt={attendee.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-white">
                                        {(attendee.member?.full_name || attendee.name).charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${attendee.member ? 'text-white' : 'text-gray-300'}`}>
                                    {attendee.member?.full_name || attendee.name}
                                </p>
                                <p className="text-[10px] truncate">
                                    {attendee.member ? (
                                        <span className="text-purple-400 font-medium tracking-wide">Equipo Interno</span>
                                    ) : (
                                        <span className="text-gray-500 italic">Participante Externo / Cliente</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
