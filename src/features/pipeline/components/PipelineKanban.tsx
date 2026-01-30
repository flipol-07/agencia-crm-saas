'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    PointerSensor,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useContacts } from '@/features/contacts/hooks'
import { PIPELINE_STAGES } from '@/types/database'
import type { Contact } from '@/types/database'

function PipelineCard({ contact, isOverlay = false }: { contact: Contact, isOverlay?: boolean }) {
    const getSourceIcon = (source: string) => {
        const icons: Record<string, string> = {
            inbound_whatsapp: '📱',
            inbound_email: '📧',
            outbound: '📤',
            referral: '🤝',
            website: '🌐',
            other: '📌',
        }
        return icons[source] || '📌'
    }

    return (
        <div className={`bg-white/5 border border-white/10 rounded-lg p-4 hover:border-lime-400/30 transition-all cursor-pointer group select-none ${isOverlay ? 'shadow-2xl bg-[#1a1a1a] border-lime-500/50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <Link href={`/contacts/${contact.id}`} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                    <h4 className="font-medium text-white group-hover:text-lime-400 transition-colors truncate">
                        {contact.company_name}
                    </h4>
                </Link>
                <span className="text-xs ml-2">{getSourceIcon(contact.source)}</span>
            </div>

            {contact.contact_name && (
                <p className="text-sm text-gray-400 truncate mb-2">{contact.contact_name}</p>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500">
                {contact.phone && (
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        WA
                    </span>
                )}
                {contact.email && (
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                    </span>
                )}
                <span className="ml-auto font-mono text-lime-500/80">
                    {contact.estimated_value ? `${contact.estimated_value.toLocaleString()}€` : '-'}
                </span>
            </div>
        </div>
    )
}

function DraggableContact({ contact }: { contact: Contact }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: contact.id,
        data: { contact }
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <PipelineCard contact={contact} />
        </div>
    )
}

function PipelineColumn({
    stage,
    stageId,
    contacts,
    color,
    children
}: {
    stage: string
    stageId: string
    contacts: Contact[]
    color: string
    children: React.ReactNode
}) {
    const { setNodeRef } = useDroppable({
        id: stageId,
    })

    const colorClasses: Record<string, string> = {
        gray: 'border-gray-500/30 bg-gray-500/5',
        blue: 'border-blue-500/30 bg-blue-500/5',
        purple: 'border-purple-500/30 bg-purple-500/5',
        amber: 'border-amber-500/30 bg-amber-500/5',
        lime: 'border-lime-500/30 bg-lime-500/5',
        red: 'border-red-500/30 bg-red-500/5',
    }

    const headerColors: Record<string, string> = {
        gray: 'text-gray-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        amber: 'text-amber-400',
        lime: 'text-lime-400',
        red: 'text-red-400',
    }

    // Calcular valor total de la columna
    const totalValue = contacts.reduce((sum, c) => sum + (c.estimated_value || 0), 0)

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col flex-1 min-w-[85vw] md:min-w-[320px] snap-center border rounded-xl ${colorClasses[color]} h-full`}
        >
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${headerColors[color]}`}>{stage}</h3>
                    <span className="text-sm text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">
                        {contacts.length}
                    </span>
                </div>
                {totalValue > 0 && (
                    <div className="text-xs text-gray-400 text-right font-mono">
                        {totalValue.toLocaleString()} €
                    </div>
                )}
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px]">
                {children}
                {contacts.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-600/50 text-xs border border-dashed border-white/5 rounded-lg py-8">
                        Arrastra clientes aquí
                    </div>
                )}
            </div>
        </div>
    )
}

export function PipelineKanban() {
    const { contacts, loading, updateContact } = useContacts()
    const [activeContact, setActiveContact] = useState<Contact | null>(null)

    // Optimistic update state
    const [localContacts, setLocalContacts] = useState<Contact[] | null>(null)

    // Sync local state when contacts are loaded
    if (!loading && localContacts === null && contacts.length > 0) {
        // Only set if we haven't initialized yet
        // Actually, better to derive from props and use local state only for dragging visual feedback?
        // Or maintain full local state copy? Simpler: derive from 'contacts' props, 
        // but optimistic update relies on updateContact being fast or manipulating local list.
        // Let's rely on 'contacts' prop and optimistic update via useContacts hook if it supports it, 
        // or just accept the slight delay. useContacts does "setContacts" optimistically in Step 290.
        // So we don't need complex local state here if useContacts updates its state immediately.
        // Checking Step 290: createContact uses setContacts(prev => [data, ...prev]). updateContact uses setContacts(prev => map...).
        // BUT updateContact in Step 290 waits for Supabase result (await supabase...). 
        // It's not fully optimistic. It waits for DB.
        // I will implement a quick local optimistic update layer here if needed, but draggable usually handles the visual 'drag'.
        // The 'drop' delay is the issue. I'll modify handleDragEnd to update visually.
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {PIPELINE_STAGES.map(stage => (
                    <div key={stage.id} className="flex flex-col flex-1 min-w-[160px] border border-white/10 rounded-xl animate-pulse">
                        <div className="p-4 border-b border-white/10">
                            <div className="h-5 bg-white/10 rounded w-24" />
                        </div>
                        <div className="p-3 space-y-3">
                            <div className="bg-white/5 rounded-lg p-4 h-24" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const contactsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage.id] = contacts.filter(c => c.pipeline_stage === stage.id)
        return acc
    }, {} as Record<string, Contact[]>)

    const handleDragStart = (event: DragStartEvent) => {
        const contact = event.active.data.current?.contact as Contact
        setActiveContact(contact)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        setActiveContact(null)

        if (!over) return

        const contactId = active.id as string
        const newStage = over.id as string
        const contact = contacts.find(c => c.id === contactId)

        if (contact && contact.pipeline_stage !== newStage) {
            // Optimistic execution: The hook updateContact waits for DB.
            // But we can trigger it and let the UI updates come from the hook's state update.
            // If we want instant feedback, we'd need to mock the state update here. 
            // Given Supabase speed, let's try direct call first.
            try {
                await updateContact(contactId, { pipeline_stage: newStage })
            } catch (error) {
                console.error("Failed to update pipeline stage", error)
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            autoScroll={{
                acceleration: 0,
                interval: 5,
                layoutShiftCompensation: {
                    x: false,
                    y: false
                }
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-scroll snap-x snap-mandatory px-4 pb-4 min-h-[calc(100vh-200px)] w-full scrollbar-hide">
                {PIPELINE_STAGES.map(stage => (
                    <PipelineColumn
                        key={stage.id}
                        stage={stage.label}
                        stageId={stage.id}
                        contacts={contactsByStage[stage.id] || []}
                        color={stage.color}
                    >
                        {contactsByStage[stage.id]?.map(contact => (
                            <DraggableContact key={contact.id} contact={contact} />
                        ))}
                    </PipelineColumn>
                ))}
            </div>

            <DragOverlay>
                {activeContact ? (
                    <div className="w-[280px] opacity-90 rotate-3 cursor-grabbing">
                        <PipelineCard contact={activeContact} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
