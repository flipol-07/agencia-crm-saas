import { ContactDetailPageClient } from '@/features/contacts/components/ContactDetailPageClient'
import { getContactByIdCached } from '@/features/contacts/services/contact.service.server'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function ContactDetailPage({ params }: PageProps) {


    return (
        <Suspense fallback={<ContactDetailSkeleton />}>
            <ContactDetailContent params={params} />
        </Suspense>
    )
}

async function ContactDetailContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const contact = await getContactByIdCached(id, user.id)

    if (!contact) {
        notFound()
    }

    return <ContactDetailPageClient id={id} initialContact={contact} />
}

function ContactDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-xl p-6 animate-pulse">
                        <div className="h-6 bg-white/10 rounded w-24 mb-4" />
                        <div className="space-y-3">
                            <div className="h-4 bg-white/10 rounded w-full" />
                            <div className="h-4 bg-white/10 rounded w-5/6" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

