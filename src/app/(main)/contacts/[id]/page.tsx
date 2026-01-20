'use client'

import { use } from 'react'
import Link from 'next/link'
import { useContact } from '@/features/contacts/hooks'
import { ContactDetail360 } from '@/features/contacts/components'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function ContactDetailPage({ params }: PageProps) {
    const { id } = use(params)
    const { contact, loading, error, updateContact } = useContact(id)

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass rounded-xl p-6 animate-pulse">
                            <div className="h-6 bg-white/10 rounded w-32 mb-4" />
                            <div className="space-y-3">
                                <div className="h-4 bg-white/10 rounded w-full" />
                                <div className="h-4 bg-white/10 rounded w-3/4" />
                                <div className="h-4 bg-white/10 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error || !contact) {
        return (
            <div className="glass rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Contacto no encontrado</h3>
                <p className="text-gray-400 mb-4">{error || 'El contacto solicitado no existe'}</p>
                <Link
                    href="/contacts"
                    className="inline-block px-4 py-2 bg-lime-400 text-black font-medium rounded-lg hover:bg-lime-300 transition-all"
                >
                    Volver a contactos
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/contacts"
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">{contact.company_name}</h1>
                    {contact.contact_name && (
                        <p className="text-gray-400">{contact.contact_name}</p>
                    )}
                </div>
            </div>

            {/* Ficha 360° */}
            <ContactDetail360 contact={contact} onUpdate={updateContact} />
        </div>
    )
}
