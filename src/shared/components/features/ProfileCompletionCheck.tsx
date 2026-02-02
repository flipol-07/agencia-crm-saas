import { createClient } from '@/lib/supabase/server'
import { ProfileCompletionModal } from '@/shared/components/features/ProfileCompletionModal'

export async function ProfileCompletionCheck() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) return null

    const user = data.user

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('full_name')
        .eq('id', user.id)
        .single()

    if (profile && !profile.full_name) {
        return <ProfileCompletionModal userId={user.id} />
    }

    return null
}
