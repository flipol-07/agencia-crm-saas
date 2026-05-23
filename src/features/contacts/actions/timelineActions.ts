'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export type TimelineEventType = 'email' | 'meeting' | 'invoice' | 'task' | 'note'

export interface TimelineEvent {
    id: string
    type: TimelineEventType
    occurred_at: string // ISO
    title: string
    subtitle?: string
    meta?: string
    href?: string
}

const inputSchema = z.object({
    contactId: z.string().uuid('contactId inválido'),
    limit: z.number().int().positive().max(500).optional(),
})

export async function getContactTimelineAction(input: unknown): Promise<{ success: boolean; events?: TimelineEvent[]; error: string | null }> {
    const parsed = inputSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    const limit = parsed.data.limit || 200
    const contactId = parsed.data.contactId
    const events: TimelineEvent[] = []

    const [
        { data: emails },
        { data: meetings },
        { data: invoices },
        { data: tasks },
        { data: contact },
    ] = await Promise.all([
        supa.from('contact_emails').select('id, subject, snippet, direction, received_at, sent_at, created_at').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(limit),
        supa.from('meetings').select('id, title, date, summary').eq('contact_id', contactId).order('date', { ascending: false }).limit(limit),
        supa.from('invoices').select('id, invoice_number, status, issue_date, subtotal, tax_amount, currency').eq('contact_id', contactId).eq('created_by', user.id).order('issue_date', { ascending: false }).limit(limit),
        supa.from('tasks').select('id, title, status, due_date, completed_at, created_at').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(limit),
        supa.from('contacts').select('id, notes, updated_at').eq('id', contactId).maybeSingle(),
    ])

    for (const e of (emails || []) as Array<{ id: string; subject: string | null; snippet: string | null; direction: string | null; received_at: string | null; sent_at: string | null; created_at: string }>) {
        events.push({
            id: `email-${e.id}`,
            type: 'email',
            occurred_at: e.received_at || e.sent_at || e.created_at,
            title: e.subject || '(sin asunto)',
            subtitle: e.direction === 'inbound' ? 'Email recibido' : 'Email enviado',
            meta: e.snippet || undefined,
        })
    }

    for (const m of (meetings || []) as Array<{ id: string; title: string; date: string; summary: string | null }>) {
        events.push({
            id: `meeting-${m.id}`,
            type: 'meeting',
            occurred_at: m.date,
            title: m.title,
            subtitle: 'Reunión',
            meta: m.summary || undefined,
            href: `/meetings`,
        })
    }

    for (const inv of (invoices || []) as Array<{ id: string; invoice_number: string | null; status: string; issue_date: string; subtotal: number; tax_amount: number; currency: string }>) {
        const total = (inv.subtotal || 0) + (inv.tax_amount || 0)
        events.push({
            id: `invoice-${inv.id}`,
            type: 'invoice',
            occurred_at: inv.issue_date,
            title: inv.invoice_number || 'Borrador',
            subtitle: `Factura · ${inv.status}`,
            meta: total.toLocaleString('es-ES', { style: 'currency', currency: inv.currency || 'EUR' }),
            href: `/invoices/${inv.id}`,
        })
    }

    for (const t of (tasks || []) as Array<{ id: string; title: string; status: string; due_date: string | null; completed_at: string | null; created_at: string }>) {
        events.push({
            id: `task-${t.id}`,
            type: 'task',
            occurred_at: t.completed_at || t.due_date || t.created_at,
            title: t.title,
            subtitle: `Tarea · ${t.status}`,
            href: '/tasks',
        })
    }

    if (contact && typeof contact === 'object' && contact !== null) {
        const c = contact as { notes: string | null; updated_at: string | null }
        if (c.notes && c.notes.trim() && c.updated_at) {
            events.push({
                id: `note-${contactId}`,
                type: 'note',
                occurred_at: c.updated_at,
                title: 'Notas del contacto',
                meta: c.notes.length > 240 ? c.notes.slice(0, 240) + '…' : c.notes,
            })
        }
    }

    events.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())

    return { success: true, events, error: null }
}
