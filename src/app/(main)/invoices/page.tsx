import { InvoiceList } from '@/features/invoices/components/InvoiceList'

export const metadata = {
    title: 'Facturas | CRM',
    description: 'Gestión de facturación',
}

export default function InvoicesPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                        Facturas
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Gestiona tus facturas y cobros
                    </p>
                </div>
            </div>

            <InvoiceList />
        </div>
    )
}
