
import { CalendarEvent } from '../types'
import { cn } from '@/lib/utils' // Assuming this exists or I'll check
import { format } from 'date-fns'

interface EventCardProps {
    event: CalendarEvent
    onClick: (event: CalendarEvent) => void
}

export function EventCard({ event, onClick }: EventCardProps) {
    const isMeeting = event.type === 'meeting'
    const isTask = event.type === 'task'

    return (
        <div
            onClick={(e) => {
                e.stopPropagation()
                onClick(event)
            }}
            className={cn(
                "px-2.5 py-1 text-[11px] sm:text-xs rounded-xl cursor-pointer truncate mb-1 transition-all border border-white/5 backdrop-blur-md",
                isMeeting && "bg-brand/10 text-brand border-l-2 border-l-brand hover:bg-brand/20 shadow-[0_0_20px_rgba(139,92,246,0.08)]",
                isTask && "bg-green-500/10 text-green-400 border-l-2 border-l-green-500 hover:bg-green-500/20",
                event.type === 'event' && "bg-blue-500/10 text-blue-400 border-l-2 border-l-blue-500 hover:bg-blue-500/20",
                event.color === 'red' && "bg-red-500/10 text-red-500 border-l-2 border-l-red-500",
                event.color === 'orange' && "bg-orange-500/10 text-orange-400 border-l-2 border-l-orange-500"
            )}
        >
            <div className="flex items-center gap-2.5">
                <span className="font-black text-[10px] opacity-60 shrink-0">{format(event.start, 'HH:mm')}</span>
                <span className="truncate font-semibold tracking-tight">{event.title}</span>
            </div>
        </div>
    )
}
