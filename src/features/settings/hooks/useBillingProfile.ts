
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'

export function useBillingProfile() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const supabase = createClient()

    const fetchProfile = useCallback(async () => {
        if (!user) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error('Error fetching billing profile:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const saveBillingProfile = async (updates: Partial<Profile>) => {
        if (!user) return

        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single()

            if (error) throw error
            setProfile(data)
            return data
        } catch (error) {
            console.error('Error saving billing profile:', error)
            throw error
        } finally {
            setSaving(false)
        }
    }

    return {
        profile,
        loading,
        saving,
        saveBillingProfile,
        refetch: fetchProfile
    }
}
