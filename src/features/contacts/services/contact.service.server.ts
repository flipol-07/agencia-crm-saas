'use cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { cacheLife } from 'next/cache'
import type { Contact } from '@/types/database'

export async function getContactsCached(userId: string): Promise<Contact[]> {
    cacheLife('minutes')
    const supabase = createAdminClient()

    const { data, error } = await (supabase.from('contacts') as any)
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[Contact Service] Error fetching contacts:', error)
        return []
    }

    return data || []
}

export async function getContactByIdCached(id: string): Promise<Contact | null> {
    cacheLife('minutes')
    const supabase = createAdminClient()

    const { data, error } = await (supabase.from('contacts') as any)
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error(`[Contact Service] Error fetching contact ${id}:`, error)
        return null
    }

    return data
}
