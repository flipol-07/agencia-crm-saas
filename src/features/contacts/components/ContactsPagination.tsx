'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
    page: number
    pageSize: number
    count: number
    totalPages: number
}

export function ContactsPagination({ page, pageSize, count, totalPages }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    if (count === 0) return null

    const goTo = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        if (newPage <= 1) params.delete('page')
        else params.set('page', String(newPage))
        const qs = params.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
    }

    const from = (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, count)

    return (
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <p className="text-xs text-ink-400">
                Mostrando <span className="text-ink-600 font-medium">{from}–{to}</span> de <span className="text-ink-600 font-medium">{count}</span> contactos
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => goTo(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-ink-500 disabled:opacity-40 hover:bg-white/5 disabled:hover:bg-transparent"
                    aria-label="Página anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-ink-500 px-3">
                    {page} / {totalPages}
                </span>
                <button
                    onClick={() => goTo(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-ink-500 disabled:opacity-40 hover:bg-white/5 disabled:hover:bg-transparent"
                    aria-label="Página siguiente"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
