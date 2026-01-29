'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useContactInvoices } from '../hooks'
import type { InvoiceStatus } from '@/types/database'
import { InvoiceForm } from './InvoiceForm'

export function InvoiceList({ contactId }: { contactId: string }) {
    const { invoices, loading, deleteInvoice, refetch } = useContactInvoices(contactId || '')
    const [creating, setCreating] = useState(false)

    // Si no hay contactId (lista global?), podríamos manejarlo, pero este componente parece específico de contacto.

    const statusColors: Record<InvoiceStatus, string> = {
        draft: 'bg-gray-500/20 text-gray-400',
        sent: 'bg-blue-500/20 text-blue-400',
        paid: 'bg-lime-500/20 text-lime-400',
        overdue: 'bg-red-500/20 text-red-400',
        cancelled: 'bg-white/10 text-gray-500',
    }

    const statusLabels: Record<InvoiceStatus, string> = {
        draft: 'Borrador',
        sent: 'Enviada',
        paid: 'Pagada',
        overdue: 'Vencida',
        cancelled: 'Cancelada',
    }

    if (loading && !creating) {
        return (
            <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
            </div>
        )
    }

    if (creating) {
        return (
            <InvoiceForm
                initialContactId={contactId}
                onSuccess={() => {
                    setCreating(false)
                    // Recargar lista
                    window.location.reload() // O mejor, usar refetch si lo expone useContactInvoices (que no lo hace aun)
                }}
                onCancel={() => setCreating(false)}
            />
        )
    }

    return (
        <div className="space-y-4">
            {invoices.length === 0 ? (
                <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white/5 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">Sin facturas</p>
                    <button
                        onClick={() => setCreating(true)}
                        className="text-sm text-lime-400 hover:text-lime-300"
                    >
                        + Crear factura
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {invoices.map(invoice => (
                            <div key={invoice.id} className="group flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                <Link href={`/invoices/${invoice.id}`} className="flex-1 flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">
                                            {invoice.invoice_number || 'Borrador'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(invoice.issue_date).toLocaleDateString('es-ES')}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[invoice.status]}`}>
                                        {statusLabels[invoice.status]}
                                    </span>
                                </Link>

                                <div className="text-right mr-3">
                                    <span className="text-sm font-bold text-white block">
                                        {invoice.total.toLocaleString('es-ES', { style: 'currency', currency: invoice.currency })}
                                    </span>
                                </div>

                                <button
                                    onClick={() => deleteInvoice(invoice.id)}
                                    className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Eliminar factura"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setCreating(true)}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-sm transition-all"
                    >
                        + Nueva Factura
                    </button>
                </>
            )}
        </div>
    )
}
