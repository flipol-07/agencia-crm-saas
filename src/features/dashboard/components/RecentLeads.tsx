'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Contact } from '@/types/database'

export function RecentLeads() {
    const [leads, setLeads] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchLeads() {
            const { data } = await supabase
                .from('contacts')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(5)

            if (data) setLeads(data)
            setLoading(false)
        }
        fetchLeads()
    }, [supabase])

    if (loading) return <div className="h-48 animate-pulse bg-white/5 rounded-xl" />

    return (
        <div className="glass rounded-xl p-6 border border-white/5 h-full">
            <h3 className="text-lg font-semibold text-white mb-4">Leads Recientes</h3>
            <div className="space-y-3">
                {leads.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay leads recientes.</p>
                ) : (
                    leads.map(lead => (
                        <Link
                            key={lead.id}
                            href={`/contacts/${lead.id}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                            <div>
                                <p className="font-medium text-white group-hover:text-lime-400 transition-colors">
                                    {lead.company_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {lead.contact_name} • {new Date(lead.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5`}>
                                {lead.pipeline_stage}
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
