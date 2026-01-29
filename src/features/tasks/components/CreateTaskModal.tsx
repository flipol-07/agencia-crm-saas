'use client'

import { useState } from 'react'
import { useProjects } from '@/features/projects/hooks'
import { TASK_PRIORITIES } from '@/types/database'
import type { TaskPriority } from '@/types/database'

interface CreateTaskModalProps {
    isOpen: boolean
    onClose: () => void
    onCreateTask: (task: {
        title: string
        project_id: string
        description?: string
        priority: TaskPriority
        due_date?: string | null
    }) => Promise<void>
}

export function CreateTaskModal({ isOpen, onClose, onCreateTask }: CreateTaskModalProps) {
    const { projects, loading: loadingProjects } = useProjects()

    const [title, setTitle] = useState('')
    const [projectId, setProjectId] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<TaskPriority>('medium')
    const [dueDate, setDueDate] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim()) {
            setError('El título es obligatorio')
            return
        }
        if (!projectId) {
            setError('Selecciona un proyecto')
            return
        }

        setSaving(true)
        try {
            await onCreateTask({
                title: title.trim(),
                project_id: projectId,
                description: description.trim() || undefined,
                priority,
                due_date: dueDate || null,
            })
            // Reset form
            setTitle('')
            setProjectId('')
            setDescription('')
            setPriority('medium')
            setDueDate('')
            onClose()
        } catch (err) {
            setError('Error al crear la tarea')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const priorityColors: Record<TaskPriority, string> = {
        low: 'bg-gray-500/20 text-gray-400 border-gray-500',
        medium: 'bg-blue-500/20 text-blue-400 border-blue-500',
        high: 'bg-amber-500/20 text-amber-400 border-amber-500',
        urgent: 'bg-red-500/20 text-red-400 border-red-500',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Nueva Tarea</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Título */}
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="¿Qué hay que hacer?"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                            autoFocus
                        />
                    </div>

                    {/* Proyecto */}
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Proyecto *
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400"
                            disabled={loadingProjects}
                        >
                            <option value="" className="bg-gray-900">Seleccionar proyecto...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id} className="bg-gray-900">
                                    {p.contacts?.company_name} → {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Prioridad y Fecha */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                                Prioridad
                            </label>
                            <div className="flex gap-2">
                                {TASK_PRIORITIES.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPriority(p.id as TaskPriority)}
                                        className={`flex-1 px-2 py-2 text-xs rounded-lg border transition-all ${priority === p.id
                                                ? priorityColors[p.id as TaskPriority]
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                                            }`}
                                    >
                                        {p.label.charAt(0)}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {TASK_PRIORITIES.find(p => p.id === priority)?.label}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                                Fecha límite
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lime-400 text-sm"
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles adicionales..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !title.trim() || !projectId}
                            className="flex-1 px-4 py-3 bg-lime-500 hover:bg-lime-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg transition-colors"
                        >
                            {saving ? 'Creando...' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
