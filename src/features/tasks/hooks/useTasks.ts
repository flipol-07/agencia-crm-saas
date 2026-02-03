'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
    Task,
    TaskInsert,
    TaskUpdate,
    TaskWithProject,
    TaskWithDetails,
    TaskStatus,
    TaskPriority,
    TaskComment,
} from '@/types/database'

// Hook para tareas de un proyecto específico
export function useProjectTasks(projectId: string) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await (supabase.from('tasks') as any)
            .select('*')
            .eq('project_id', projectId)
            .order('status', { ascending: true })
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }, [supabase, projectId])

    useEffect(() => {
        // Solo intentar buscar si tenemos un projectId y parece un UUID válido
        // (evita el error 400 al pasar 'general' desde el panel de contactos)
        if (projectId && projectId.length === 36) {
            fetchTasks()
        } else {
            setTasks([])
            setLoading(false)
        }
    }, [projectId, fetchTasks])

    const createTask = async (task: Partial<TaskInsert>) => {
        const { data, error } = await (supabase.from('tasks') as any)
            .insert({
                project_id: projectId,
                title: task.title || 'Nueva tarea',
                description: task.description,
                priority: task.priority || 'medium',
                status: task.status || 'todo',
                assigned_to: task.assigned_to,
                due_date: task.due_date,
            })
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => [data, ...prev])
        return data
    }

    const updateTask = async (id: string, updates: TaskUpdate) => {
        const updateData = { ...updates }

        // Si el status cambia a 'done', marcar como completado
        if (updates.status === 'done') {
            updateData.is_completed = true
            updateData.completed_at = new Date().toISOString()
        } else if (updates.status) {
            updateData.is_completed = false
            updateData.completed_at = null
        }

        const { data, error } = await (supabase.from('tasks') as any)
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.map(t => t.id === id ? data : t))
        return data
    }

    const deleteTask = async (id: string) => {
        const { error } = await (supabase.from('tasks') as any)
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.filter(t => t.id !== id))
    }

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        createTask,
        updateTask,
        deleteTask,
    }
}

// Hook para tareas de un contacto específico
export function useContactTasks(contactId: string) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await (supabase.from('tasks') as any)
            .select('*')
            .eq('contact_id', contactId)
            .order('status', { ascending: true })
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }, [supabase, contactId])

    useEffect(() => {
        if (contactId) {
            fetchTasks()
        }
    }, [contactId, fetchTasks])

    const createTask = async (task: Partial<TaskInsert>) => {
        const { data, error } = await (supabase.from('tasks') as any)
            .insert({
                contact_id: contactId,
                project_id: task.project_id || null, // Permitir vincular a proyecto si se provee
                title: task.title || 'Nueva tarea',
                description: task.description,
                priority: task.priority || 'medium',
                status: task.status || 'todo',
                assigned_to: task.assigned_to,
                due_date: task.due_date,
            })
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => [data, ...prev])
        return data
    }

    const updateTask = async (id: string, updates: TaskUpdate) => {
        const updateData = { ...updates }

        if (updates.status === 'done') {
            updateData.is_completed = true
            updateData.completed_at = new Date().toISOString()
        } else if (updates.status) {
            updateData.is_completed = false
            updateData.completed_at = null
        }

        const { data, error } = await (supabase.from('tasks') as any)
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.map(t => t.id === id ? data : t))
        return data
    }

    const deleteTask = async (id: string) => {
        const { error } = await (supabase.from('tasks') as any)
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.filter(t => t.id !== id))
    }

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        createTask,
        updateTask,
        deleteTask,
    }
}

