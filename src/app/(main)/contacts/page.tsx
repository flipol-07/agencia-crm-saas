import { ContactList, ContactFormWrapper } from '@/features/contacts/components'
import { ContactsToolbar } from '@/features/contacts/components/ContactsToolbar'
import { ContactsPagination } from '@/features/contacts/components/ContactsPagination'
import { BulkActionsBar } from '@/features/contacts/components/BulkActionsBar'
import {
    getContactsCached,
    type ContactsListFilters,
    type ContactsListResult,
} from '@/features/contacts/services/contact.service.server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

interface ContactsPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

function pickString(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0]
    return value
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const params = await searchParams
    const filters: ContactsListFilters = {
        page: Number(pickString(params.page) || '1') || 1,
        pageSize: Number(pickString(params.pageSize) || '30') || 30,
        search: pickString(params.search) || undefined,
        pipelineStage: pickString(params.stage) || undefined,
        source: pickString(params.source) || undefined,
        status: pickString(params.status) || undefined,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink-700">Contactos</h1>
                    <p className="text-sm text-ink-400 mt-1">Gestión de base de datos de clientes</p>
                </div>
                <ContactFormWrapper />
            </div>

            <ContactsToolbar filters={filters} />

            <Suspense fallback={<ContactListSkeleton />}>
                <ContactsListSection userId={user.id} filters={filters} />
            </Suspense>

            <BulkActionsBar />
        </div>
    )
}

async function ContactsListSection({ userId, filters }: { userId: string; filters: ContactsListFilters }) {
    const result = await getContactsCached(userId, filters) as ContactsListResult
    return (
        <div className="space-y-4">
            <ContactList contacts={result.data} />
            <ContactsPagination
                page={result.page}
                pageSize={result.pageSize}
                count={result.count}
                totalPages={result.totalPages}
            />
        </div>
    )
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
