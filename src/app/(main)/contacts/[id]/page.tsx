import { ContactDetailPageClient } from '@/features/contacts/components/ContactDetailPageClient'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

    if (!contact) {
        notFound()
    }

    return <ContactDetailPageClient id={id} initialContact={contact} />
}
