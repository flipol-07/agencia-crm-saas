'use client'

import { useState } from 'react'
import { useMeetings } from '@/features/meetings/hooks/useMeetings'
import { MeetingCard } from '@/features/meetings/components/MeetingCard'
import { UploadMeetingModal } from '@/features/meetings/components/UploadMeetingModal'
import { MeetingDetailModal } from '@/features/meetings/components/MeetingDetailModal'
import { Meeting } from '@/features/meetings/types'

export default function MeetingsPage() {
    const { meetings, loading, refetch, deleteMeeting, updateMeeting } = useMeetings()
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
    const [filter, setFilter] = useState('')

    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId) || null

    const filteredMeetings = meetings.filter(m =>
        m.title.toLowerCase().includes(filter.toLowerCase()) ||
        (m.contacts?.company_name || '').toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div className="p-8 h-full flex flex-col min-h-screen overflow-hidden">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Reuniones</h1>
                    <p className="text-gray-400">Gestiona y consulta el conocimiento extraído de tus reuniones</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(132,204,22,0.3)]"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Reunión
                </button>
            </div>

            <div className="mb-8 shrink-0">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por título o empresa..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all placeholder:text-gray-600"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500">Cargando base de conocimientos...</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                        {filteredMeetings.map(meeting => (
                            <div key={meeting.id} className="h-[280px]">
                                <MeetingCard
                                    meeting={meeting}
                                    onClick={() => setSelectedMeetingId(meeting.id)}
                                />
                            </div>
                        ))}
                        {filteredMeetings.length === 0 && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 font-medium">No hay reuniones todavía</p>
                                <p className="text-sm text-gray-600 mt-1 mb-6">Sube una grabación para comenzar</p>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="text-lime-400 hover:text-lime-300 text-sm font-medium hover:underline"
                                >
                                    Subir primera reunión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <UploadMeetingModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    refetch()
                    setShowUploadModal(false)
                }}
            />

            {selectedMeeting && (
                <MeetingDetailModal
                    meeting={selectedMeeting}
                    isOpen={!!selectedMeetingId}
                    onClose={() => setSelectedMeetingId(null)}
                    onDelete={deleteMeeting}
                    onUpdate={updateMeeting}
                />
            )}
        </div>
    )
}
