'use server'

import { createClient } from '@/lib/supabase/server'
import type { Contact } from '@/types/database'
import { revalidateTag } from 'next/cache'

export async function createContactAction(contact: any): Promise<Contact> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contacts') as any)
        .insert(contact)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data as Contact
}

export async function updateContactAction(id: string, contact: any): Promise<Contact> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contacts') as any)
        .update(contact)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data as Contact
}

export async function deleteContactAction(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await (supabase.from('contacts') as any)
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
}
