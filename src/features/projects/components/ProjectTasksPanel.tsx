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
        low: 'bg-gray-500/20 text-gray-400',
        medium: 'bg-blue-500/20 text-blue-400',
        high: 'bg-amber-500/20 text-amber-400',
        urgent: 'bg-red-500/20 text-red-400',
    }

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group ${task.is_completed ? 'opacity-50' : ''}`}>
            <button
                onClick={() => onToggle(!task.is_completed)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${task.is_completed
                        ? 'bg-lime-400 border-lime-400'
                        : 'border-white/30 hover:border-lime-400'
                    }`}
            >
                {task.is_completed && (
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
                    {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                        {priority?.label}
                    </span>
                    {task.due_date && (
                        <span className="text-xs text-gray-500">
                            📅 {new Date(task.due_date).toLocaleDateString('es-ES')}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        pending: 'bg-gray-500/20 text-gray-400',
        active: 'bg-lime-500/20 text-lime-400',
        on_hold: 'bg-amber-500/20 text-amber-400',
        completed: 'bg-green-500/20 text-green-400',
        cancelled: 'bg-red-500/20 text-red-400',
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
        <div className="border border-white/10 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
            >
                <div className="flex items-center gap-3">
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-white">{project.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>
                        {statusLabels[project.status]}
                    </span>
                </div>
                <span className="text-sm text-gray-500">
                    {pendingTasks}/{totalTasks} tareas
                </span>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                    {loading ? (
                        <div className="text-center py-4">
                            <span className="text-gray-500 text-sm">Cargando tareas...</span>
                        </div>
                    ) : (
                        <>
                            {/* Task list */}
                            <div className="space-y-2">
                                {tasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={(completed) => updateTask(task.id, { is_completed: completed })}
                                        onDelete={() => deleteTask(task.id)}
                                    />
                                ))}
                            </div>

                            {/* Add task form */}
                            <form onSubmit={handleAddTask} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Nueva tarea..."
                                    className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                                />
                                <button
                                    type="submit"
                                    disabled={isAdding || !newTaskTitle.trim()}
                                    className="px-3 py-2 text-sm bg-lime-400 text-black rounded-lg hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newProjectName.trim()) return

        setIsCreating(true)
        try {
            const newProject = await createProject({ name: newProjectName.trim() })
            setNewProjectName('')
            setExpandedProject(newProject.id)
        } catch (error) {
            console.error('Error creating project:', error)
        } finally {
            setIsCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="border border-white/10 rounded-lg p-4 animate-pulse">
                        <div className="h-5 bg-white/10 rounded w-2/3" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {projects.length === 0 ? (
                <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white/5 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">Sin proyectos</p>
                </div>
            ) : (
                <div className="space-y-2">
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
            <form onSubmit={handleCreateProject} className="flex gap-2">
                <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Nuevo proyecto..."
                    className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                />
                <button
                    type="submit"
                    disabled={isCreating || !newProjectName.trim()}
                    className="px-4 py-2 text-sm bg-lime-400 text-black rounded-lg hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    + Proyecto
                </button>
            </form>
        </div>
    )
}
