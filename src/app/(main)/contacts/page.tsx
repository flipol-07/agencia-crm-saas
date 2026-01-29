'use client'

import { useState } from 'react'
import { ContactList, ContactForm } from '@/features/contacts/components'
import { useContacts } from '@/features/contacts/hooks'
import type { ContactFormData } from '@/features/contacts/components/ContactForm'
import { analyzeWebsite } from '@/features/contacts/actions/analyze-website'

export default function ContactsPage() {
    const { contacts, loading, createContact } = useContacts()
    const [showForm, setShowForm] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const handleCreateContact = async (data: ContactFormData) => {
        setIsCreating(true)
        try {
            const newContact = await createContact({
                company_name: data.company_name,
                contact_name: data.contact_name || null,
                email: data.email || null,
                phone: data.phone || null,
                source: data.source,
                notes: data.notes || null,
                website: data.website || null,
                services: data.services || [],
            })

            // Automatización Post-Creación
            if (newContact) {
                const promises = []

                // 1. Análisis Web IA
                if (data.website) {
                    promises.push(analyzeWebsite(data.website, newContact.id))
                }

                // 2. Sync Emails (si hay email)
                if (data.email) {
                    const { syncContactEmails } = await import('@/features/emails/actions/sync')
                    promises.push(syncContactEmails(newContact.id, data.email))
                }

                if (promises.length > 0) {
                    await Promise.allSettled(promises)
                }
            }

            setShowForm(false)
        } catch (error) {
            console.error('Error creating contact:', error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Contactos</h1>
                    <p className="text-gray-400 mt-1">
                        {loading ? 'Cargando...' : `${contacts.length} contactos`}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-lime-400 text-black font-medium rounded-lg hover:bg-lime-300 transition-all flex items-center gap-2"
                >
                    {showForm ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo Contacto
                        </>
                    )}
                </button>
            </div>

            {/* Formulario de creación */}
            {showForm && (
                <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Nuevo Contacto</h2>
                    <ContactForm
                        onSubmit={handleCreateContact}
                        onCancel={() => setShowForm(false)}
                        isLoading={isCreating}
                    />
                </div>
            )}

            {/* Lista de contactos */}
            <ContactList contacts={contacts} loading={loading} />
        </div>
    )
}
