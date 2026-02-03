'use cache'
import { createAdminClient } from '@/lib/supabase/server'
import { cacheLife } from 'next/cache'
import type { ContactFile } from '@/types/database'

export async function getContactFilesCached(contactId: string): Promise<ContactFile[]> {
    cacheLife('minutes')
    const supabase = await createAdminClient()
    const { data, error } = await (supabase.from('contact_files') as any)
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[File Service] Error fetching files:', error)
        return []
    }
    return data || []
}
