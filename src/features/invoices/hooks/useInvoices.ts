'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
    Invoice,
    InvoiceInsert,
    InvoiceUpdate,
    InvoiceItemInsert
} from '@/types/database'

// Hook para facturas de un cliente
export function useContactInvoices(contactId: string) {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {
            setInvoices(data || [])
        }
        setLoading(false)
    }, [supabase, contactId])

    useEffect(() => {
        if (contactId) {
            fetchInvoices()
        }
    }, [contactId, fetchInvoices])

    const createInvoice = async () => {
        // Generar número simple (en producción se usaría secuencia o lógica compleja)
        const number = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`

        const { data, error } = await supabase
            .from('invoices')
            .insert({
                contact_id: contactId,
                invoice_number: number,
                status: 'draft',
                issue_date: new Date().toISOString().split('T')[0],
            })
            .select()
            .single()

        if (error) throw new Error(error.message)

        setInvoices(prev => [data, ...prev])
        return data
    }

    const deleteInvoice = async (id: string) => {
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)

        setInvoices(prev => prev.filter(i => i.id !== id))
    }

    return {
        invoices,
        loading,
        error,
        createInvoice,
        deleteInvoice,
    }
}
