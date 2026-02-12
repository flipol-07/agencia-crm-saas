
import { createClient } from '@/lib/supabase/client'
import { TeamChatWithMembers, TeamMessage, Profile } from '@/types/database'

export const teamChatService = {
    async getChats(): Promise<(TeamChatWithMembers & { unread_count: number })[]> {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error } = await supabase
            .from('team_chats')
            .select(`
                *,
                participants:team_chat_participants(
                    last_read_at,
                    profiles(id, full_name, email, avatar_url)
                ),
                messages:team_messages(
                    id,
                    created_at,
                    sender_id
                )
            `)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Error fetching chats:', error)
            return []
        }

        // Process data to calculate unread count
        const chatsWithUnread = data.map((chat: any) => {
            const myParticipant = chat.participants?.find((p: any) => p.profiles?.id === user.id)
            const lastReadAt = myParticipant?.last_read_at ? new Date(myParticipant.last_read_at) : new Date(0)

            const unreadCount = chat.messages
                ? chat.messages.filter((m: any) =>
                    m.sender_id !== user.id &&
                    new Date(m.created_at) > lastReadAt
                ).length
                : 0

            // Remove messages from the object to return clean TeamChatWithMembers + unread_count
            // (Optional, but keeps object small)
            const { messages, ...rest } = chat
            return {
                ...rest,
                unread_count: unreadCount,
                participants: rest.participants || []
            }
        })

        return chatsWithUnread as (TeamChatWithMembers & { unread_count: number })[]
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

    async createGroupChat(name: string, participantIds: string[]): Promise<string> {
        const supabase = createClient()

        // Ensure current user is in participants list (though RPC adds it, good to be explicit/safe or let RPC handle)
        // RPC 'create_group_chat' handles adding the admin (current user)

        const { data, error } = await supabase.rpc('create_group_chat', {
            group_name: name,
            participant_ids: participantIds
        })

        if (error) {
            console.error('Error creating group chat:', error)
            throw error
        }

        return data
    },

    async markChatAsRead(chatId: string) {
        const supabase = createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('UserId check failed:', authError)
            return
        }

        console.log('Marking chat as read:', { chatId, userId: user.id })

        const { data, error } = await supabase.rpc('mark_messages_read', {
            p_chat_id: chatId
        })

        if (error) {
            console.error('Error marking chat as read (RPC) RAW:', error)
            // JSON.stringify with replacer to handle Error objects
            const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error))
            console.error('Error marking chat as read (RPC) STRINGIFIED:', errorString)

            console.error('RPC Error details:', {
                // Try accessing properties directly again just in case
                message: (error as any)?.message,
                code: (error as any)?.code,
                details: (error as any)?.details,
                hint: (error as any)?.hint,
                chatId,
                userId: user.id
            })
        } else {
            console.log('Marked chat as read (RPC) result:', { chatId, success: data })
        }
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
    },
    async updateChat(chatId: string, updates: { name?: string, avatar_url?: string }): Promise<void> {
        const supabase = createClient()
        const { error } = await supabase
            .from('team_chats')
            .update(updates)
            .eq('id', chatId)

        if (error) {
            console.error('Error updating chat:', error)
            throw error
        }
    },

    async uploadGroupAvatar(chatId: string, file: File): Promise<string> {
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `chat-avatars/${chatId}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file)

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError)
            throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName)

        return publicUrl
    },

    async deleteChat(chatId: string): Promise<void> {
        const supabase = createClient()
        const { error } = await supabase
            .from('team_chats')
            .delete()
            .eq('id', chatId)

        if (error) {
            console.error('Error deleting chat:', error)
            throw error
        }
    }
}
