'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTasksWithDetails, useTeamMembers } from '@/features/tasks/hooks'
import {
    TaskStatusSelector,
    TaskAssigneeAvatars,
    TaskModal,
    CreateTaskModal,
    TaskCard,
    KanbanBoard,
    IntelligentTaskWidget
} from '@/features/tasks/components'

import { useAuth } from '@/hooks/useAuth'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/database'
import type { TaskWithDetails, TaskStatus, TaskPriority } from '@/types/database'

type ViewMode = 'list' | 'kanban'
type FilterMode = 'all' | 'mine'

// ============ LIST VIEW ============
function TasksListView({
    tasks,
    onOpenTask,
    onStatusChange,
    showCompleted
}: {
    tasks: TaskWithDetails[]
    onOpenTask: (task: TaskWithDetails) => void
    onStatusChange: (taskId: string, status: TaskStatus) => void
    showCompleted: boolean
}) {
    const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'blocked']
    if (showCompleted) {
        statusOrder.push('done')
    }

    const filteredTasks = tasks.filter(t => showCompleted || t.status !== 'done')

    const grouped = statusOrder.reduce((acc, status) => {
        acc[status] = filteredTasks.filter(t => t.status === status)
        return acc
    }, {} as Record<TaskStatus, TaskWithDetails[]>)

    const statusConfig = TASK_STATUSES.reduce((acc, s) => {
        acc[s.id as TaskStatus] = s
        return acc
    }, {} as Record<TaskStatus, typeof TASK_STATUSES[number]>)

    return (
        <div className="space-y-8">
            {statusOrder.map(status => {
                if (grouped[status].length === 0) return null
                const config = statusConfig[status]
                return (
                    <div key={status}>
                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                            <span className="text-gray-600 bg-white/5 px-2 py-0.5 rounded-full text-xs">{grouped[status].length}</span>
                        </h3>
                        <div className="space-y-3">
                            {grouped[status].map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onOpen={() => onOpenTask(task)}
                                    onStatusChange={(s) => onStatusChange(task.id, s)}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ============ MAIN PAGE ============
export default function TasksPage() {
    const { user, profile } = useAuth()
    const { tasks, loading, updateTaskStatus, assignUser, unassignUser, updateTaskDetails, createQuickTask, deleteTask, refetch } = useTasksWithDetails()
    const { members } = useTeamMembers()

    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [filterMode, setFilterMode] = useState<FilterMode>('all')
    const [filterAssignee, setFilterAssignee] = useState<string>('')
    const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showCompleted, setShowCompleted] = useState(false)

    // Filtrar tareas
    const filteredTasks = useMemo(() => {
        let result = tasks

        // Búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query) ||
                t.projects?.name.toLowerCase().includes(query) ||
                t.projects?.contacts?.company_name.toLowerCase().includes(query)
            )
        }

        // Mis tareas
        if (filterMode === 'mine' && user) {
            result = result.filter(t =>
                t.task_assignees.some(a => a.user_id === user.id)
            )
        }

        // Por asignado
        if (filterAssignee) {
            result = result.filter(t =>
                t.task_assignees.some(a => a.user_id === filterAssignee)
            )
        }

        // Por prioridad
        if (filterPriority) {
            result = result.filter(t => t.priority === filterPriority)
        }

        return result
    }, [tasks, searchQuery, filterMode, filterAssignee, filterPriority, user])

    const handleStatusChange = async (taskId: string, status: TaskStatus) => {
        try {
            await updateTaskStatus(taskId, status)
            if (selectedTask?.id === taskId) {
                setSelectedTask(prev => prev ? { ...prev, status } : null)
            }
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleAssign = async (userId: string) => {
        if (!selectedTask) return
        try {
            await assignUser(selectedTask.id, userId)
            const member = members.find(m => m.id === userId)
            if (member) {
                setSelectedTask(prev => prev ? {
                    ...prev,
                    task_assignees: [...prev.task_assignees, {
                        id: crypto.randomUUID(),
                        task_id: prev.id,
                        user_id: userId,
                        created_at: new Date().toISOString(),
                        profiles: member
                    }]
                } : null)
            }
        } catch (error) {
            console.error('Error assigning user:', error)
        }
    }

    const handleUnassign = async (userId: string) => {
        if (!selectedTask) return
        try {
            await unassignUser(selectedTask.id, userId)
            setSelectedTask(prev => prev ? {
                ...prev,
                task_assignees: prev.task_assignees.filter(a => a.user_id !== userId)
            } : null)
        } catch (error) {
            console.error('Error unassigning user:', error)
        }
    }

    const handleUpdateDetails = async (updates: { title?: string; description?: string | null; priority?: TaskPriority; due_date?: string | null }) => {
        if (!selectedTask) return
        try {
            await updateTaskDetails(selectedTask.id, updates)
            setSelectedTask(prev => prev ? { ...prev, ...updates } : null)
        } catch (error) {
            console.error('Error updating task:', error)
        }
    }

    const handleCreateTask = async (taskData: {
        title: string
        project_id?: string | null
        contact_id?: string | null
        description?: string
        priority: TaskPriority
        due_date?: string | null
    }) => {
        await createQuickTask(taskData.title, taskData.project_id || '', {
            description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.due_date || null,
            contact_id: taskData.contact_id || null
        })
        await refetch()
    }

    const hasFilters = searchQuery || filterAssignee || filterPriority || filterMode !== 'all'

    return (
        <div className="space-y-6">
            {/* Header */}
            <IntelligentTaskWidget
                tasks={tasks}
                userProfile={profile}
                onOpenTask={setSelectedTask}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div>
                    <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">Gestión de Tareas</h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {loading ? 'Cargando...' : `${filteredTasks.length} tareas pendientes`}
                        {hasFilters && tasks.length !== filteredTasks.length && ` (de ${tasks.length})`}
                    </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Create Task Button */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nueva Tarea</span>
                    </button>
                    {/* View Mode Toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 text-sm transition-all ${viewMode === 'list'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            title="Vista Lista"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-2 text-sm transition-all ${viewMode === 'kanban'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            title="Vista Kanban"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                        </button>
                    </div>

                    {/* My Tasks Toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-3 sm:px-4 py-2 text-[10px] sm:text-sm transition-all ${filterMode === 'all'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilterMode('mine')}
                            className={`px-3 sm:px-4 py-2 text-[10px] sm:text-sm transition-all ${filterMode === 'mine'
                                ? 'bg-[#8b5cf6] text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Mis Tareas
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar tareas..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6]"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Filter by priority */}
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[11px] sm:text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#8b5cf6]"
                    >
                        <option value="" className="bg-gray-900">Prioridad</option>
                        {TASK_PRIORITIES.map(p => (
                            <option key={p.id} value={p.id} className="bg-gray-900">
                                {p.label}
                            </option>
                        ))}
                    </select>

                    {/* Filter by assignee */}
                    <select
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[11px] sm:text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#8b5cf6]"
                    >
                        <option value="" className="bg-gray-900">Miembro</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id} className="bg-gray-900">
                                {m.full_name || m.email}
                            </option>
                        ))}
                    </select>

                    {/* Show Completed Toggle */}
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={`px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-lg border transition-all ${showCompleted
                            ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                            }`}
                    >
                        {showCompleted ? 'Ocultar' : 'Completadas'}
                    </button>
                </div>

                {/* Clear filters */}
                {hasFilters && (
                    <button
                        onClick={() => {
                            setSearchQuery('')
                            setFilterAssignee('')
                            setFilterPriority('')
                            setFilterMode('all')
                        }}
                        className="px-3 py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors text-center"
                    >
                        Limpiar
                    </button>
                )}
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
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#8b5cf6]/10 rounded-full flex items-center justify-center">
                        {hasFilters ? (
                            <svg className="w-8 h-8 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {hasFilters ? 'Sin resultados' : '¡Todo al día!'}
                    </h3>
                    <p className="text-gray-400">
                        {hasFilters ? 'Prueba con otros filtros' : 'No hay tareas pendientes'}
                    </p>
                </div>
            ) : viewMode === 'kanban' ? (
                <KanbanBoard
                    tasks={filteredTasks}
                    onOpenTask={setSelectedTask}
                    onStatusChange={handleStatusChange}
                    showCompleted={showCompleted}
                />
            ) : (
                <TasksListView
                    tasks={filteredTasks}
                    onOpenTask={setSelectedTask}
                    onStatusChange={handleStatusChange}
                    showCompleted={showCompleted}
                />
            )}

            {/* Task Modal */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdateStatus={(status) => handleStatusChange(selectedTask.id, status)}
                    onAssign={handleAssign}
                    onUnassign={handleUnassign}
                    onUpdateDetails={handleUpdateDetails}
                    onDelete={async () => {
                        await deleteTask(selectedTask.id)
                        setSelectedTask(null)
                    }}
                />
            )}

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateTask={handleCreateTask}
            />
        </div>
    )
}
