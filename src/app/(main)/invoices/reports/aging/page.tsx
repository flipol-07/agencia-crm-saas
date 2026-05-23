import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAgingReport, AGING_BUCKETS } from '@/features/invoices/services/aging.service.server'
import { AgingReportClient } from './AgingReportClient'

export const metadata = {
    title: 'Aged Receivables | CRM',
    description: 'Reporte de antigüedad de cobros',
}

export default async function AgingReportPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const data = await getAgingReport()

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10 relative">
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-ink-700 tracking-tight">
                        Aged Receivables
                    </h1>
                    <p className="text-sm text-ink-400 mt-1">
                        Antigüedad de cobros pendientes por contacto y rango de días.
                    </p>
                </div>
            </div>

            <AgingReportClient data={data} buckets={AGING_BUCKETS} />
        </div>
    )
}
