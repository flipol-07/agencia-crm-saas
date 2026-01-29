'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useInvoices } from '../hooks/useInvoices'
import type { InvoiceStatus } from '@/types/database'
import { InvoiceForm } from './InvoiceForm'

export function InvoiceList({ contactId }: { contactId?: string }) {
    const { invoices, loading, deleteInvoice, refetch } = useInvoices(contactId)
    const [creating, setCreating] = useState(false)

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
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
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
                    refetch()
                }}
                onCancel={() => setCreating(false)}
            />
        )
    }

    return (
        <div className="space-y-4">
            {invoices.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/20 border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                        <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-zinc-500 text-sm mb-6">No hay facturas registradas</p>
                    <button
                        onClick={() => setCreating(true)}
                        className="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-black font-medium rounded-lg text-sm transition-colors shadow-lg shadow-lime-400/20"
                    >
                        + Crear primera factura
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setCreating(true)}
                            className="bg-lime-400 hover:bg-lime-500 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-lime-400/10 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Factura
                        </button>
                    </div>

                    <div className="space-y-3">
                        {invoices.map(invoice => (
                            <div key={invoice.id} className="group relative flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-xl border border-white/5 hover:border-lime-400/20 transition-all duration-300 hover:shadow-lg">
                                <Link href={`/invoices/${invoice.id}`} className="absolute inset-0 z-10" />

                                <div className="flex items-center gap-4 z-20 pointer-events-none">
                                    <div className="hidden md:flex w-12 h-12 rounded-lg bg-zinc-800 items-center justify-center border border-white/5 group-hover:border-lime-400/20 transition-colors">
                                        <svg className="w-6 h-6 text-zinc-500 group-hover:text-lime-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-zinc-200 group-hover:text-lime-400 transition-colors">
                                                {invoice.invoice_number || 'Borrador'}
                                            </span>
                                            {!contactId && invoice.contacts && (
                                                <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full border border-white/5">
                                                    {invoice.contacts.company_name || 'Sin Cliente'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(invoice.issue_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 z-20 pointer-events-none">
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${statusColors[invoice.status].replace('bg-', 'bg-opacity-10 bg-')}`}>
                                        {statusLabels[invoice.status]}
                                    </span>

                                    <div className="text-right min-w-[80px] sm:min-w-[100px]">
                                        <span className="text-sm font-bold text-zinc-200 block group-hover:scale-105 transition-transform origin-right">
                                            {invoice.total.toLocaleString('es-ES', { style: 'currency', currency: invoice.currency })}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation() // Stop link navigation
                                            if (confirm('¿Estás seguro de eliminar esta factura?')) {
                                                deleteInvoice(invoice.id)
                                            }
                                        }}
                                        className="pointer-events-auto p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                        title="Eliminar factura"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
