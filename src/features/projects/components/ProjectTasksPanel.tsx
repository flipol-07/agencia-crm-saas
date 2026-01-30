'use client'

import { useState } from 'react'
import { useContactProjects } from '@/features/projects/hooks'
import { useProjectTasks } from '@/features/tasks/hooks'
import type { Project, Task, TaskPriority } from '@/types/database'
import { TASK_PRIORITIES } from '@/types/database'

interface ProjectTasksPanelProps {
    contactId: string
}

function TaskItem({
    task,
    onToggle,
    onDelete
}: {
    task: Task
    onToggle: (completed: boolean) => void
    onDelete: () => void
}) {
    const priority = TASK_PRIORITIES.find(p => p.id === task.priority)

    const priorityColors: Record<string, string> = {
        low: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
        medium: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        high: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        urgent: 'bg-red-500/10 text-red-400 border border-red-500/20',
    }

    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 transition-all group ${task.is_completed ? 'opacity-40' : ''}`}>
            <button
                onClick={() => onToggle(!task.is_completed)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.is_completed
                    ? 'bg-lime-400 border-lime-400'
                    : 'border-white/20 hover:border-lime-400/50 hover:bg-lime-400/5'
                    }`}
            >
                {task.is_completed && (
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-sm font-medium ${task.is_completed ? 'text-zinc-500' : 'text-zinc-100'}`}>
                    {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}>
                        {priority?.label}
                    </span>
                    {task.due_date && (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(task.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    )
}

function ProjectCard({
    project,
    isExpanded,
    onToggle
}: {
    project: Project
    isExpanded: boolean
    onToggle: () => void
}) {
    const { tasks, loading, createTask, updateTask, deleteTask } = useProjectTasks(project.id)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    const statusColors: Record<string, string> = {
        pending: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
        active: 'bg-lime-500/10 text-lime-400 border border-lime-500/20',
        on_hold: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20',
    }

    const statusLabels: Record<string, string> = {
        pending: 'Pendiente',
        active: 'Activo',
        on_hold: 'En pausa',
        completed: 'Completado',
        cancelled: 'Cancelado',
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        setIsAdding(true)
        try {
            await createTask({ title: newTaskTitle.trim() })
            setNewTaskTitle('')
        } catch (error) {
            console.error('Error creating task:', error)
        } finally {
            setIsAdding(false)
        }
    }

    const pendingTasks = tasks.filter(t => !t.is_completed).length
    const totalTasks = tasks.length

    return (
        <div className={`border border-white/5 rounded-2xl transition-all overflow-hidden bg-zinc-900/20 ${isExpanded ? 'ring-1 ring-white/10 shadow-2xl' : 'hover:bg-zinc-900/40'}`}>
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-zinc-800/50 transition-transform ${isExpanded ? 'rotate-90 text-lime-400' : 'text-zinc-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h4 className="font-semibold text-zinc-100">{project.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${statusColors[project.status]}`}>
                                {statusLabels[project.status]}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-zinc-200">
                        {totalTasks - pendingTasks} <span className="text-zinc-500 font-normal">/ {totalTasks}</span>
                    </span>
                    <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-lime-400 transition-all duration-500"
                            style={{ width: `${totalTasks > 0 ? ((totalTasks - pendingTasks) / totalTasks) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 pt-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-4" />
                    {loading ? (
                        <div className="flex flex-col items-center py-8 gap-3">
                            <div className="w-6 h-6 border-2 border-lime-400/20 border-t-lime-400 rounded-full animate-spin" />
                            <span className="text-zinc-500 text-xs font-medium tracking-wide">Cargando tareas profesionalmente...</span>
                        </div>
                    ) : (
                        <>
                            {/* Task list */}
                            <div className="space-y-2">
                                {tasks.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl">
                                        <p className="text-zinc-500 text-xs">Sin tareas. Empieza a crear tu flujo.</p>
                                    </div>
                                ) : (
                                    tasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={(completed) => updateTask(task.id, { is_completed: completed })}
                                            onDelete={() => deleteTask(task.id)}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Add task form */}
                            <form onSubmit={handleAddTask} className="flex gap-2 group/form p-1 bg-zinc-950/50 rounded-xl border border-white/5 focus-within:border-lime-400/30 transition-all">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Añadir nueva tarea..."
                                    className="flex-1 px-4 py-2.5 text-sm bg-transparent border-none text-white placeholder-zinc-600 focus:outline-none focus:ring-0"
                                />
                                <button
                                    type="submit"
                                    disabled={isAdding || !newTaskTitle.trim()}
                                    className="px-4 py-2 text-sm bg-lime-400 text-black font-bold rounded-lg hover:bg-lime-300 disabled:opacity-0 transition-all shadow-lg shadow-lime-400/10"
                                >
                                    +
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export function ProjectTasksPanel({ contactId }: ProjectTasksPanelProps) {
    const { projects, loading, createProject } = useContactProjects(contactId)
    const [expandedProject, setExpandedProject] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [newProjectBudget, setNewProjectBudget] = useState('')

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newProjectName.trim()) return

        setIsCreating(true)
        try {
            const newProject = await createProject({
                name: newProjectName.trim(),
                budget: newProjectBudget ? Number(newProjectBudget) : 0
            })
            setExpandedProject(newProject.id)
            setNewProjectName('')
            setNewProjectBudget('')
        } catch (error) {
            console.error('Error creating project:', error)
        } finally {
            setIsCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="h-6 bg-white/5 rounded-lg w-1/3 animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shine" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
                    <div className="w-16 h-16 mb-4 bg-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-600 group hover:bg-lime-400/10 hover:text-lime-400 transition-all duration-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-zinc-400 font-semibold tracking-tight">Sin proyectos activos</p>
                    <p className="text-zinc-600 text-xs mt-1">Crea un proyecto para empezar a organizar las tareas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isExpanded={expandedProject === project.id}
                            onToggle={() => setExpandedProject(
                                expandedProject === project.id ? null : project.id
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Create project form */}
            <form onSubmit={handleCreateProject} className="flex gap-3 group/panel p-2 bg-zinc-950/30 rounded-2xl border border-white/5 focus-within:border-lime-400/20 transition-all shadow-inner">
                <div className="flex-1 flex items-center px-3 gap-3">
                    <svg className="w-5 h-5 text-zinc-600 group-focus-within/panel:text-lime-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Nombre del nuevo proyecto..."
                        className="flex-1 bg-transparent border-none text-white placeholder-zinc-600 focus:outline-none py-2 text-sm"
                    />
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <input
                        type="number"
                        value={newProjectBudget}
                        onChange={(e) => setNewProjectBudget(e.target.value)}
                        placeholder="Presupuesto €"
                        className="w-32 bg-transparent border-none text-white placeholder-zinc-600 focus:outline-none py-2 text-sm text-right"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isCreating || !newProjectName.trim()}
                    className="px-6 py-2.5 text-xs bg-zinc-800 text-zinc-100 font-bold uppercase tracking-widest rounded-xl hover:bg-lime-400 hover:text-black hover:shadow-lg hover:shadow-lime-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    {isCreating ? 'Creando...' : 'Crear Proyecto'}
                </button>
            </form>
        </div>
    )
}
