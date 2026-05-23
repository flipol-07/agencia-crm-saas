'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getContactTimelineAction, type TimelineEvent, type TimelineEventType } from '../actions/timelineActions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TYPE_LABEL: Record<TimelineEventType, string> = {
    email: 'Email',
    meeting: 'Reunión',
    invoice: 'Factura',
    task: 'Tarea',
    note: 'Nota',
}

const TYPE_STYLE: Record<TimelineEventType, { icon: string; dot: string }> = {
    email: { icon: '✉️', dot: 'bg-blue-500' },
    meeting: { icon: '📞', dot: 'bg-purple-500' },
    invoice: { icon: '📄', dot: 'bg-emerald-500' },
    task: { icon: '✅', dot: 'bg-yellow-500' },
    note: { icon: '📝', dot: 'bg-gray-400' },
}

const ALL_TYPES: TimelineEventType[] = ['email', 'meeting', 'invoice', 'task', 'note']

interface Props {
    contactId: string
}

export function ContactTimeline({ contactId }: Props) {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<Set<TimelineEventType>>(new Set(ALL_TYPES))

    const refresh = useCallback(async () => {
        setLoading(true)
        const res = await getContactTimelineAction({ contactId })
        if (res.success && res.events) setEvents(res.events)
        setLoading(false)
    }, [contactId])

    useEffect(() => { refresh() }, [refresh])

    const filtered = useMemo(() => events.filter(e => filters.has(e.type)), [events, filters])

    const toggleFilter = (t: TimelineEventType) => {
        setFilters(prev => {
            const next = new Set(prev)
            if (next.has(t)) next.delete(t); else next.add(t)
            // Si todos quedan fuera, restablecer (UX)
            if (next.size === 0) return new Set(ALL_TYPES)
            return next
        })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>🕒</span> Timeline
                </h2>
                <div className="flex gap-1 flex-wrap">
                    {ALL_TYPES.map(t => {
                        const active = filters.has(t)
                        return (
                            <button
                                key={t}
                                onClick={() => toggleFilter(t)}
                                className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border transition-all ${
                                    active
                                        ? 'bg-white/10 text-white border-white/20'
                                        : 'bg-transparent text-gray-500 border-white/5 hover:border-white/10'
                                }`}
                            >
                                {TYPE_STYLE[t].icon} {TYPE_LABEL[t]}
                            </button>
                        )
                    })}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-lg" />)}
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white/[0.02] border border-dashed border-white/10 rounded-lg px-4 py-6 text-center">
                    Sin actividad reciente para los filtros seleccionados.
                </p>
            ) : (
                <ol className="relative border-l border-white/10 ml-3 space-y-4">
                    {filtered.map(e => {
                        const style = TYPE_STYLE[e.type]
                        return (
                            <li key={e.id} className="ml-6 relative">
                                <span className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full ${style.dot} ring-4 ring-black/40`} />
                                <div className="bg-black/30 border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{TYPE_LABEL[e.type]}</span>
                                                {e.subtitle && <span className="text-xs text-gray-500">· {e.subtitle}</span>}
                                            </div>
                                            <div className="mt-1 text-sm text-white font-medium">
                                                {e.href ? (
                                                    <Link href={e.href} className="hover:text-[#a78bfa] transition-colors">
                                                        {e.title}
                                                    </Link>
                                                ) : e.title}
                                            </div>
                                            {e.meta && (
                                                <div className="mt-1 text-xs text-gray-400 line-clamp-2">{e.meta}</div>
                                            )}
                                        </div>
                                        <time className="text-[10px] text-gray-500 shrink-0">
                                            {format(new Date(e.occurred_at), "d MMM yyyy · HH:mm", { locale: es })}
                                        </time>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ol>
            )}
        </div>
    )
}
