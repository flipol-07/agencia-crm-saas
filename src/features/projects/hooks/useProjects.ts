'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectInsert, ProjectUpdate, ProjectWithContact } from '@/types/database'

// Hook para proyectos de un cliente específico
export function useContactProjects(contactId: string) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchProjects = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {
            setProjects(data || [])
        }
        setLoading(false)
    }, [supabase, contactId])

    useEffect(() => {
        if (contactId) {
            fetchProjects()
        }
    }, [contactId, fetchProjects])

    const createProject = async (project: Partial<ProjectInsert>) => {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                contact_id: contactId,
                name: project.name || 'Nuevo Proyecto',
                description: project.description,
                status: project.status || 'pending',
                budget: project.budget,
                deadline: project.deadline,
            })
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setProjects(prev => [data, ...prev])
        return data
    }

    const updateProject = async (id: string, updates: ProjectUpdate) => {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setProjects(prev => prev.map(p => p.id === id ? data : p))
        return data
    }

    return {
        projects,
        loading,
        error,
        refetch: fetchProjects,
        createProject,
        updateProject,
    }
}

// Hook para todos los proyectos (con datos de cliente)
export function useProjects() {
    const [projects, setProjects] = useState<ProjectWithContact[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchProjects = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('projects')
            .select(`
        *,
        contacts (id, company_name, contact_name)
      `)
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {
            setProjects(data || [])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    return {
        projects,
        loading,
        error,
        refetch: fetchProjects,
    }
}
