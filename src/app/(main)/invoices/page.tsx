import { InvoiceList } from '@/features/invoices/components/InvoiceList'
import { getInvoicesCached } from '@/features/invoices/services/invoiceService.server'
import { Suspense } from 'react'

export const metadata = {
    title: 'Facturas | CRM',
    description: 'Gestión de facturación',
}

export default function InvoicesPage() {
    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10 relative">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-neon-lime/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase">
                        Facturas
                    </h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        Gestiona tus ingresos y cobros
                    </p>
                </div>
            </div>

            <Suspense fallback={<InvoiceListSkeleton />}>
                <InvoicesListSection />
            </Suspense>
        </div>
    )
}

async function InvoicesListSection() {
    const invoices = await getInvoicesCached()
    return <InvoiceList initialInvoices={invoices} />
}

function InvoiceListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse border border-white/5" />
            ))}
        </div>
    )
}
