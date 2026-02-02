'use client'

import { useState, useEffect } from 'react'
import { Meeting } from '../types'
import { useContacts } from '@/features/contacts/hooks/useContacts'
import { toast } from 'sonner'

interface EditMeetingModalProps {
    meeting: Meeting
    isOpen: boolean
    onClose: () => void
    onUpdate: (id: string, updates: any) => Promise<any>
}

export function EditMeetingModal({ meeting, isOpen, onClose, onUpdate }: EditMeetingModalProps) {
    const { contacts } = useContacts()
    const [title, setTitle] = useState(meeting.title)
    const [date, setDate] = useState(meeting.date.split('T')[0])
    const [contactId, setContactId] = useState(meeting.contact_id || '')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setTitle(meeting.title)
        setDate(meeting.date.split('T')[0])
        setContactId(meeting.contact_id || '')
    }, [meeting, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await onUpdate(meeting.id, {
                title,
                date: new Date(date).toISOString(),
                contact_id: contactId || null
            })
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Editar Reunión</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Contacto / Empresa</label>
                        <select
                            value={contactId}
                            onChange={e => setContactId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                        >
                            <option value="">Sin asignar</option>
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>{c.company_name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">Puedes vincular la reunión a un cliente existente.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
