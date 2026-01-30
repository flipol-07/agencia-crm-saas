'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactInsert, ContactUpdate } from '@/types/database'

export function useContacts() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchContacts = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await (supabase.from('contacts') as any)
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {
            setContacts(data || [])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchContacts()
    }, [fetchContacts])

    const createContact = async (contact: Partial<ContactInsert>): Promise<Contact | null> => {
        const { data, error } = await (supabase.from('contacts') as any)
            .insert({
                company_name: contact.company_name || 'Sin nombre',
                contact_name: contact.contact_name,
                email: contact.email,
                phone: contact.phone,
                status: contact.status || 'prospect',
                pipeline_stage: contact.pipeline_stage || 'nuevo',
                source: contact.source || 'outbound',
                pain_points: contact.pain_points || [],
                requirements: contact.requirements || [],
                notes: contact.notes,
                website: contact.website,
                tax_id: contact.tax_id,
                tax_address: contact.tax_address,
                services: contact.services || [],
            } as any)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setContacts(prev => [data, ...prev])
        return data
    }

    const updateContact = async (id: string, updates: ContactUpdate) => {
        const { data, error } = await (supabase.from('contacts') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setContacts(prev => prev.map(c => c.id === id ? data : c))
        return data
    }

    const deleteContact = async (id: string) => {
        const { error } = await (supabase.from('contacts') as any)
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(error.message)
        }

        setContacts(prev => prev.filter(c => c.id !== id))
    }

    return {
        contacts,
        loading,
        error,
        refetch: fetchContacts,
        createContact,
        updateContact,
        deleteContact,
    }
}

// Hook para un contacto individual
export function useContact(id: string) {
    const [contact, setContact] = useState<Contact | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchContact = useCallback(async () => {
        setLoading(true)
        const { data, error } = await (supabase.from('contacts') as any)
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            setError(error.message)
        } else {
            setContact(data)
        }
        setLoading(false)
    }, [id, supabase])

    useEffect(() => {
        if (id) {
            fetchContact()
        }
    }, [id, fetchContact])

    const updateContact = async (updates: ContactUpdate) => {
        const { data, error } = await (supabase.from('contacts') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setContact(data)
        return data
    }

    return {
        contact,
        loading,
        error,
        updateContact,
        refetch: fetchContact // Exportar refetch
    }
}

export function useContactEmails(contactId: string, shouldSync: boolean = false, contactEmail?: string | null) {
    const [emails, setEmails] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [lastSync, setLastSync] = useState<Date | null>(null)
    const supabase = createClient()

    const fetchEmails = useCallback(async () => {
        if (!contactId) return
        setLoading(true)
        const { data } = await (supabase.from('contact_emails') as any)
            .select('*')
            .eq('contact_id', contactId)
            .order('received_at', { ascending: false })

        if (data) setEmails(data)
        setLoading(false)
    }, [contactId, supabase])

    // Sincronización automática con proveedor de email (IMAP)
    useEffect(() => {
        let mounted = true

        const sync = async () => {
            if (shouldSync && contactEmail && contactId) {
                try {
                    // Import dinámico para evitar problemas de dependencias en cliente si syncContactEmails usa librerías de servidor
                    // Nota: syncContactEmails es Server Action, se puede llamar directo.
                    // Pero para evitar bloqueo de UI inicial, lo hacemos después de un primer render o tick.
                    const { syncContactEmails } = await import('@/features/emails/actions/sync')
                    await syncContactEmails(contactId, contactEmail)
                    if (mounted) {
                        setLastSync(new Date())
                        fetchEmails() // Recargar datos locales después del sync
                    }
                } catch (error) {
                    console.error("Auto-sync failed:", error)
                }
            }
        }

        // Ejecutar sync solo una vez al montar si shouldSync es true
        // y solo si tenemos los datos necesarios
        if (shouldSync && contactEmail) {
            sync()
        }
    }, [contactId, contactEmail, shouldSync, fetchEmails])

    useEffect(() => {
        fetchEmails()
    }, [fetchEmails])

    return { emails, loading, refetch: fetchEmails, lastSync }
}
