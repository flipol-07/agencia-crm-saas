import { createClient } from '@/lib/supabase/server'
import { ProfileCompletionModal } from '@/shared/components/features/ProfileCompletionModal'

export async function ProfileCompletionCheck() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('full_name')
        .eq('id', user.id)
        .single()

    if (profile && !profile.full_name) {
        return <ProfileCompletionModal userId={user.id} />
    }

    return null
}
