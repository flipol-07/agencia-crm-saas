'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, ArrowRight, X } from 'lucide-react'
import { useContactSelectionStore } from '@/features/contacts/store/useContactSelectionStore'
import { bulkDeleteContactsAction, bulkUpdateStageAction } from '@/features/contacts/actions/bulkActions'
import { PIPELINE_STAGES } from '@/types/database'
import { Button } from '@/shared/components/ui/Button'

export function BulkActionsBar() {
    const router = useRouter()
    const selectedIds = useContactSelectionStore(s => s.selectedIds)
    const clear = useContactSelectionStore(s => s.clear)
    const [pending, startTransition] = useTransition()
    const [showStages, setShowStages] = useState(false)

    const count = selectedIds.size
    if (count === 0) return null

    const ids = Array.from(selectedIds)

    const handleDelete = () => {
        if (!confirm(`¿Eliminar ${count} contacto(s)? Esta acción no se puede deshacer.`)) return
        startTransition(async () => {
            const result = await bulkDeleteContactsAction(ids)
            if (result.error) {
                alert(result.error)
                return
            }
            clear()
            router.refresh()
        })
    }

    const handleStageChange = (stage: string) => {
        startTransition(async () => {
            const result = await bulkUpdateStageAction(ids, stage)
            setShowStages(false)
            if (result.error) {
                alert(result.error)
                return
            }
            clear()
            router.refresh()
        })
    }

    return (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                <span className="text-sm font-semibold text-ink-700">
                    {count} seleccionado{count > 1 ? 's' : ''}
                </span>

                <div className="mx-2 h-6 w-px bg-white/10" />

                <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowStages(v => !v)}
                        disabled={pending}
                    >
                        <ArrowRight className="mr-1.5 h-4 w-4" />
                        Mover a fase
                    </Button>
                    {showStages && (
                        <div className="absolute bottom-full left-0 mb-2 min-w-[180px] rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-1 shadow-xl backdrop-blur-xl">
                            {PIPELINE_STAGES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleStageChange(s.id)}
                                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-ink-600 hover:bg-white/5 hover:text-ink-700"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Eliminar
                </Button>

                <button
                    onClick={clear}
                    className="ml-2 rounded-md p-1.5 text-ink-400 hover:bg-white/5 hover:text-ink-600"
                    title="Limpiar selección"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
