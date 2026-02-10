
'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { calendarService } from '../services/calendarService'
import { EventInsert } from '../types'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface AddEventModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    selectedDate?: Date
}

export function AddEventModal({ isOpen, onClose, onSuccess, selectedDate }: AddEventModalProps) {
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const eventData: EventInsert = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                start_time: new Date(formData.get('start_time') as string).toISOString(),
                end_time: new Date(formData.get('end_time') as string).toISOString(),
                all_day: false,
                color: 'blue',
                user_id: user.id
            }

            await calendarService.createEvent(eventData)
            toast.success('Event created')
            onSuccess()
            onClose()
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error)
            toast.error('Failed to create event')
        } finally {
            setLoading(false)
        }
    }

    const defaultStart = selectedDate
        ? new Date(selectedDate.setHours(9, 0, 0)).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)

    const defaultEnd = selectedDate
        ? new Date(selectedDate.setHours(10, 0, 0)).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-black/90 rounded-xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Add New Event</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium text-gray-200">Title</label>
                        <input
                            id="title"
                            name="title"
                            required
                            placeholder="Event title"
                            className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="start_time" className="text-sm font-medium text-gray-200">Start</label>
                            <input
                                id="start_time"
                                name="start_time"
                                type="datetime-local"
                                required
                                defaultValue={defaultStart}
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="end_time" className="text-sm font-medium text-gray-200">End</label>
                            <input
                                id="end_time"
                                name="end_time"
                                type="datetime-local"
                                required
                                defaultValue={defaultEnd}
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium text-gray-200">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Optional details"
                            className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={loading}>
                            Create Event
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
