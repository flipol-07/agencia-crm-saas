import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toCsv } from '@/features/contacts/lib/csv'
import type { Contact } from '@/types/database'


const EXPORT_COLUMNS = [
    'company_name',
    'contact_name',
    'email',
    'phone',
    'tax_id',
    'tax_address',
    'website',
    'pipeline_stage',
    'status',
    'source',
    'estimated_value',
    'probability_close',
    'notes',
    'created_at',
] as const

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const stage = searchParams.get('stage')?.trim() || ''
    const source = searchParams.get('source')?.trim() || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = (supabase.from('contacts') as any)
        .select(EXPORT_COLUMNS.join(','))
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10000)

    if (search) {
        const safe = search.replace(/[%,()]/g, '').slice(0, 80)
        query = query.or(
            [
                `company_name.ilike.%${safe}%`,
                `contact_name.ilike.%${safe}%`,
                `email.ilike.%${safe}%`,
            ].join(',')
        )
    }
    if (stage) query = query.eq('pipeline_stage', stage)
    if (source) query = query.eq('source', source)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data || []) as Partial<Contact>[]
    const csvRows: (string | number | null | undefined)[][] = [
        [...EXPORT_COLUMNS],
        ...rows.map(r => EXPORT_COLUMNS.map(col => {
            const v = (r as Record<string, unknown>)[col]
            if (v === null || v === undefined) return ''
            if (typeof v === 'object') return JSON.stringify(v)
            return v as string | number
        })),
    ]

    const csv = '﻿' + toCsv(csvRows, ',') // BOM para Excel español.
    const filename = `contacts-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    })
}
