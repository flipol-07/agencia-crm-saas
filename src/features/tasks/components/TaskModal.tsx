'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTaskComments } from '../hooks'
import { TaskStatusSelector } from './TaskStatusSelector'
import { TaskAssigneeSelector } from './TaskAssigneeSelector'
import { TaskPrioritySelector } from './TaskPrioritySelector'
import { TaskDateSelector } from './TaskDateSelector'
import { TASK_PRIORITIES } from '@/types/database'
import type { TaskWithDetails, TaskStatus, TaskPriority } from '@/types/database'

interface TaskModalProps {
    task: TaskWithDetails
    isOpen: boolean
    onClose: () => void
    onUpdateStatus: (status: TaskStatus) => Promise<void>
    onAssign: (userId: string) => Promise<void>
    onUnassign: (userId: string) => Promise<void>
    onUpdateDetails?: (updates: {
        title?: string
        description?: string | null
        priority?: TaskPriority
        due_date?: string | null
    }) => Promise<void>
    onDelete?: () => Promise<void>
}

export function TaskModal({
    task,
    isOpen,
    onClose,
    onUpdateStatus,
    onAssign,
    onUnassign,
    onUpdateDetails,
    onDelete
}: TaskModalProps) {
    const { user } = useAuth()
    const { comments, loading: commentsLoading, addComment, deleteComment } = useTaskComments(task.id)
    const [newComment, setNewComment] = useState('')
    const [saving, setSaving] = useState(false)

    // Editable fields
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isEditingDesc, setIsEditingDesc] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [editDesc, setEditDesc] = useState(task.description || '')

    // Reset edit state when task changes
    useEffect(() => {
        setEditTitle(task.title)
        setEditDesc(task.description || '')
        setIsEditingTitle(false)
        setIsEditingDesc(false)
    }, [task.id, task.title, task.description])

    if (!isOpen) return null

    const handleStatusChange = async (status: TaskStatus) => {
        setSaving(true)
        try {
            await onUpdateStatus(status)
        } finally {
            setSaving(false)
        }
    }

    const handlePriorityChange = async (priority: TaskPriority) => {
        if (!onUpdateDetails) return
        setSaving(true)
        try {
            await onUpdateDetails({ priority })
        } finally {
            setSaving(false)
        }
    }

    const handleDateChange = async (date: string | null) => {
        if (!onUpdateDetails) return
        setSaving(true)
        try {
            await onUpdateDetails({ due_date: date })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveTitle = async () => {
        if (!onUpdateDetails || editTitle.trim() === task.title) {
            setIsEditingTitle(false)
            return
        }
        setSaving(true)
        try {
            await onUpdateDetails({ title: editTitle.trim() })
            setIsEditingTitle(false)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveDesc = async () => {
        if (!onUpdateDetails) {
            setIsEditingDesc(false)
            return
        }
        setSaving(true)
        try {
            await onUpdateDetails({ description: editDesc.trim() || null })
            setIsEditingDesc(false)
        } finally {
            setSaving(false)
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !user) return
        try {
            await addComment(newComment.trim(), user.id)
            setNewComment('')
        } catch (error) {
            console.error('Error adding comment:', error)
        }
    }

    const isOverdue = task.due_date && new Date(task.due_date) < new Date()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            {isEditingTitle ? (
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle()
                                        if (e.key === 'Escape') {
                                            setEditTitle(task.title)
                                            setIsEditingTitle(false)
                                        }
                                    }}
                                    autoFocus
                                    className="w-full text-xl font-bold text-white bg-white/5 border border-lime-400 rounded-lg px-3 py-1 focus:outline-none"
                                />
                            ) : (
                                <h2
                                    className="text-xl font-bold text-white mb-2 cursor-pointer hover:text-lime-400 transition-colors"
                                    onClick={() => onUpdateDetails && setIsEditingTitle(true)}
                                    title={onUpdateDetails ? "Click para editar" : undefined}
                                >
                                    {task.title}
                                </h2>
                            )}
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <span>📋 {task.projects?.name}</span>
                                <span className="text-gray-600">•</span>
                                <span>🏢 {task.projects?.contacts?.company_name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onDelete && (
                                <button
                                    onClick={() => {
                                        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                                            onDelete()
                                        }
                                    }}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Eliminar tarea"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status & Priority Row */}
                    <div className="flex items-center gap-6 flex-wrap">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Estado</label>
                            <TaskStatusSelector
                                status={task.status}
                                onChange={handleStatusChange}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Prioridad</label>
                            {onUpdateDetails ? (
                                <TaskPrioritySelector
                                    priority={task.priority}
                                    onChange={handlePriorityChange}
                                    disabled={saving}
                                />
                            ) : (
                                <span className={`text-sm font-medium text-${TASK_PRIORITIES.find(p => p.id === task.priority)?.color}-400`}>
                                    {TASK_PRIORITIES.find(p => p.id === task.priority)?.label}
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Fecha límite</label>
                            {onUpdateDetails ? (
                                <TaskDateSelector
                                    value={task.due_date}
                                    onChange={handleDateChange}
                                    disabled={saving}
                                />
                            ) : task.due_date ? (
                                <span className={`text-sm ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
                                    📅 {new Date(task.due_date).toLocaleDateString('es-ES')}
                                    {isOverdue && ' (Vencida)'}
                                </span>
                            ) : (
                                <span className="text-sm text-gray-500">Sin fecha</span>
                            )}
                        </div>
                    </div>

                    {/* Assignees */}
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Asignados</label>
                        <TaskAssigneeSelector
                            assignees={task.task_assignees}
                            onAssign={onAssign}
                            onUnassign={onUnassign}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Descripción</label>
                        {isEditingDesc ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white/5 border border-lime-400 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                                    placeholder="Añade una descripción..."
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveDesc}
                                        className="px-3 py-1 bg-lime-500 hover:bg-lime-400 text-black font-medium rounded text-sm"
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditDesc(task.description || '')
                                            setIsEditingDesc(false)
                                        }}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => onUpdateDetails && setIsEditingDesc(true)}
                                className={`text-gray-300 text-sm whitespace-pre-wrap min-h-[60px] p-3 rounded-lg ${onUpdateDetails ? 'cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/10' : ''
                                    }`}
                            >
                                {task.description || (
                                    <span className="text-gray-500 italic">
                                        {onUpdateDetails ? 'Click para añadir descripción...' : 'Sin descripción'}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-3">
                            Comentarios ({comments.length})
                        </label>

                        <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                            {commentsLoading ? (
                                <p className="text-gray-500 text-sm">Cargando comentarios...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-gray-500 text-sm">Sin comentarios todavía</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm text-white">
                                                {comment.profiles?.full_name || 'Usuario'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            {user && comment.user_id === user.id && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (confirm('¿Eliminar comentario?')) {
                                                            try {
                                                                await deleteComment(comment.id);
                                                            } catch (error) {
                                                                console.error("Error deleting comment:", error);
                                                            }
                                                        }
                                                    }}
                                                    className="ml-auto p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                                                    title="Eliminar comentario"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-sm">{comment.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add comment */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Añadir un comentario..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="px-4 py-2 bg-lime-500 hover:bg-lime-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-medium rounded-lg text-sm transition-colors"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