// Hook para todas las tareas con detalles completos (nueva versión)
export function useTasksWithDetails() {
    const [tasks, setTasks] = useState<TaskWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await (supabase.from('tasks') as any)
            .select(`
                *,
                projects (
                    id, 
                    name, 
                    contact_id,
                    contacts (id, company_name)
                ),
                contacts (id, company_name),
                task_assignees (
                    id,
                    user_id,
                    created_at,
                    profiles (id, full_name, email, avatar_url)
                ),
                task_comments (id)
            `)
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true, nullsFirst: false })

        if (error) {
            setError(error.message)
        } else {
            setTasks(data as TaskWithDetails[] || [])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const updateTaskStatus = async (id: string, status: TaskStatus) => {
        const updateData: TaskUpdate = { status }

        if (status === 'done') {
            updateData.is_completed = true
            updateData.completed_at = new Date().toISOString()
        } else {
            updateData.is_completed = false
            updateData.completed_at = null
        }

        const { error } = await (supabase.from('tasks') as any)
            .update(updateData)
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    }

    const assignUser = async (taskId: string, userId: string) => {
        const { data, error } = await (supabase.from('task_assignees') as any)
            .insert({ task_id: taskId, user_id: userId })
            .select(`
                id,
                user_id,
                created_at,
                profiles (id, full_name, email, avatar_url)
            `)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    task_assignees: [...t.task_assignees, data as any]
                }
            }
            return t
        }))
    }

    const unassignUser = async (taskId: string, userId: string) => {
        const { error } = await (supabase.from('task_assignees') as any)
            .delete()
            .eq('task_id', taskId)
            .eq('user_id', userId)

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    task_assignees: t.task_assignees.filter(a => a.user_id !== userId)
                }
            }
            return t
        }))
    }

    // Crear tarea (con opciones)
    const createQuickTask = async (title: string, projectId: string, options?: {
        description?: string
        priority?: TaskPriority
        due_date?: string | null
        contact_id?: string | null
    }) => {
        const { data, error } = await (supabase.from('tasks') as any)
            .insert({
                title,
                project_id: projectId || null,
                contact_id: options?.contact_id || null,
                description: options?.description || null,
                priority: options?.priority || 'medium',
                due_date: options?.due_date || null,
                status: 'todo',
                is_completed: false
            })
            .select(`
                *,
                projects (
                    id, 
                    name, 
                    contact_id,
                    contacts (id, company_name)
                ),
                contacts (id, company_name),
                task_assignees (
                    id,
                    user_id,
                    created_at,
                    profiles (id, full_name, email, avatar_url)
                ),
                task_comments (id)
            `)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => [data as TaskWithDetails, ...prev])
        return data as TaskWithDetails
    }

    // Actualizar detalles de la tarea
    const updateTaskDetails = async (id: string, updates: {
        title?: string
        description?: string | null
        priority?: TaskPriority
        due_date?: string | null
    }) => {
        const { error } = await (supabase.from('tasks') as any)
            .update(updates)
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }

        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    }

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        updateTaskStatus,
        assignUser,
        unassignUser,
        createQuickTask,
        updateTaskDetails,
        deleteTask: async (id: string) => {
            const { error } = await (supabase.from('tasks') as any)
                .delete()
                .eq('id', id)

            if (error) {
                throw new Error(error.message)
            }

            setTasks(prev => prev.filter(t => t.id !== id))
        }
    }
}

// Hook para todas las tareas del usuario (vista operativa) - Legacy compatible
export function useMyTasks(userId?: string) {
    const [tasks, setTasks] = useState<TaskWithProject[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        let query = (supabase.from('tasks') as any)
            .select(`
        *,
        projects (
          id, 
          name, 
          contact_id,
          contacts (id, company_name)
        )
      `)
            .neq('status', 'done')
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true, nullsFirst: false })

        // Filtrar por usuario si se especifica
        if (userId) {
            query = query.eq('assigned_to', userId)
        }

        const { data, error } = await query

        if (error) {
            setError(error.message)
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }, [supabase, userId])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const toggleComplete = async (id: string, completed: boolean) => {
        const { error } = await (supabase.from('tasks') as any)
            .update({
                status: completed ? 'done' : 'todo',
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
            })
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }

        // Remover de la lista si se completa
        if (completed) {
            setTasks(prev => prev.filter(t => t.id !== id))
        }
    }

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        toggleComplete,
    }
}

// Hook para todas las tareas (sin filtro) - Legacy compatible
export function useAllTasks() {
    const [tasks, setTasks] = useState<TaskWithProject[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await (supabase.from('tasks') as any)
            .select(`
        *,
        projects (
          id, 
          name, 
          contact_id,
          contacts (id, company_name)
        )
      `)
            .neq('status', 'done')
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true, nullsFirst: false })

        if (error) {
            setError(error.message)
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const toggleComplete = async (id: string, completed: boolean) => {
        const { error } = await (supabase.from('tasks') as any)
            .update({
                status: completed ? 'done' : 'todo',
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
            })
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }

        if (completed) {
            setTasks(prev => prev.filter(t => t.id !== id))
        }
    }

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        toggleComplete,
    }
}

// Hook para comentarios de una tarea
export function useTaskComments(taskId: string) {
    const [comments, setComments] = useState<(TaskComment & { profiles: { full_name: string | null } })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchComments = useCallback(async () => {
        if (!taskId) return

        setLoading(true)
        setError(null)

        const { data, error } = await (supabase.from('task_comments') as any)
            .select(`
                *,
                profiles (full_name)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true })

        if (error) {
            setError(error.message)
        } else {
            setComments(data as any || [])
        }
        setLoading(false)
    }, [supabase, taskId])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    const addComment = async (content: string, userId: string) => {
        const { data, error } = await (supabase.from('task_comments') as any)
            .insert({
                task_id: taskId,
                user_id: userId,
                content
            })
            .select(`
                *,
                profiles (full_name)
            `)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setComments(prev => [...prev, data as any])
        return data
    }

    const deleteComment = async (commentId: string) => {
        const { error } = await (supabase.from('task_comments') as any)
            .delete()
            .eq('id', commentId)

        if (error) {
            throw new Error(error.message)
        }

        setComments(prev => prev.filter(c => c.id !== commentId))
    }

    return {
        comments,
        loading,
        error,
        refetch: fetchComments,
        addComment,
        deleteComment
    }
}

// Hook para miembros del equipo
export function useTeamMembers() {
    const [members, setMembers] = useState<{ id: string; full_name: string | null; email: string; avatar_url: string | null }[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchMembers() {
            const { data } = await (supabase.from('profiles') as any)
                .select('id, full_name, email, avatar_url')
                .order('full_name', { ascending: true })

            if (data) {
                setMembers(data)
            }
            setLoading(false)
        }
        fetchMembers()
    }, [supabase])

    return { members, loading }
}
