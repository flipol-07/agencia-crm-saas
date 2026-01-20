'use client'

import { ContactCard } from './ContactCard'
import type { Contact } from '@/types/database'

interface ContactListProps {
    contacts: Contact[]
    loading?: boolean
}

export function ContactList({ contacts, loading }: ContactListProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass rounded-xl p-5 animate-pulse">
                        <div className="h-6 bg-white/10 rounded mb-3 w-3/4" />
                        <div className="h-4 bg-white/10 rounded mb-2 w-1/2" />
                        <div className="h-4 bg-white/10 rounded w-2/3" />
                    </div>
                ))}
            </div>
        )
    }

    if (contacts.length === 0) {
        return (
            <div className="glass rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Sin contactos</h3>
                <p className="text-gray-400">Crea tu primer contacto para empezar</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
            ))}
        </div>
    )
}
