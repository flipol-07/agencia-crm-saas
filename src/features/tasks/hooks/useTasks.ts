'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskInsert, TaskUpdate, TaskWithProject } from '@/types/database'

// Hook para tareas de un proyecto específico
export function useProjectTasks(projectId: string) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('is_completed', { ascending: true })
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
        if (projectId) {
            fetchTasks()
        }
    }, [projectId, fetchTasks])

    const createTask = async (task: Partial<TaskInsert>) => {
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                title: task.title || 'Nueva tarea',
                description: task.description,
                priority: task.priority || 'medium',
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

        // Si se marca como completado, añadir timestamp
        if (updates.is_completed === true) {
            updateData.completed_at = new Date().toISOString()
        } else if (updates.is_completed === false) {
            updateData.completed_at = null
        }

        const { data, error } = await supabase
            .from('tasks')
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
        const { error } = await supabase
            .from('tasks')
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

// Hook para todas las tareas del usuario (vista operativa)
export function useMyTasks(userId?: string) {
    const [tasks, setTasks] = useState<TaskWithProject[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        let query = supabase
            .from('tasks')
            .select(`
        *,
        projects (
          id, 
          name, 
          contact_id,
          contacts (id, company_name)
        )
      `)
            .eq('is_completed', false)
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
        const { error } = await supabase
            .from('tasks')
            .update({
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

// Hook para todas las tareas (sin filtro)
export function useAllTasks() {
    const [tasks, setTasks] = useState<TaskWithProject[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        projects (
          id, 
          name, 
          contact_id,
          contacts (id, company_name)
        )
      `)
            .eq('is_completed', false)
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
        const { error } = await supabase
            .from('tasks')
            .update({
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
