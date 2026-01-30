import { ExpensesPageClient } from '@/features/expenses/components/ExpensesPageClient'
import { getSectorsCached, getExpenseCategoriesCached } from '@/features/expenses/services/expenseService.server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function ExpensesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <Suspense fallback={<ExpensesSkeleton />}>
                <ExpensesContent userId={user.id} />
            </Suspense>
        </div>
    )
}

async function ExpensesContent({ userId }: { userId: string }) {
    // Pre-fetcching paralelo de datos estáticos/semi-estáticos
    const [sectors, categories] = await Promise.all([
        getSectorsCached(),
        getExpenseCategoriesCached()
    ])

    return (
        <ExpensesPageClient
            userId={userId}
            initialSectors={sectors}
            initialCategories={categories}
        />
    )
}

function ExpensesSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-10 bg-white/5 rounded w-1/4" />
                <div className="h-12 bg-white/5 rounded w-40" />
            </div>
            <div className="h-32 bg-white/5 rounded-xl w-full" />
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-white/5 rounded-xl" />
                <div className="h-96 bg-white/5 rounded-xl" />
            </div>
        </div>
    )
}
