'use client'

import Link from 'next/link'
import { CopyButton } from '@/shared/components/ui/CopyButton'
import type { Contact } from '@/types/database'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function RecentLeadItem({ lead }: { lead: Contact }) {
    return (
        <Link
            href={`/contacts/${lead.id}`}
            className="group/item flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-brand-neon-lime/20 transition-all duration-300 hover:translate-x-1"
        >
            <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400 group-hover/item:bg-brand-neon-lime/10 group-hover/item:text-brand-neon-lime transition-colors border border-white/5 group-hover/item:border-brand-neon-lime/20 shrink-0">
                    {lead.company_name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-200 group-hover/item:text-brand-neon-lime transition-colors text-sm truncate">
                            {lead.company_name}
                        </p>
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5 group-hover/item:border-brand-neon-lime/20 ml-2 whitespace-nowrap`}>
                            {lead.pipeline_stage}
                        </span>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                        {lead.contact_name}
                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                        <span suppressHydrationWarning>
                            {format(new Date(lead.updated_at), 'd MMM', { locale: es })}
                        </span>
                        {lead.email && (
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity ml-2 pointer-events-auto" onClick={(e) => e.preventDefault()}>
                                <CopyButton textToCopy={lead.email} label="" className="w-4 h-4 text-brand-neon-lime" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
