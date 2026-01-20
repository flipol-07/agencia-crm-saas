'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAllTasks } from '@/features/tasks/hooks'
import { useAuth } from '@/hooks/useAuth'
import { TASK_PRIORITIES } from '@/types/database'
import type { TaskWithProject, TaskPriority } from '@/types/database'

type FilterMode = 'all' | 'mine'
type SortMode = 'priority' | 'due_date' | 'project'

function TaskCard({
    task,
    onToggle
}: {
    task: TaskWithProject
    onToggle: () => void
}) {
    const priority = TASK_PRIORITIES.find(p => p.id === task.priority)

    const priorityColors: Record<string, string> = {
        low: 'border-l-gray-500',
        medium: 'border-l-blue-500',
        high: 'border-l-amber-500',
        urgent: 'border-l-red-500',
    }

    const priorityBadgeColors: Record<string, string> = {
        low: 'bg-gray-500/20 text-gray-400',
        medium: 'bg-blue-500/20 text-blue-400',
        high: 'bg-amber-500/20 text-amber-400',
        urgent: 'bg-red-500/20 text-red-400',
    }

    const isOverdue = task.due_date && new Date(task.due_date) < new Date()

    return (
        <div className={`glass rounded-lg p-4 border-l-4 ${priorityColors[task.priority]} hover:bg-white/5 transition-all`}>
            <div className="flex items-start gap-3">
                <button
                    onClick={onToggle}
                    className="mt-1 w-5 h-5 rounded border-2 border-white/30 hover:border-lime-400 flex items-center justify-center transition-all"
                />

                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{task.title}</h3>

                    <div className="flex items-center gap-3 mt-2 text-sm">
                        <Link
                            href={`/contacts/${task.projects.contact_id}`}
                            className="text-gray-400 hover:text-lime-400 transition-colors"
                        >
                            🏢 {task.projects.contacts.company_name}
                        </Link>
                        <span className="text-gray-600">→</span>
                        <span className="text-gray-400">📋 {task.projects.name}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadgeColors[task.priority]}`}>
                            {priority?.label}
                        </span>

                        {task.due_date && (
                            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                                📅 {new Date(task.due_date).toLocaleDateString('es-ES')}
                                {isOverdue && ' (Vencida)'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function TasksGroupedByPriority({ tasks, onToggle }: { tasks: TaskWithProject[], onToggle: (id: string) => void }) {
    const priorityOrder: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

    const grouped = priorityOrder.reduce((acc, priority) => {
        acc[priority] = tasks.filter(t => t.priority === priority)
        return acc
    }, {} as Record<TaskPriority, TaskWithProject[]>)

    const priorityLabels: Record<TaskPriority, string> = {
        urgent: '🔴 Urgente',
        high: '🟠 Alta',
        medium: '🔵 Media',
        low: '⚪ Baja',
    }

    return (
        <div className="space-y-6">
            {priorityOrder.map(priority => {
                if (grouped[priority].length === 0) return null
                return (
                    <div key={priority}>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">
                            {priorityLabels[priority]} ({grouped[priority].length})
                        </h3>
                        <div className="space-y-3">
                            {grouped[priority].map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onToggle={() => onToggle(task.id)}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function TasksGroupedByProject({ tasks, onToggle }: { tasks: TaskWithProject[], onToggle: (id: string) => void }) {
    const grouped = tasks.reduce((acc, task) => {
        const projectId = task.projects.id
        if (!acc[projectId]) {
            acc[projectId] = {
                project: task.projects,
                tasks: [],
            }
        }
        acc[projectId].tasks.push(task)
        return acc
    }, {} as Record<string, { project: TaskWithProject['projects'], tasks: TaskWithProject[] }>)

    return (
        <div className="space-y-6">
            {Object.values(grouped).map(({ project, tasks }) => (
                <div key={project.id}>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">
                        📋 {project.name} — {project.contacts.company_name} ({tasks.length})
                    </h3>
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggle={() => onToggle(task.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function TasksPage() {
    const { user } = useAuth()
    const { tasks, loading, toggleComplete } = useAllTasks()
    const [filterMode, setFilterMode] = useState<FilterMode>('all')
    const [sortMode, setSortMode] = useState<SortMode>('priority')

    // Filtrar tareas
    const filteredTasks = filterMode === 'mine' && user
        ? tasks.filter(t => t.assigned_to === user.id)
        : tasks

    // Ordenar si es por fecha
    const sortedTasks = sortMode === 'due_date'
        ? [...filteredTasks].sort((a, b) => {
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        })
        : filteredTasks

    const handleToggle = async (id: string) => {
        try {
            await toggleComplete(id, true)
        } catch (error) {
            console.error('Error toggling task:', error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Mis Tareas</h1>
                    <p className="text-gray-400 mt-1">
                        {loading ? 'Cargando...' : `${filteredTasks.length} tareas pendientes`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-4 py-2 text-sm transition-all ${filterMode === 'all'
                                    ? 'bg-lime-400 text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilterMode('mine')}
                            className={`px-4 py-2 text-sm transition-all ${filterMode === 'mine'
                                    ? 'bg-lime-400 text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Mis Tareas
                        </button>
                    </div>

                    {/* Sort */}
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-lime-400"
                    >
                        <option value="priority" className="bg-gray-900">Por Prioridad</option>
                        <option value="project" className="bg-gray-900">Por Proyecto</option>
                        <option value="due_date" className="bg-gray-900">Por Fecha</option>
                    </select>
                </div>
            </div>

            {/* Tasks */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="glass rounded-lg p-4 animate-pulse">
                            <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
                            <div className="h-4 bg-white/10 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-lime-400/10 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">¡Todo al día!</h3>
                    <p className="text-gray-400">No hay tareas pendientes</p>
                </div>
            ) : sortMode === 'project' ? (
                <TasksGroupedByProject tasks={sortedTasks} onToggle={handleToggle} />
            ) : (
                <TasksGroupedByPriority tasks={sortedTasks} onToggle={handleToggle} />
            )}
        </div>
    )
}
