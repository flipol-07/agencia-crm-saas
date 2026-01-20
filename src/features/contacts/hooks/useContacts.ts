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

        const { data, error } = await supabase
            .from('contacts')
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

    const createContact = async (contact: Partial<ContactInsert>) => {
        const { data, error } = await supabase
            .from('contacts')
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
            })
            .select()
            .single()

        if (error) {
            throw new Error(error.message)
        }

        setContacts(prev => [data, ...prev])
        return data
    }

    const updateContact = async (id: string, updates: ContactUpdate) => {
        const { data, error } = await supabase
            .from('contacts')
            .update(updates)
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
        const { error } = await supabase
            .from('contacts')
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

    useEffect(() => {
        async function fetchContact() {
            setLoading(true)
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                setError(error.message)
            } else {
                setContact(data)
            }
            setLoading(false)
        }

        if (id) {
            fetchContact()
        }
    }, [id, supabase])

    const updateContact = async (updates: ContactUpdate) => {
        const { data, error } = await supabase
            .from('contacts')
            .update(updates)
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
    }
}
