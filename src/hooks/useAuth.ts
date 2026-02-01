'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        async function getProfile(userId: string) {
            const { data } = await (supabase.from('profiles') as any)
                .select('*')
                .eq('id', userId)
                .single()

            setProfile(data)
        }

        // Get initial user
        const initAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                getProfile(user.id)
            }
            setLoading(false)
        }
        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: string, session: any) => {
                const currentUser = session?.user ?? null
                setUser(currentUser)
                if (currentUser) {
                    getProfile(currentUser.id)
                } else {
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    return { user, profile, loading }
}
