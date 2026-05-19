'use cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { cacheLife } from 'next/cache'
import type { Contact } from '@/types/database'
import { isDemoEmail } from '@/shared/lib/demo'

export async function getContactsCached(userId: string): Promise<Contact[]> {
    cacheLife('minutes')
    const supabase = createAdminClient()

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('email')
        .eq('id', userId)
        .maybeSingle()

    let query = (supabase.from('contacts') as any)
        .select('*')
        .order('created_at', { ascending: false })

    if (isDemoEmail(profile?.email)) {
        query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    }

    const { data, error } = await query

    if (error) {
        console.error('[Contact Service] Error fetching contacts:', error)
        return []
    }

    return data || []
}

export async function getContactByIdCached(id: string, userId?: string): Promise<Contact | null> {
    cacheLife('minutes')
    const supabase = createAdminClient()

    let query = (supabase.from('contacts') as any)
        .select('*')
        .eq('id', id)

    if (userId) {
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('email')
            .eq('id', userId)
            .maybeSingle()

        if (isDemoEmail(profile?.email)) {
            query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        }
    }

    const { data, error } = await query.single()

    if (error) {
        console.error(`[Contact Service] Error fetching contact ${id}:`, error)
        return null
    }

    return data
}
