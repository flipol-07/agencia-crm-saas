import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SubscriptionsManager } from './SubscriptionsManager'

export const metadata = {
    title: 'Suscripciones | CRM',
    description: 'Facturas recurrentes',
}

export default function InvoiceSubscriptionsPage() {
    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10 relative">
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-neon-lime/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-ink-700 tracking-tight">
                        Suscripciones
                    </h1>
                    <p className="text-sm text-ink-400 mt-1">
                        Facturas recurrentes generadas automáticamente cada ciclo.
                    </p>
                </div>
            </div>

            <Suspense fallback={<SubscriptionsSkeleton />}>
                <SubscriptionsListSection />
            </Suspense>
        </div>
    )
}

async function SubscriptionsListSection() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const { data } = await supa
        .from('invoice_subscriptions')
        .select('*, contacts(id, contact_name, company_name)')
        .eq('created_by', user.id)
        .order('next_run_at', { ascending: true })

    return <SubscriptionsManager initialRows={data || []} />
}

function SubscriptionsSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse border border-white/5" />
            ))}
        </div>
    )
}
