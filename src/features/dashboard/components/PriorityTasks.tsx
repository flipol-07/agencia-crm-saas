'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types/database'
import Link from 'next/link'

export function PriorityTasks() {
    const [tasks, setTasks] = useState<any[]>([]) // Using any for join result type simplicity
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchTasks() {
            // Fetch tareas de alta prioridad no completadas
            const { data } = await (supabase.from('tasks') as any)
                .select(`
          *,
          projects ( name, contact_id, contacts ( company_name ) )
        `)
                .eq('is_completed', false)
                .in('priority', ['urgent', 'high'])
                .order('due_date', { ascending: true })
                .limit(5)

            if (data) setTasks(data)
            setLoading(false)
        }
        fetchTasks()
    }, [supabase])

    if (loading) return <div className="h-48 animate-pulse bg-white/5 rounded-xl" />

    return (
        <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
                    Prioridades
                </h3>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <p className="text-zinc-500 text-sm">¡Todo al día! No hay tareas urgentes.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="group p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-medium text-zinc-200 text-sm line-clamp-1 group-hover:text-lime-400 transition-colors">
                                    {task.title}
                                </p>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${task.priority === 'urgent'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                    {task.projects?.contacts?.company_name || 'Sin cliente'}
                                </span>
                                <span className="text-xs text-zinc-600">•</span>
                                <span className="text-xs text-zinc-500">
                                    {task.projects?.name || 'Sin proyecto'}
                                </span>
                            </div>

                            {task.due_date && (
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <p className={`text-xs flex items-center gap-1.5 ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-zinc-400'
                                        }`}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(task.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    </p>
                                    <Link href={`/projects`} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-lime-400 hover:underline">
                                        Ver →
                                    </Link>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            {tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <Link href="/tasks" className="text-xs uppercase tracking-wider font-semibold text-zinc-500 hover:text-lime-400 transition-colors">
                        Ver todas las tareas
                    </Link>
                </div>
            )}
        </div>
    )
}
