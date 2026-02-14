
'use client'

import { useState, useEffect } from 'react'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    isToday
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Video } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/lib/utils'
import { CalendarEvent } from '../types'
import { calendarService } from '../services/calendarService'
import { EventCard } from './EventCard'
import { AddEventModal } from './AddEventModal'
import { AddMeetingModal } from './AddMeetingModal'
import { EventDetailsModal } from './EventDetailsModal'
import { toast } from 'sonner'

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<'month' | 'week' | 'day'>('month')
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchEvents = async () => {
        // ... (fetch logic same as before) ...
        setLoading(true)
        try {
            let start, end
            if (view === 'month') {
                start = startOfWeek(startOfMonth(currentDate))
                end = endOfWeek(endOfMonth(currentDate))
            } else if (view === 'week') {
                start = startOfWeek(currentDate)
                end = endOfWeek(currentDate)
            } else {
                start = currentDate // simple day fetch
                end = currentDate
            }

            const data = await calendarService.getCalendarEvents(start, end)
            setEvents(data)
        } catch (error) {
            console.error('Calendar: Fetch error:', error)
            toast.error('Error al cargar los eventos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [currentDate, view])

    // Navigation logic
    const next = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
        else setCurrentDate(addDays(currentDate, 1))
    }

    const prev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
        else setCurrentDate(subDays(currentDate, 1))
    }

    const today = () => setCurrentDate(new Date())

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
    }

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event)
        setIsDetailsModalOpen(true)
    }

    // Generate days for grid
    const days = eachDayOfInterval({
        start: startOfWeek(view === 'month' ? startOfMonth(currentDate) : currentDate),
        end: endOfWeek(view === 'month' ? endOfMonth(currentDate) : currentDate)
    })

    // Week days header
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    const handleDeleteEvent = async (event: CalendarEvent) => {
        if (event.type === 'meeting') {
            await calendarService.deleteMeeting(event.id)
        } else if (event.type === 'event') {
            await calendarService.deleteEvent(event.id)
        }
        await fetchEvents()
        toast.success('Eliminado correctamente')
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] gap-4 sm:gap-0">
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-4 sm:gap-6">
                    <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-brand to-white bg-clip-text text-transparent tracking-tight">
                        {format(currentDate, view === 'day' ? "d 'de' MMMM, yyyy" : 'MMMM yyyy', { locale: es })}
                    </h1>
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1.5 gap-1.5 shadow-inner">
                        <Button variant="ghost" size="sm" onClick={prev} className="hover:bg-white/10 h-8 w-8 p-0"><ChevronLeft className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="sm" onClick={today} className="px-2 sm:px-4 hover:bg-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            <span>Hoy</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={next} className="hover:bg-white/10 h-8 w-8 p-0"><ChevronRight className="h-5 w-5" /></Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {/* View Switcher */}
                    <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 sm:mr-4">
                        <Button
                            variant={view === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('month')}
                            className={cn("px-3 sm:px-4 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider", view === 'month' && "bg-brand text-black shadow-lg shadow-brand/20")}
                        >
                            Mes
                        </Button>
                        <Button
                            variant={view === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('week')}
                            className={cn("px-3 sm:px-4 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider", view === 'week' && "bg-brand text-black shadow-lg shadow-brand/20")}
                        >
                            Semana
                        </Button>
                        <Button
                            variant={view === 'day' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('day')}
                            className={cn("px-3 sm:px-4 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider", view === 'day' && "bg-brand text-black shadow-lg shadow-brand/20")}
                        >
                            Día
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsEventModalOpen(true)} size="sm" className="gap-2 px-3 sm:px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Añadir Evento</span>
                        </Button>
                        <Button onClick={() => setIsMeetingModalOpen(true)} size="sm" className="gap-2 px-3 sm:px-4 rounded-xl bg-brand hover:brightness-110 text-black text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand/10">
                            <Video className="h-4 w-4" /> <span className="hidden sm:inline">Agendar</span>
                        </Button>
                    </div>
                </div>
            </div>


            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                {loading && !events.length && (
                    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
                    </div>
                )}
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02] shrink-0">
                    {weekDays.map(day => (
                        <div key={day} className="py-3 text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 border-r border-white/5 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-variable min-h-0 overflow-hidden"
                    style={{ gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, 1fr)` }}>
                    {days.map((day, i) => {
                        const dayEvents = events.filter(e => isSameDay(e.start, day))
                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDateClick(day)}
                                className={cn(
                                    "border-b border-r border-white/5 p-1 sm:p-2 flex flex-col transition-all duration-300 hover:bg-white/[0.02] relative group/day overflow-hidden",
                                    !isSameMonth(day, currentDate) && "bg-white/[0.005] opacity-20",
                                    isToday(day) && "bg-brand/[0.03] border-t-2 border-t-brand/50",
                                    (i + 1) % 7 === 0 && "border-r-0"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1 h-6 shrink-0">
                                    <span className={cn(
                                        "text-[9px] sm:text-[10px] font-bold h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full transition-all duration-300",
                                        isToday(day) && "bg-brand text-black shadow-[0_0_15px_rgba(139,92,246,0.3)]",
                                        selectedDate && isSameDay(day, selectedDate) && !isToday(day) && "bg-white/10 text-white border border-white/20",
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {isToday(day) && (
                                        <span className="text-[8px] font-black uppercase tracking-widest text-brand mr-1 mt-1 opacity-70">Hoy</span>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                    {dayEvents.map(event => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onClick={() => handleEventClick(event)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <AddEventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSuccess={fetchEvents}
                selectedDate={selectedDate || new Date()}
            />

            <AddMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                onSuccess={fetchEvents}
                selectedDate={selectedDate || new Date()}
            />

            <EventDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                event={selectedEvent}
                onDelete={handleDeleteEvent}
            />
        </div>
    )
}
