import { createClient } from '@/lib/supabase/client'
import { Meeting } from '../types'

export const meetingService = {
    async getMeetings() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('meetings')
            .select(`
                *,
                contacts (
                    id,
                    company_name,
                    contact_name
                )
            `)
            .neq('status', 'scheduled')
            .order('date', { ascending: false })

        if (error) {
            console.error('Supabase error in getMeetings:', error)
            throw error
        }
        return (data || []) as Meeting[]
    },

    async getMeetingById(id: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('meetings')
            .select(`
                *,
                contacts (
                    id,
                    company_name,
                    contact_name
                )
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Meeting
    },

    async deleteMeeting(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('meetings')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async updateMeeting(id: string, updates: Partial<Meeting>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('meetings')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                contacts (
                    id,
                    company_name,
                    contact_name
                )
            `)
            .single()

        if (error) throw error
        return data as Meeting
    }
}
