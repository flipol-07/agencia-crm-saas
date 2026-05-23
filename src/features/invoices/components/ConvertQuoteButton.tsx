'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { convertQuoteToInvoiceAction } from '@/features/invoices/actions/convertQuoteAction'

interface Props {
    quoteId: string
    quoteStatus: string
}

/**
 * Botón que aparece cuando el documento es un presupuesto (status='quote').
 * Convierte el quote en una factura draft y redirige al detalle de la nueva.
 */
export function ConvertQuoteButton({ quoteId, quoteStatus }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [busy, setBusy] = useState(false)

    if (quoteStatus !== 'quote') return null

    const handleConvert = () => {
        if (!confirm('¿Convertir este presupuesto en factura? Se creará una nueva factura en estado borrador con los mismos datos.')) return

        setBusy(true)
        startTransition(async () => {
            const res = await convertQuoteToInvoiceAction({ quoteId })
            setBusy(false)
            if (res.error || !res.invoiceId) {
                alert(res.error || 'Error al convertir')
                return
            }
            router.push(`/invoices/${res.invoiceId}`)
        })
    }

    return (
        <button
            onClick={handleConvert}
            disabled={pending || busy}
            className="px-5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50"
        >
            <FileText className="w-4 h-4" />
            {busy ? 'Convirtiendo…' : 'Convertir en factura'}
        </button>
    )
}
