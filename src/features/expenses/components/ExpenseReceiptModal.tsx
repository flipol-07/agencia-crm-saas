'use client'

import { ExpenseWithRelations } from '../types'

interface ExpenseReceiptModalProps {
    expense: ExpenseWithRelations
    onClose: () => void
}

export function ExpenseReceiptModal({ expense, onClose }: ExpenseReceiptModalProps) {
    const receiptInfo = parseReceiptInfo(expense.description || '')
    const isPdf = expense.receipt_url?.toLowerCase().includes('.pdf')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b10] shadow-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
                    <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-white">
                            {expense.description?.split('\n')[0] || 'Factura del gasto'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                            {formatDate(expense.date)} · {formatCurrency(expense.amount)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {expense.receipt_url && (
                            <a
                                href={expense.receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                            >
                                Abrir original
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr]">
                    <aside className="overflow-y-auto border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                            Información extraída
                        </h3>

                        <div className="space-y-3">
                            {[
                                ['Proveedor', receiptInfo.proveedor],
                                ['NIF/CIF', receiptInfo.nif],
                                ['Nº factura', receiptInfo.numero],
                                ['Fecha factura', receiptInfo.fecha],
                                ['Base imponible', receiptInfo.base],
                                ['IVA', receiptInfo.iva],
                                ['Total', receiptInfo.total],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-lg bg-white/[0.04] p-3">
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className="mt-1 text-sm font-medium text-white">{value || 'No detectado'}</p>
                                </div>
                            ))}
                        </div>

                        {receiptInfo.resumen && (
                            <div className="mt-4 rounded-lg border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#c4b5fd]">Resumen IA</p>
                                <p className="mt-2 text-sm leading-relaxed text-gray-200">{receiptInfo.resumen}</p>
                            </div>
                        )}
                    </aside>

                    <main className="min-h-[60vh] bg-black/30 p-4">
                        {expense.receipt_url ? (
                            isPdf ? (
                                <iframe
                                    src={expense.receipt_url}
                                    title="Factura del gasto"
                                    className="h-[68vh] w-full rounded-xl border border-white/10 bg-white"
                                />
                            ) : (
                                <div className="flex h-[68vh] items-center justify-center overflow-auto rounded-xl border border-white/10 bg-black/40">
                                    <img
                                        src={expense.receipt_url}
                                        alt="Factura del gasto"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                            )
                        ) : (
                            <div className="flex h-[68vh] items-center justify-center rounded-xl border border-dashed border-white/10 text-gray-500">
                                Esta transacción no tiene factura adjunta.
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

function parseReceiptInfo(description: string) {
    const get = (label: string) => {
        const match = description.match(new RegExp(`${label}:\\s*(.+)`, 'i'))
        return match?.[1]?.trim() || ''
    }

    return {
        proveedor: get('Proveedor'),
        nif: get('NIF/CIF'),
        numero: get('Nº factura'),
        fecha: get('Fecha factura'),
        base: get('Base imponible'),
        iva: get('IVA'),
        total: get('Total'),
        resumen: get('Resumen'),
    }
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount)
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}
