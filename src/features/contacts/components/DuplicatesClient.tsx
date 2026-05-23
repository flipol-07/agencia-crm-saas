'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, GitMerge, ArrowRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { mergeContactsAction } from '@/features/contacts/actions/mergeContactsAction'
import type { DuplicatePair } from '@/features/contacts/services/duplicates.service'
import type { Contact } from '@/types/database'

interface Props { duplicates: DuplicatePair[] }

export function DuplicatesClient({ duplicates }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [processed, setProcessed] = useState<Set<string>>(new Set())

    const handleMerge = (pair: DuplicatePair, keep: 'A' | 'B') => {
        const keepId = keep === 'A' ? pair.contactA.id : pair.contactB.id
        const discardId = keep === 'A' ? pair.contactB.id : pair.contactA.id
        if (!confirm(`Fusionar contactos. Se conservará "${keep === 'A' ? pair.contactA.company_name : pair.contactB.company_name}" y se eliminará "${keep === 'A' ? pair.contactB.company_name : pair.contactA.company_name}". Las relaciones (facturas, proyectos, etc.) se moverán al conservado. ¿Continuar?`)) return

        startTransition(async () => {
            const res = await mergeContactsAction({ keepId, discardId })
            if (res.error) {
                alert(res.error)
                return
            }
            setProcessed(prev => new Set(prev).add(`${pair.contactA.id}-${pair.contactB.id}`))
            router.refresh()
        })
    }

    return (
        <div className="space-y-3">
            {duplicates.map(pair => {
                const key = `${pair.contactA.id}-${pair.contactB.id}`
                if (processed.has(key)) return null
                return (
                    <div key={key} className="rounded-2xl border border-white/10 bg-[#0a0a0a]/60 p-4 backdrop-blur-md">
                        <div className="mb-3 flex items-center gap-2 text-xs">
                            {pair.emailMatch && <Badge>📧 Email idéntico</Badge>}
                            {pair.phoneMatch && <Badge>📱 Teléfono idéntico</Badge>}
                            {pair.nameSimilarity > 0.8 && <Badge>🔤 Nombre {Math.round(pair.nameSimilarity * 100)}% similar</Badge>}
                            <span className="ml-auto text-ink-400">Score: {pair.score.toFixed(2)}</span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <ContactPreview contact={pair.contactA} onKeep={() => handleMerge(pair, 'A')} disabled={pending} side="A" />
                            <ContactPreview contact={pair.contactB} onKeep={() => handleMerge(pair, 'B')} disabled={pending} side="B" />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function Badge({ children }: { children: React.ReactNode }) {
    return <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-ink-500">{children}</span>
}

function ContactPreview({ contact, onKeep, disabled, side }: { contact: Contact; onKeep: () => void; disabled: boolean; side: 'A' | 'B' }) {
    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-700 truncate">{contact.company_name}</p>
                    {contact.contact_name && <p className="text-xs text-ink-400 truncate">{contact.contact_name}</p>}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-ink-400">{side}</span>
            </div>
            <dl className="space-y-1.5 text-xs">
                {contact.email && (
                    <div className="flex items-center gap-2 text-ink-500"><Mail className="h-3 w-3" /> {contact.email}</div>
                )}
                {contact.phone && (
                    <div className="flex items-center gap-2 text-ink-500"><Phone className="h-3 w-3" /> {contact.phone}</div>
                )}
                {contact.tax_id && (
                    <div className="text-ink-400">NIF: {contact.tax_id}</div>
                )}
                <div className="text-[10px] text-ink-400">Creado: {new Date(contact.created_at).toLocaleDateString()}</div>
            </dl>
            <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={onKeep} disabled={disabled}>
                    <GitMerge className="h-3.5 w-3.5 mr-1.5" />
                    Conservar este
                </Button>
                <a href={`/contacts/${contact.id}`} className="inline-flex items-center text-xs text-ink-400 hover:text-ink-700">
                    Ver detalle <ArrowRight className="h-3 w-3 ml-0.5" />
                </a>
            </div>
        </div>
    )
}
