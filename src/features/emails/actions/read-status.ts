'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markEmailAsRead(emailId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    try {
        const { error } = await (supabase.from('email_reads') as any)
            .insert({
                email_id: emailId,
                user_id: user.id
            })
            // Ignore if already exists (on conflict do nothing would be better but simple insert works with unique constraint -> error)
            // actually better to use upsert or onConflict ignore
            .select()

        if (error) {
            // Postgres unique violation code is 23505. If so, it's already read, so we can ignore.
            if (error.code === '23505') {
                return { success: true, alreadyRead: true }
            }
            throw error
        }

        return { success: true }
    } catch (error) {
        console.error('Error marking email as read:', error)
        return { success: false, error }
    }
}

export async function markEmailAsUnread(emailId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    try {
        const { error } = await (supabase.from('email_reads') as any)
            .delete()
            .match({
                email_id: emailId,
                user_id: user.id
            })

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('Error marking email as unread:', error)
        return { success: false, error }
    }
}
