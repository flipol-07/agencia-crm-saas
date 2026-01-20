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
            const { data } = await supabase
                .from('tasks')
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
        <div className="glass rounded-xl p-6 border border-white/5 h-full">
            <h3 className="text-lg font-semibold text-white mb-4">Tareas Prioritarias</h3>
            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <p className="text-gray-500 text-sm">¡Todo al día! No hay tareas urgentes.</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-medium text-white text-sm line-clamp-1">{task.title}</p>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                                {task.projects?.contacts?.company_name} • {task.projects?.name}
                            </p>
                            {task.due_date && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Vence: {new Date(task.due_date).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <Link href="/tasks" className="text-sm text-lime-400 hover:text-lime-300">
                    Ver todas las tareas →
                </Link>
            </div>
        </div>
    )
}
