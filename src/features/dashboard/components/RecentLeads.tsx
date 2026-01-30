'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Contact } from '@/types/database'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'

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
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_10px_rgba(163,230,53,0.5)]"></span>
                    Leads Recientes
                </h3>
                <Link href="/contacts" className="text-xs text-text-muted hover:text-brand transition-colors">
                    Ver todos →
                </Link>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <p className="text-text-muted text-sm">No hay actividad reciente.</p>
                    </div>
                ) : (
                    leads.map(lead => (
                        <Link
                            key={lead.id}
                            href={`/contacts/${lead.id}`}
                            className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-300 hover:translate-x-1"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-text-muted group-hover:bg-brand/10 group-hover:text-brand transition-colors border border-white/5 group-hover:border-brand/20">
                                    {lead.company_name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary group-hover:text-brand transition-colors text-sm">
                                        {lead.company_name}
                                    </p>
                                    <p className="text-xs text-text-muted flex items-center gap-1">
                                        {lead.contact_name}
                                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                        {new Date(lead.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-lg bg-black/50 text-text-muted border border-white/5 group-hover:border-white/10`}>
                                {lead.pipeline_stage}
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </Card>
    )
}
