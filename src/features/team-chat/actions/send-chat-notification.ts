'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { WhatsAppService } from '@/shared/lib/whatsapp'

export async function sendChatNotification(senderId: string, content: string, chatId: string) {
    try {
        const supabase = await createAdminClient()

        // Fetch sender details
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('full_name')
            .eq('id', senderId)
            .single()

        const senderName = profile?.full_name || 'Alguien del equipo'

        // Send WhatsApp notification
        await WhatsAppService.notifyNewTeamMessage(senderName, content, chatId)

        return { success: true }
    } catch (error) {
        console.error('Error sending chat notification:', error)
        return { success: false, error: 'Failed to send notification' }
    }
}
