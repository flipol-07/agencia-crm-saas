'use server'

import { createClient } from '@/lib/supabase/server'
import type { Contact } from '@/types/database'
import { revalidateTag } from 'next/cache'

export async function createContactAction(contact: any): Promise<{ data: Contact | null; error: string | null }> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contacts') as any)
        .insert(contact)
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            const field = error.message.includes('phone') ? 'teléfono' : 'email'
            return { data: null, error: `Ya existe un contacto con este ${field}` }
        }
        return { data: null, error: error.message }
    }

    revalidateTag('contacts')
    return { data: data as Contact, error: null }
}

export async function updateContactAction(id: string, contact: any): Promise<{ data: Contact | null; error: string | null }> {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contacts') as any)
        .update(contact)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            const field = error.message.includes('phone') ? 'teléfono' : 'email'
            return { data: null, error: `Ya existe un contacto con este ${field}` }
        }
        return { data: null, error: error.message }
    }

    revalidateTag('contacts')
    return { data: data as Contact, error: null }
}

export async function deleteContactAction(id: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient()
    const { error } = await (supabase.from('contacts') as any)
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidateTag('contacts')
    return { success: true, error: null }
}
