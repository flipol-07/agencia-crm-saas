
import { createClient } from '@/lib/supabase/client'
import { TeamChatWithMembers, TeamMessage, Profile } from '@/types/database'

export const teamChatService = {
    async getChats(): Promise<TeamChatWithMembers[]> {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error } = await supabase
            .from('team_chats')
            .select(`
                *,
                participants:team_chat_participants(
                    profiles(id, full_name, email, avatar_url)
                )
            `)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Error fetching chats:', error)
            return []
        }

        // Filter out chats where the current user is a participant (RLS handles this but filtering in Select confirms structure)
        // And also, for 1:1 chats, the "participants" array contains both. 
        // We probably want to map it to a cleaner structure in the component, but let's return raw for now.
        return data as unknown as TeamChatWithMembers[]
    },

    async searchUsers(query: string): Promise<Profile[]> {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        // Search profiles excluding self
        let q = supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .limit(10)

        if (query) {
            q = q.ilike('full_name', `%${query}%`)
        }

        const { data, error } = await q

        if (error) {
            console.error('Error searching users:', error)
            return []
        }
        return data
    },

    async createOrGetChat(targetUserId: string): Promise<string> {
        const supabase = createClient()

        const { data, error } = await supabase.rpc('create_conversation', {
            target_user_id: targetUserId
        })

        if (error) {
            console.error('Error creating chat:', error)
            throw error
        }

        return data
    },

    async getChat(chatId: string): Promise<TeamChatWithMembers | null> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('team_chats')
            .select(`
                *,
                participants:team_chat_participants(
                    profiles(id, full_name, email, avatar_url)
                )
            `)
            .eq('id', chatId)
            .single()

        if (error) {
            console.error('Error fetching chat:', error)
            return null
        }

        return data as unknown as TeamChatWithMembers
    },

    async getMessages(chatId: string): Promise<TeamMessage[]> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('team_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching messages:', error)
            return []
        }

        return data
    },

    async sendMessage(chatId: string, content: string): Promise<TeamMessage | null> {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        // 1. Insert message
        const { data, error } = await supabase
            .from('team_messages')
            .insert({
                chat_id: chatId,
                sender_id: user.id,
                content
            })
            .select()
            .single()

        if (error) {
            console.error('Error sending message:', error)
            return null
        }

        // 2. Update chat timestamp and preview
        await supabase
            .from('team_chats')
            .update({
                updated_at: new Date().toISOString(),
                last_message_preview: content,
            })
            .eq('id', chatId)

        return data
    }
}
