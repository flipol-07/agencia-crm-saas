
import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarEvent } from '../types'
import { Button } from '@/shared/components/ui/Button'
import { X, Calendar, Clock, MapPin, AlignLeft, Users, ExternalLink, Trash2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EventDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    event: CalendarEvent | null
    onDelete?: (event: CalendarEvent) => Promise<void>
}

export function EventDetailsModal({ isOpen, onClose, event, onDelete }: EventDetailsModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)

    if (!isOpen || !event) return null

    const isMeeting = event.type === 'meeting'
    const location = event.url || (event.originalData as any)?.meeting_url || null
    const attendees = (event.originalData as any)?.attendees || []

    const handleDelete = async () => {
        if (!onDelete) return
        setIsDeleting(true)
        try {
            await onDelete(event)
            onClose()
        } catch (error) {
            console.error('Failed to delete event:', error)
            setIsDeleting(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-[#09090b] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-xl font-bold text-white tracking-tight pr-4">
                            {event.title}
                        </h2>
                        <div className="flex items-center gap-2">
                            {onDelete && (
                                <button
                                    onClick={() => setShowConfirmDelete(true)}
                                    className="p-2 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {showConfirmDelete ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center gap-3 text-red-500">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-semibold">Are you sure?</span>
                                </div>
                                <p className="text-sm text-gray-300">
                                    This action cannot be undone. This will permanently delete this {event.type}.
                                </p>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowConfirmDelete(false)}
                                        className="w-full"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white border-none"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {/* Time */}
                                <div className="flex gap-4">
                                    <div className="p-2.5 rounded-lg bg-white/5 h-fit">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Date & Time</h3>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {format(event.start, 'EEEE, MMMM d, yyyy')}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                        </p>
                                    </div>
                                </div>

                                {/* Location / Link */}
                                {location && (
                                    <div className="flex gap-4">
                                        <div className="p-2.5 rounded-lg bg-white/5 h-fit">
                                            <MapPin className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="text-sm font-semibold text-white">Location</h3>
                                            <a
                                                href={location}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-brand hover:underline mt-1 block truncate flex items-center gap-2"
                                            >
                                                Join Meeting <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {event.description && (
                                    <div className="flex gap-4">
                                        <div className="p-2.5 rounded-lg bg-white/5 h-fit">
                                            <AlignLeft className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">Description</h3>
                                            <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">
                                                {event.description}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Attendees */}
                                {attendees.length > 0 && (
                                    <div className="flex gap-4">
                                        <div className="p-2.5 rounded-lg bg-white/5 h-fit">
                                            <Users className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">Attendees</h3>
                                            <div className="mt-2 space-y-1">
                                                {attendees.map((email: string) => (
                                                    <div key={email} className="text-sm text-gray-400">
                                                        {email}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pt-4 flex justify-end gap-3">
                                    {location && (
                                        <Button
                                            className="w-full bg-brand text-black font-bold hover:bg-brand/90"
                                            onClick={() => window.open(location, '_blank')}
                                        >
                                            Join Meeting
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
