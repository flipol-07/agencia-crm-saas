import { createClient } from '@/lib/supabase/server'
import { MailDashboard } from '@/features/emails/components/MailDashboard'

export default async function MailPage() {
    const supabase = await createClient()

    // Fetch recent emails (global)
    // We limit to 200 to avoiding fetching too much initially
    const { data: emails } = await supabase
        .from('contact_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(200)

    return (
        <div className="h-[calc(100vh-73px-2rem)] lg:h-[calc(100vh-73px-3rem)] overflow-hidden">
            <MailDashboard initialEmails={emails || []} />
        </div>
    )
}
