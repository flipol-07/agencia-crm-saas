'use cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { cacheLife } from 'next/cache'
import type { Contact } from '@/types/database'

export interface ContactsListFilters {
    page?: number
    pageSize?: number
    search?: string
    pipelineStage?: string
    source?: string
    status?: string
}

export interface ContactsListResult {
    data: Contact[]
    count: number
    page: number
    pageSize: number
    totalPages: number
}

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

/**
 * Lista paginada de contactos con búsqueda full-text y filtros.
 * Mantiene compatibilidad con la firma anterior: si se llama sin filters
 * devuelve un Contact[] directamente.
 */
export async function getContactsCached(
    userId: string,
    filters?: ContactsListFilters
): Promise<Contact[] | ContactsListResult> {
    cacheLife('minutes')
    const supabase = createAdminClient()

    const page = Math.max(1, filters?.page ?? 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filters?.pageSize ?? DEFAULT_PAGE_SIZE))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = (supabase.from('contacts') as any)
        .select('*', { count: 'exact' })
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)

    const search = filters?.search?.trim()
    if (search) {
        const safe = search.replace(/[%,()]/g, '').slice(0, 80)
        query = query.or(
            [
                `company_name.ilike.%${safe}%`,
                `contact_name.ilike.%${safe}%`,
                `email.ilike.%${safe}%`,
            ].join(',')
        )
    }

    if (filters?.pipelineStage) query = query.eq('pipeline_stage', filters.pipelineStage)
    if (filters?.source) query = query.eq('source', filters.source)
    if (filters?.status) query = query.eq('status', filters.status)

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
        console.error('[Contact Service] Error fetching contacts:', error)
        if (!filters) return []
        return { data: [], count: 0, page, pageSize, totalPages: 0 }
    }

    const rows = (data || []) as Contact[]

    if (!filters) return rows

    const total = count ?? 0
    return {
        data: rows,
        count: total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
    }
}

export async function getContactByIdCached(id: string, userId?: string): Promise<Contact | null> {
    cacheLife('minutes')
    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = (supabase.from('contacts') as any).select('*').eq('id', id)

    if (userId) {
        query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    }

    const { data, error } = await query.single()

    if (error) {
        console.error(`[Contact Service] Error fetching contact ${id}:`, error)
        return null
    }

    return data as Contact
}
