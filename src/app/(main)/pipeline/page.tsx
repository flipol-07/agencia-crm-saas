'use client'

import Link from 'next/link'
import { PipelineKanban } from '@/features/pipeline/components'

export default function PipelinePage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Pipeline</h1>
                    <p className="text-gray-400 mt-1">Vista de embudo de ventas</p>
                </div>
                <Link
                    href="/contacts"
                    className="px-4 py-2 bg-lime-400 text-black font-medium rounded-lg hover:bg-lime-300 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Lead
                </Link>
            </div>

            {/* Kanban */}
            <PipelineKanban />
        </div>
    )
}
