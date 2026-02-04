'use client'

import { useState } from 'react'
import { ContactForm } from './ContactForm'
import type { ContactFormData } from './ContactForm'
import {
    createContactAction as createContact,
    updateContactAction as updateContact
} from '../actions/contactActions'
import { analyzeWebsite } from '../actions/analyze-website'
import { toast } from 'sonner'

export function ContactFormWrapper() {
    const [showForm, setShowForm] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const handleCreateContact = async (data: ContactFormData) => {
        setIsCreating(true)
        try {
            const { data: newContact, error } = await createContact({
                company_name: data.company_name,
                contact_name: data.contact_name || null,
                email: data.email || null,
                phone: data.phone || null,
                tax_id: data.tax_id || null,
                tax_address: data.tax_address || null,
                estimated_value: Number(data.estimated_value) || 0,
                source: data.source,
                notes: data.notes || null,
                website: data.website || null,
                services: data.services || [],
            })

            if (error) {
                toast.error(error)
                return
            }

            if (newContact) {
                toast.success('Contacto creado correctamente')
                const promises = []
                if (data.website) {
                    promises.push(analyzeWebsite(data.website, newContact.id))
                }
                if (data.email) {
                    const { syncContactEmails } = await import('@/features/emails/actions/sync')
                    promises.push(syncContactEmails(newContact.id, data.email))
                }
                if (promises.length > 0) {
                    await Promise.allSettled(promises)
                }
            }

            setShowForm(false)
        } catch (error: any) {
            console.error('Error creating contact:', error)
            toast.error('Error inesperado al crear el contacto')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-[#8b5cf6] text-white font-medium rounded-lg hover:bg-[#7c3aed] hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all flex items-center gap-2"
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

            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Nuevo Contacto</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <ContactForm
                            onSubmit={handleCreateContact}
                            onCancel={() => setShowForm(false)}
                            isLoading={isCreating}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
