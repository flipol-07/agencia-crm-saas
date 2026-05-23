import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'


const incomingSchema = z.object({
    contacts: z.array(z.record(z.string(), z.string())).min(1).max(1000),
})

const BATCH_SIZE = 100

const STAGE_MAP: Record<string, string> = {
    nuevo: 'nuevo', new: 'nuevo',
    cualificacion: 'cualificacion', qualified: 'cualificacion',
    propuesta: 'propuesta', proposal: 'propuesta',
    enviada: 'enviada', sent: 'enviada',
    ganado: 'ganado', won: 'ganado',
    perdido: 'perdido', lost: 'perdido',
}

const SOURCE_MAP: Record<string, string> = {
    whatsapp: 'inbound_whatsapp', 'inbound_whatsapp': 'inbound_whatsapp',
    email: 'inbound_email', 'inbound_email': 'inbound_email',
    outbound: 'outbound',
    referral: 'referral', referido: 'referral',
    website: 'website', web: 'website',
    other: 'other', otro: 'other',
}

interface NormalizedContact {
    company_name: string
    contact_name?: string | null
    email?: string | null
    phone?: string | null
    tax_id?: string | null
    tax_address?: string | null
    website?: string | null
    notes?: string | null
    pipeline_stage: string
    source: string
    estimated_value?: number | null
    created_by: string
    assigned_to: string
}

function normalize(raw: Record<string, string>, userId: string): NormalizedContact | null {
    const company_name = (raw.company_name || '').trim()
    if (!company_name) return null

    const stageKey = (raw.pipeline_stage || '').toLowerCase().trim()
    const sourceKey = (raw.source || '').toLowerCase().trim()
    const valueNum = raw.estimated_value ? Number(raw.estimated_value.replace(',', '.')) : null

    return {
        company_name,
        contact_name: raw.contact_name?.trim() || null,
        email: raw.email?.trim().toLowerCase() || null,
        phone: raw.phone?.trim() || null,
        tax_id: raw.tax_id?.trim() || null,
        tax_address: raw.tax_address?.trim() || null,
        website: raw.website?.trim() || null,
        notes: raw.notes?.trim() || null,
        pipeline_stage: STAGE_MAP[stageKey] || 'nuevo',
        source: SOURCE_MAP[sourceKey] || 'other',
        estimated_value: valueNum !== null && Number.isFinite(valueNum) ? valueNum : null,
        created_by: userId,
        assigned_to: userId,
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const parsed = incomingSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }

    const normalized: NormalizedContact[] = []
    const errors: string[] = []
    parsed.data.contacts.forEach((raw, idx) => {
        const norm = normalize(raw, user.id)
        if (!norm) {
            errors.push(`Fila ${idx + 2}: company_name vacío`)
            return
        }
        normalized.push(norm)
    })

    if (normalized.length === 0) {
        return NextResponse.json({ created: 0, updated: 0, skipped: 0, errors }, { status: 200 })
    }

    // Buscar contactos existentes por email o teléfono para hacer merge no destructivo.
    const emails = Array.from(new Set(normalized.map(c => c.email).filter(Boolean) as string[]))
    const phones = Array.from(new Set(normalized.map(c => c.phone).filter(Boolean) as string[]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = supabase as any
    interface ExistingRow { id: string; email: string | null; phone: string | null; contact_name: string | null; tax_id: string | null; tax_address: string | null; website: string | null; notes: string | null }
    let existing: ExistingRow[] = []
    if (emails.length > 0 || phones.length > 0) {
        const filters: string[] = []
        if (emails.length > 0) filters.push(`email.in.(${emails.map(e => `"${e}"`).join(',')})`)
        if (phones.length > 0) filters.push(`phone.in.(${phones.map(p => `"${p}"`).join(',')})`)
        const { data } = await supa.from('contacts').select('id,email,phone,contact_name,tax_id,tax_address,website,notes')
            .or(filters.join(','))
            .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
        existing = (data || []) as ExistingRow[]
    }

    const existingByEmail = new Map<string, ExistingRow>()
    const existingByPhone = new Map<string, ExistingRow>()
    existing.forEach(row => {
        if (row.email) existingByEmail.set(row.email, row)
        if (row.phone) existingByPhone.set(row.phone, row)
    })

    const toInsert: NormalizedContact[] = []
    const toUpdate: { id: string; patch: Partial<NormalizedContact> }[] = []

    for (const c of normalized) {
        const match = (c.email && existingByEmail.get(c.email)) || (c.phone && existingByPhone.get(c.phone)) || null
        if (match) {
            const patch: Partial<NormalizedContact> = {}
            if (!match.contact_name && c.contact_name) patch.contact_name = c.contact_name
            if (!match.tax_id && c.tax_id) patch.tax_id = c.tax_id
            if (!match.tax_address && c.tax_address) patch.tax_address = c.tax_address
            if (!match.website && c.website) patch.website = c.website
            if (!match.notes && c.notes) patch.notes = c.notes
            if (Object.keys(patch).length > 0) toUpdate.push({ id: match.id, patch })
            else toUpdate.push({ id: match.id, patch: {} })
        } else {
            toInsert.push(c)
        }
    }

    let created = 0
    let updated = 0

    // Inserts por batches.
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE)
        const { error, count } = await supa.from('contacts').insert(batch, { count: 'exact' })
        if (error) {
            errors.push(`Lote ${i / BATCH_SIZE + 1}: ${error.message}`)
        } else {
            created += count ?? batch.length
        }
    }

    // Updates con cambios reales.
    for (const u of toUpdate) {
        if (Object.keys(u.patch).length === 0) continue
        const { error } = await supa.from('contacts').update(u.patch).eq('id', u.id)
        if (error) errors.push(`Update ${u.id}: ${error.message}`)
        else updated += 1
    }

    const skipped = toUpdate.length - updated

    revalidateTag('contacts', 'max')

    return NextResponse.json({ created, updated, skipped, errors }, { status: 200 })
}
