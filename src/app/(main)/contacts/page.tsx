import { ContactList, ContactFormWrapper } from '@/features/contacts/components'
import { getContactsCached } from '@/features/contacts/services/contact.service.server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/shared/components/ui/Skeleton'

export default async function ContactsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userId = user.id

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-wider">Contactos</h1>
                    <p className="text-gray-400 mt-1">Gestión de base de datos de clientes</p>
                </div>
                <ContactFormWrapper />
            </div>

            {/* Lista de contactos (Suspended) */}
            <Suspense fallback={<ContactListSkeleton />}>
                <ContactsListSection userId={userId} />
            </Suspense>
        </div>
    )
}

async function ContactsListSection({ userId }: { userId: string }) {
    const contacts = await getContactsCached(userId)
    return <ContactList contacts={contacts} />
}

function ContactListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 glass rounded-xl p-5 animate-pulse">
                    <div className="h-6 bg-white/10 rounded mb-3 w-3/4" />
                    <div className="h-4 bg-white/10 rounded mb-2 w-1/2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                </div>
            ))}
        </div>
    )
}
