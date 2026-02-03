'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markChatAsRead(chatId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    try {
        const { error } = await (supabase.from('team_chat_participants') as any)
            .update({ last_read_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .eq('user_id', user.id)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('Error marking chat as read:', error)
        return { success: false, error }
    }
}
