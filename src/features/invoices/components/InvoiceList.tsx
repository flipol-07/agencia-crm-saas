'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useInvoices } from '../hooks/useInvoices'
import type { InvoiceStatus, InvoiceWithDetails } from '@/types/database'
import { InvoiceForm } from './InvoiceForm'
import { Badge } from '@/shared/components/ui/Badge'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface InvoiceListProps {
    contactId?: string
    initialInvoices?: InvoiceWithDetails[]
}

export function InvoiceList({ contactId, initialInvoices }: InvoiceListProps) {
    const { invoices: fetchedInvoices, loading, deleteInvoice, refetch, updateInvoiceStatus } = useInvoices(contactId)

    // Usar initialInvoices si están presentes y todavía estamos cargando los datos frescos
    const invoices = useMemo(() => {
        if (fetchedInvoices.length > 0) return fetchedInvoices
        return (initialInvoices || []) as InvoiceWithDetails[]
    }, [fetchedInvoices, initialInvoices])

    const isInitialLoading = loading && invoices.length === 0
    const [creating, setCreating] = useState(false)

    const statusConfig: Record<InvoiceStatus, { label: string, color: string, border: string, bg: string }> = {
        draft: { label: 'Borrador', color: 'text-gray-400', border: 'border-gray-500/20', bg: 'bg-gray-500/10' },
        sent: { label: 'Enviada', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
        paid: { label: 'Pagada', color: 'text-[#8b5cf6]', border: 'border-[#8b5cf6]/20', bg: 'bg-[#8b5cf6]/10' },
        overdue: { label: 'Vencida', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/10' },
        cancelled: { label: 'Cancelada', color: 'text-gray-500', border: 'border-gray-500/20', bg: 'bg-white/5' },
    }

    if (isInitialLoading && !creating) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                ))}
            </div>
        )
    }

    if (creating) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <InvoiceForm
                    initialContactId={contactId}
                    onSuccess={() => {
                        setCreating(false)
                        refetch()
                    }}
                    onCancel={() => setCreating(false)}
                />
            </motion.div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#8b5cf6] rounded-full"></span>
                    Listado de Facturas
                </h2>
                <button
                    onClick={() => setCreating(true)}
                    className="w-full sm:w-auto group bg-[#8b5cf6] text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-105 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Factura
                </button>
            </div>

            {invoices.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 text-center border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#8b5cf6]/5 rounded-full blur-3xl -z-10"></div>
                    <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-sm">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No hay facturas registradas</h3>
                    <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">Comienza a registrar tus ingresos creando tu primera factura profesional.</p>
                    <button
                        onClick={() => setCreating(true)}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl text-sm transition-all border border-white/10 hover:border-white/20"
                    >
                        Crear primera factura
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {invoices.map((invoice, index) => (
                            <motion.div
                                key={invoice.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative flex flex-col xl:flex-row xl:items-center justify-between p-3 sm:p-4 bg-black/40 backdrop-blur-md hover:bg-white/5 rounded-xl border border-white/5 hover:border-[#8b5cf6]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] max-w-full"
                            >
                                <Link href={`/invoices/${invoice.id}`} className="absolute inset-0 z-10" />

                                <div className="flex items-center gap-3 z-20 pointer-events-none mb-4 sm:mb-3 xl:mb-0 min-w-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-[#8b5cf6]/20 group-hover:bg-[#8b5cf6]/5 transition-colors shadow-inner shrink-0">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:text-[#8b5cf6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-base sm:text-lg font-bold text-white group-hover:text-[#8b5cf6] transition-colors tracking-tight font-display truncate capitalize">
                                                {invoice.invoice_number || 'BORRADOR'}
                                            </span>
                                            {!contactId && invoice.contacts && (
                                                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 tracking-wider truncate max-w-[120px]">
                                                    {invoice.contacts.company_name || 'SIN CLIENTE'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 flex-wrap">
                                            <span className="whitespace-nowrap flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4 z-20 pointer-events-none justify-between sm:justify-end w-full sm:w-auto">
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="relative group/select pointer-events-auto"
                                    >
                                        <select
                                            value={invoice.status}
                                            onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value)}
                                            className={`appearance-none cursor-pointer text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border transition-all ${statusConfig[invoice.status].bg} ${statusConfig[invoice.status].color} ${statusConfig[invoice.status].border} hover:opacity-80 pr-6 sm:pr-8`}
                                        >
                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                <option key={key} value={key} className="bg-zinc-900 text-gray-300">
                                                    {config.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className={`absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2.5 pointer-events-none opacity-50 ${statusConfig[invoice.status].color}`}>
                                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="text-right min-w-[80px] sm:min-w-[100px] shrink-0">
                                        <span className="text-lg sm:text-2xl font-bold text-white block group-hover:scale-105 transition-transform origin-right tracking-tight font-display">
                                            {(invoice.subtotal + invoice.tax_amount).toLocaleString('es-ES', { style: 'currency', currency: invoice.currency })}
                                        </span>
                                        <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-medium">Total</span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (confirm('¿Estás seguro de eliminar esta factura?')) {
                                                deleteInvoice(invoice.id)
                                            }
                                        }}
                                        className="pointer-events-auto w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl border border-transparent hover:border-red-400/20 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                        title="Eliminar factura"
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
