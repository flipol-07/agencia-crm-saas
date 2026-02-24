
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { scheduleGoogleMeetingAction } from '../actions/calendarActions'
import { calendarService } from '../services/calendarService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { X, Calendar, Users, FileText, Link, CheckCircle2, Repeat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addDays, addWeeks, addMonths } from 'date-fns'

interface AddMeetingModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    selectedDate?: Date
}

export function AddMeetingModal({ isOpen, onClose, onSuccess, selectedDate }: AddMeetingModalProps) {
    const [loading, setLoading] = useState(false)
    const [contacts, setContacts] = useState<any[]>([])
    const [teamMembers, setTeamMembers] = useState<any[]>([])
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
    const [successData, setSuccessData] = useState<any>(null)
    const { user } = useAuth()

    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceFreq, setRecurrenceFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY')
    const [recurrenceCount, setRecurrenceCount] = useState(10)

    // Fetch contacts and team members
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: contactsData } = await supabase.from('contacts').select('id, company_name, contact_name')
            const { data: profilesData } = await supabase.from('profiles').select('id, email, full_name')

            if (contactsData) setContacts(contactsData)
            if (profilesData) {
                setTeamMembers(profilesData)
                // Default invite to the lists provided in the screenshot if they exist in DB
                const initialAttendees = [
                    'antonloredogonzalez@gmail.com',
                    'franciscoamdesign@gmail.com',
                    'lorenzopizarropol@gmail.com',
                    'plorenzopizarro@gmail.com',
                    'sabinajvargas16@gmail.com'
                ].filter(email => (profilesData as any[]).some((p: any) => p.email === email))
                setSelectedAttendees(initialAttendees)
            }
        }
        if (isOpen) fetchData()
    }, [isOpen])

    if (!isOpen) return null

    const toggleAttendee = (email: string) => {
        setSelectedAttendees(prev =>
            prev.includes(email)
                ? prev.filter(e => e !== email)
                : [...prev, email]
        )
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!user) {
            toast.error('You must be logged in to schedule a meeting')
            return
        }

        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const dateStr = formData.get('date') as string
            const recurrenceRules = isRecurring ? [`RRULE:FREQ=${recurrenceFreq};COUNT=${recurrenceCount}`] : undefined

            const result = await scheduleGoogleMeetingAction({
                title: formData.get('title') as string,
                date: dateStr,
                summary: formData.get('summary') as string,
                attendees: selectedAttendees,
                ...(recurrenceRules ? { recurrence: recurrenceRules } : {})
            })

            if (result.success) {
                setSuccessData(result.data)
                toast.success('¡Reunión agendada y sincronizada con Google Calendar!')

                const baseDate = new Date(dateStr)
                const meetingsToInsert: any[] = []
                const series_id = isRecurring ? crypto.randomUUID() : null

                const occurrences = isRecurring ? recurrenceCount : 1

                for (let i = 0; i < occurrences; i++) {
                    let instanceDate = new Date(baseDate)
                    if (i > 0) {
                        if (recurrenceFreq === 'DAILY') instanceDate = addDays(baseDate, i)
                        else if (recurrenceFreq === 'WEEKLY') instanceDate = addWeeks(baseDate, i)
                        else if (recurrenceFreq === 'MONTHLY') instanceDate = addMonths(baseDate, i)
                    }

                    meetingsToInsert.push({
                        title: formData.get('title') as string,
                        date: instanceDate.toISOString(),
                        summary: formData.get('summary') as string,
                        contact_id: (formData.get('contact_id') as string) || null,
                        user_id: user.id,
                        meeting_url: result.data?.meetLink || null,
                        external_id: result.data?.id || null, // Google ID (same for series in Google)
                        series_id,
                        status: 'scheduled' as const
                    })
                }

                console.log(`💾 Guardando ${meetingsToInsert.length} reunión(es) en BD. Asistentes:`, selectedAttendees)

                try {
                    await calendarService.createMeetings(meetingsToInsert, selectedAttendees)
                    console.log('✅ Reuniones guardadas en BD correctamente')
                } catch (dbError: any) {
                    console.error('❌ Error de sincronización de base de datos:', JSON.stringify(dbError, null, 2))

                    if (dbError?.code === 'PGRST204') {
                        console.warn('⚠️ PGRST204 detectado. Reintentando sin meeting_url...')
                        try {
                            const fallbackPayloads = meetingsToInsert.map(m => {
                                const { meeting_url, ...fallbackPayload } = m
                                return fallbackPayload
                            })
                            await calendarService.createMeetings(fallbackPayloads as any, selectedAttendees, { select: 'id, title', skipMeetingUrl: true })
                            toast.success('Reuniones guardadas (Advertencia: Enlace de sincronización omitido)')
                            onClose()
                            return
                        } catch (retryError) {
                            console.error('❌ El reintento falló:', retryError)
                            toast.error('Error al guardar las reuniones incluso después de reintentar.')
                        }
                    } else {
                        toast.error(`Error de base de datos: ${dbError.message || 'Error desconocido'}`)
                    }
                }

                onSuccess()
                setTimeout(() => {
                    onClose()
                    setSuccessData(null)
                }, 5000)
            } else {
                toast.error((result as any).error || 'Error al sincronizar con Google Calendar')
            }
        } catch (error: any) {
            console.error('AddMeetingModal Error:', JSON.stringify(error, null, 2))
            toast.error(`Error al agendar la reunión: ${error.message || 'Error desconocido'}`)
        } finally {
            setLoading(false)
        }
    }

    const defaultDate = selectedDate
        ? new Date(selectedDate.setHours(10, 0, 0)).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="relative bg-[#050505] rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header with gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />

                        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.01] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20">
                                    <Calendar className="h-5 w-5 text-brand" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Agendar Reunión / Llamada</h2>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sincronización con Google Calendar Activa</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {successData ? (
                            <div className="p-12 text-center space-y-6 animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar">
                                <div className="mx-auto w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center border border-brand/30">
                                    <CheckCircle2 className="h-8 w-8 text-brand" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">¡Reunión Confirmada!</h3>
                                    <p className="text-gray-400">Se han enviado invitaciones a todos los participantes.</p>
                                </div>
                                {successData.meetLink && (
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Link className="h-4 w-4 text-brand flex-shrink-0" />
                                            <span className="text-sm text-gray-400 truncate font-mono">{successData.meetLink}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(successData.meetLink);
                                                toast.success('¡Enlace copiado!');
                                            }}
                                            className="text-[10px] uppercase font-bold tracking-widest hover:bg-brand/10 hover:text-brand"
                                        >
                                            Copiar
                                        </Button>
                                    </div>
                                )}
                                <Button onClick={onClose} className="w-full h-12 rounded-2xl bg-white text-black font-bold hover:bg-gray-200">
                                    Listo
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3" /> Título de la Reunión
                                        </label>
                                        <input
                                            id="title"
                                            name="title"
                                            required
                                            placeholder="Ej: Revisión de Estrategia"
                                            className="flex h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-2 text-sm text-white placeholder:text-gray-600 focus:border-brand/40 focus:bg-white/[0.05] transition-all outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> Fecha y Hora
                                        </label>
                                        <input
                                            id="date"
                                            name="date"
                                            type="datetime-local"
                                            required
                                            defaultValue={defaultDate}
                                            className="flex h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-2 text-sm text-white focus:border-brand/40 transition-all outline-none [color-scheme:dark]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="contact_id" className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                            <Users className="h-3 w-3" /> Contacto Relacionado
                                        </label>
                                        <select
                                            name="contact_id"
                                            className="flex h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-2 text-sm text-white focus:border-brand/40 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-[#0A0A0A]">Ninguno</option>
                                            {contacts.map(contact => (
                                                <option key={contact.id} value={contact.id} className="bg-[#0A0A0A]">
                                                    {contact.contact_name || contact.company_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Toggle Recurrencia */}
                                    <div className="col-span-2 space-y-4 pt-2 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Repeat className="h-4 w-4 text-brand" />
                                                <span className="text-sm font-semibold text-white">Reunión Recurrente</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={isRecurring}
                                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                                            </label>
                                        </div>

                                        <AnimatePresence>
                                            {isRecurring && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="grid grid-cols-2 gap-4 overflow-hidden"
                                                >
                                                    <div className="space-y-2 pt-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Frecuencia</label>
                                                        <select
                                                            value={recurrenceFreq}
                                                            onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                                                            className="flex h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-2 text-sm text-white focus:border-brand/40 transition-all outline-none appearance-none"
                                                        >
                                                            <option value="DAILY" className="bg-[#0A0A0A]">Diaria</option>
                                                            <option value="WEEKLY" className="bg-[#0A0A0A]">Semanal</option>
                                                            <option value="MONTHLY" className="bg-[#0A0A0A]">Mensual</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2 pt-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Repeticiones (Max 52)</label>
                                                        <input
                                                            type="number"
                                                            min={2}
                                                            max={52}
                                                            value={Number.isNaN(recurrenceCount) ? '' : recurrenceCount}
                                                            onChange={(e) => setRecurrenceCount(parseInt(e.target.value))}
                                                            className="flex h-12 w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-2 text-sm text-white focus:border-brand/40 transition-all outline-none"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                        <Users className="h-3 w-3" /> Invitar Miembros del Equipo
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl border border-white/5 bg-white/[0.02] max-h-40 overflow-y-auto custom-scrollbar">
                                        {teamMembers.map(member => (
                                            <label key={member.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${selectedAttendees.includes(member.email) ? 'bg-brand/10 border-brand/30' : 'bg-transparent border-white/5 hover:bg-white/[0.03]'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAttendees.includes(member.email)}
                                                    onChange={() => toggleAttendee(member.email)}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedAttendees.includes(member.email) ? 'bg-brand border-brand' : 'border-white/20'}`}>
                                                    {selectedAttendees.includes(member.email) && <CheckCircle2 className="h-3 w-3 text-black" />}
                                                </div>
                                                <span className={`text-[11px] font-medium transition-colors ${selectedAttendees.includes(member.email) ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                    {member.full_name || member.email.split('@')[0]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="summary" className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                        <FileText className="h-3 w-3" /> Agenda / Resumen
                                    </label>
                                    <textarea
                                        id="summary"
                                        name="summary"
                                        placeholder="Discutir la hoja de ruta del proyecto y entregables clave..."
                                        className="flex min-h-[100px] w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:border-brand/40 focus:bg-white/[0.05] transition-all outline-none resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-12 px-8 text-gray-400 hover:text-white">
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        isLoading={loading}
                                        className="rounded-2xl h-12 px-10 bg-brand hover:brightness-110 text-black font-black uppercase tracking-wider text-xs shadow-[0_0_30px_rgba(163,230,53,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Agendar y Sincronizar
                                    </Button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
