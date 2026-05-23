import { createClient } from '@/lib/supabase/server'
import type { Contact } from '@/types/database'

export interface DuplicatePair {
    contactA: Contact
    contactB: Contact
    emailMatch: boolean
    phoneMatch: boolean
    nameSimilarity: number
    score: number
}

interface RpcRow {
    contact_a_id: string
    contact_b_id: string
    email_match: boolean
    phone_match: boolean
    name_similarity: number
    score: number
}

const DEFAULT_THRESHOLD = 0.8

export async function findDuplicates(userId: string, threshold = DEFAULT_THRESHOLD): Promise<DuplicatePair[]> {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('find_contact_duplicates', {
        p_user_id: userId,
        p_threshold: threshold,
    })

    if (rpcError) {
        console.error('[duplicates] RPC error', rpcError)
        return []
    }

    const rows = (rpcData || []) as RpcRow[]
    if (rows.length === 0) return []

    const ids = Array.from(new Set(rows.flatMap(r => [r.contact_a_id, r.contact_b_id])))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contactsData } = await (supabase.from('contacts') as any)
        .select('*')
        .in('id', ids)

    const contactsById = new Map<string, Contact>()
    ;((contactsData || []) as Contact[]).forEach(c => contactsById.set(c.id, c))

    return rows
        .map(r => {
            const a = contactsById.get(r.contact_a_id)
            const b = contactsById.get(r.contact_b_id)
            if (!a || !b) return null
            return {
                contactA: a,
                contactB: b,
                emailMatch: r.email_match,
                phoneMatch: r.phone_match,
                nameSimilarity: r.name_similarity,
                score: r.score,
            }
        })
        .filter((p): p is DuplicatePair => p !== null)
}
