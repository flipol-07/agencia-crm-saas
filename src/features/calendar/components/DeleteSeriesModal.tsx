import { useState, useEffect } from 'react'
import { CalendarEvent } from '../types'
import { Button } from '@/shared/components/ui/Button'
import { AlertTriangle, Clock, RefreshCw, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DeleteSeriesModalProps {
    isOpen: boolean
    onClose: () => void
    event: CalendarEvent | null
    onDeleteSingle: (event: CalendarEvent) => Promise<void>
    onDeleteSeries: (event: CalendarEvent) => Promise<void>
}

export function DeleteSeriesModal({ isOpen, onClose, event, onDeleteSingle, onDeleteSeries }: DeleteSeriesModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    if (!isOpen || !event) return null

    const handleSingle = async () => {
        setIsDeleting(true)
        try {
            await onDeleteSingle(event)
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSeries = async () => {
        setIsDeleting(true)
        try {
            await onDeleteSeries(event)
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-brand" />
                            Eliminar Reunión Recurrente
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-3 text-orange-400">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-semibold text-sm">Esta reunión es parte de una serie</span>
                            </div>
                            <p className="text-sm text-gray-300">
                                Puedes eliminar solo la ocurrencia del <strong>{format(event.start, "d 'de' MMMM", { locale: es })}</strong> o todas las ocurrencias futuras de esta serie.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                onClick={handleSingle}
                                disabled={isDeleting}
                                className="w-full flex items-center justify-start gap-4 h-auto py-4 px-6 border-white/10 hover:bg-white/5"
                            >
                                <div className="p-2 rounded-lg bg-white/5">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="text-left flex-1 text-white">
                                    <div className="font-bold text-sm">Eliminar solo este evento</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Se mantienen los demás eventos de la serie</div>
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleSeries}
                                disabled={isDeleting}
                                className="w-full flex items-center justify-start gap-4 h-auto py-4 px-6 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30"
                            >
                                <div className="p-2 rounded-lg bg-red-500/20">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </div>
                                <div className="text-left flex-1 text-white">
                                    <div className="font-bold text-sm text-red-400">Eliminar todos los eventos futuros</div>
                                    <div className="text-xs text-red-400/70 mt-0.5">Elimina este evento y todos los posteriores</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
