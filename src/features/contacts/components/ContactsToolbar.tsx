'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Search, Filter, Upload, Download, Users } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import type { ContactsListFilters } from '@/features/contacts/services/contact.service.server'
import { ImportContactsModal } from './ImportContactsModal'
import { PIPELINE_STAGES } from '@/types/database'

interface Props {
    filters: ContactsListFilters
}

const SOURCES = [
    { value: '', label: 'Cualquier origen' },
    { value: 'inbound_whatsapp', label: 'WhatsApp entrante' },
    { value: 'inbound_email', label: 'Email entrante' },
    { value: 'outbound', label: 'Outbound' },
    { value: 'referral', label: 'Referido' },
    { value: 'website', label: 'Web' },
    { value: 'other', label: 'Otro' },
] as const

export function ContactsToolbar({ filters }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()

    const [searchValue, setSearchValue] = useState(filters.search ?? '')
    const [importOpen, setImportOpen] = useState(false)

    // Sincroniza el input cuando llegan filtros nuevos por URL (p.ej. botón back).
    useEffect(() => {
        setSearchValue(filters.search ?? '')
    }, [filters.search])

    const pushParams = useCallback(
        (mutator: (p: URLSearchParams) => void) => {
            const params = new URLSearchParams(searchParams.toString())
            mutator(params)
            // Al cambiar filtros volvemos a la pagina 1.
            params.delete('page')
            const qs = params.toString()
            startTransition(() => {
                router.push(qs ? `${pathname}?${qs}` : pathname)
            })
        },
        [router, pathname, searchParams]
    )

    // Debounce sobre el input de busqueda.
    useEffect(() => {
        const handle = setTimeout(() => {
            if (searchValue === (filters.search ?? '')) return
            pushParams(p => {
                if (searchValue) p.set('search', searchValue)
                else p.delete('search')
            })
        }, 300)
        return () => clearTimeout(handle)
    }, [searchValue, filters.search, pushParams])

    const handleStage = (stage: string) => {
        pushParams(p => {
            if (stage) p.set('stage', stage)
            else p.delete('stage')
        })
    }

    const handleSource = (source: string) => {
        pushParams(p => {
            if (source) p.set('source', source)
            else p.delete('source')
        })
    }

    const exportUrl = (() => {
        const qs = new URLSearchParams()
        if (filters.search) qs.set('search', filters.search)
        if (filters.pipelineStage) qs.set('stage', filters.pipelineStage)
        if (filters.source) qs.set('source', filters.source)
        const s = qs.toString()
        return `/api/contacts/export${s ? `?${s}` : ''}`
    })()

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                        type="search"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Buscar por empresa, contacto o email…"
                        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-ink-700 placeholder:text-ink-400 outline-none focus:border-brand"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={filters.pipelineStage ?? ''}
                        onChange={(e) => handleStage(e.target.value)}
                        className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-ink-700"
                    >
                        <option value="">Todas las fases</option>
                        {PIPELINE_STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                    <select
                        value={filters.source ?? ''}
                        onChange={(e) => handleSource(e.target.value)}
                        className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-ink-700"
                    >
                        {SOURCES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)} title="Importar CSV">
                    <Upload className="h-4 w-4 mr-1.5" />
                    Importar
                </Button>
                <a href={exportUrl} download>
                    <Button variant="ghost" size="sm" title="Exportar CSV">
                        <Download className="h-4 w-4 mr-1.5" />
                        Exportar
                    </Button>
                </a>
                <a href="/contacts/duplicates" title="Detectar duplicados">
                    <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4 mr-1.5" />
                        Duplicados
                    </Button>
                </a>
            </div>

            {importOpen && <ImportContactsModal open={importOpen} onClose={() => setImportOpen(false)} />}
        </div>
    )
}
