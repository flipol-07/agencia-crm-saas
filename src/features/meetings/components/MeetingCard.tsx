'use client'

import { Meeting } from '../types'

interface MeetingCardProps {
    meeting: Meeting
    onClick: () => void
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer h-full bg-zinc-900/20 border border-white/5 rounded-xl p-5 hover:bg-zinc-900/40 hover:border-lime-400/20 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-lime-500/50" />

            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white group-hover:text-lime-400 transition-colors line-clamp-1">{meeting.title}</h3>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(meeting.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
            </div>

            {meeting.contacts && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-sm text-blue-300 truncate">{meeting.contacts.company_name}</span>
                </div>
            )}

            <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-1">
                {meeting.summary ? meeting.summary.replace(/[#*]/g, '') : 'Sin resumen disponible'}
            </p>

            {meeting.key_points && meeting.key_points.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-auto">
                    {meeting.key_points.slice(0, 2).map((point, i) => (
                        <span key={i} className="text-[10px] bg-white/5 text-gray-300 px-2 py-1 rounded border border-white/5 truncate max-w-full">
                            {point}
                        </span>
                    ))}
                    {meeting.key_points.length > 2 && (
                        <span className="text-[10px] text-gray-500 px-1 py-1">+{meeting.key_points.length - 2}</span>
                    )}
                </div>
            )}
        </div>
    )
}
