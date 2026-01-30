'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
    Invoice,
    InvoiceWithDetails
} from '@/types/database'

// Hook para facturas (global o de un cliente)
export function useInvoices(contactId?: string) {
    const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            let query = (supabase
                .from('invoices') as any)
                .select(`
                    *,
                    contacts (
                        id,
                        company_name,
                        contact_name,
                        tax_id,
                        tax_address,
                        email,
                        phone
                    ),
                    invoice_items (*)
                `)
                .order('created_at', { ascending: false })

            if (contactId) {
                query = query.eq('contact_id', contactId)
            }

            const { data, error } = await query

            if (error) throw error
            setInvoices((data as InvoiceWithDetails[]) || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [supabase, contactId])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    const deleteInvoice = async (id: string) => {
        const { error } = await (supabase
            .from('invoices') as any)
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)

        setInvoices(prev => prev.filter(i => i.id !== id))
    }

    const updateInvoiceStatus = async (id: string, status: string) => {
        const { error } = await (supabase
            .from('invoices') as any)
            .update({ status })
            .eq('id', id)

        if (error) throw new Error(error.message)

        setInvoices(prev => prev.map(inv =>
            inv.id === id ? { ...inv, status: status as any } : inv
        ))
    }

    return {
        invoices,
        loading,
        error,
        deleteInvoice,
        updateInvoiceStatus,
        refetch: fetchInvoices
    }
}

// Re-export for compatibility if needed, though we should update callsites
export const useContactInvoices = (contactId: string) => useInvoices(contactId)
